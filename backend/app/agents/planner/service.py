import uuid
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.planner import StudyPlan, StudyDay
from app.agents.planner.graph import planner_graph
from app.agents.planner.state import PlannerState
from app.schemas.planner import StudyPlanRequest

logger = logging.getLogger("app.agents.planner.service")


class PlannerService:
    """
    Service Layer coordinating LangGraph Planner execution, Preferred Weekday Scheduling,
    and PostgreSQL/MySQL database tracking.
    """

    @staticmethod
    def create_plan(
        db: Session,
        user_id: uuid.UUID,
        req: StudyPlanRequest
    ) -> StudyPlan:
        """
        Runs the LangGraph Planner pipeline, persists the resulting daily plan steps,
        calculates preferred study calendar dates, and returns the StudyPlan model.
        """
        # 1. Calculate Target Days between today and Exam target date
        today = date.today()
        delta = (req.exam_date - today).days
        days_count = max(delta, 1)

        # 2. Invoke State Graph
        initial_state = PlannerState(
            user_id=user_id,
            request_data={
                "goal": req.goal,
                "subjects": req.subjects,
                "hours_per_day": req.hours_per_day,
                "exam_date": str(req.exam_date),
                "skill_level": req.skill_level,
                "preferred_study_days": req.preferred_study_days,
                "days_count": days_count
            },
            analysis={},
            context_chunks=[],
            plan_days=[],
            revision_strategy={},
            recommendations={}
        )

        logger.info(f"Invoking Planner Agent LangGraph workflow for user {user_id}.")
        final_state = planner_graph.invoke(initial_state)

        plan_days = final_state.get("plan_days", [])
        recommendations = final_state.get("recommendations", {})

        # 3. Create StudyPlan row
        plan_title = f"{req.goal} ({days_count} Days Plan)"
        
        # Pull focus topics / recommended info for summary append
        motivational_txt = recommendations.get("motivational_summary", "Study consistently to reach your goal!")
        weak_topics = ", ".join(recommendations.get("weak_topics_suggestions", []))
        rec_pdfs = ", ".join(recommendations.get("recommended_pdfs", []))
        
        summary_append = f"\n\nMotivational Note: {motivational_txt}"
        if weak_topics:
            summary_append += f"\nFocus Targets: {weak_topics}"
        if rec_pdfs:
            summary_append += f"\nRecommended Files: {rec_pdfs}"

        db_plan = StudyPlan(
            user_id=user_id,
            title=plan_title,
            goal=req.goal + summary_append,
            start_date=today,
            end_date=req.exam_date,
            hours_per_day=req.hours_per_day,
            status="active"
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)

        # 4. Map weekdays to integer indexes (0=Monday, 6=Sunday)
        weekday_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        
        preferred_weekdays = [
            weekday_map[d.lower()]
            for d in req.preferred_study_days
            if d.lower() in weekday_map
        ]
        
        if not preferred_weekdays:
            # Fallback to all weekdays if none are set
            preferred_weekdays = list(range(7))

        # 5. Populate Study Days, skipping non-preferred weekdays
        current_date = today
        for idx, day in enumerate(plan_days):
            # Advance day and find next preferred weekday slot
            current_date += timedelta(days=1)
            while current_date.weekday() not in preferred_weekdays:
                current_date += timedelta(days=1)

            db_day = StudyDay(
                study_plan_id=db_plan.id,
                day_number=day.get("day_number", idx + 1),
                date=current_date,
                topic=day.get("topic", "Concept review session"),
                estimated_hours=day.get("estimated_hours", req.hours_per_day),
                status="pending"
            )
            db.add(db_day)

        db.commit()
        db.refresh(db_plan)
        return db_plan

    @staticmethod
    def get_user_plans(db: Session, user_id: uuid.UUID) -> List[StudyPlan]:
        """
        Retrieves all active and completed plans for the authenticated user.
        """
        return db.query(StudyPlan).filter(
            StudyPlan.user_id == user_id
        ).order_by(StudyPlan.created_at.desc()).all()

    @staticmethod
    def get_plan_by_id(db: Session, user_id: uuid.UUID, plan_id: uuid.UUID) -> Optional[StudyPlan]:
        """
        Retrieves full plan details and day segments. Verified ownership constraint.
        """
        return db.query(StudyPlan).filter(
            StudyPlan.id == plan_id,
            StudyPlan.user_id == user_id
        ).first()

    @staticmethod
    def delete_plan(db: Session, user_id: uuid.UUID, plan_id: uuid.UUID) -> None:
        """
        Removes a plan and cascades to wipe all associated study day progress steps.
        """
        db_plan = db.query(StudyPlan).filter(
            StudyPlan.id == plan_id,
            StudyPlan.user_id == user_id
        ).first()
        
        if db_plan:
            db.delete(db_plan)
            db.commit()

    @staticmethod
    def toggle_day_completion(db: Session, user_id: uuid.UUID, day_id: uuid.UUID) -> Optional[StudyDay]:
        """
        Toggles a day's status between pending and completed.
        Checks user ownership boundary.
        """
        db_day = db.query(StudyDay).join(StudyPlan).filter(
            StudyDay.id == day_id,
            StudyPlan.user_id == user_id
        ).first()

        if not db_day:
            return None

        # Toggle status
        db_day.status = "completed" if db_day.status == "pending" else "pending"
        db.commit()
        db.refresh(db_day)
        return db_day

    @staticmethod
    def calculate_progress(plan: StudyPlan) -> float:
        """
        Returns percentage progress of completed days.
        """
        total = len(plan.days)
        if total == 0:
            return 0.0
        completed = sum(1 for d in plan.days if d.status == "completed")
        return round((completed / total) * 100, 1)
