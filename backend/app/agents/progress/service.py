import uuid
import logging
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.models.progress import LearningAnalytics, WeakTopic, Recommendation, StudyStreak
from app.agents.progress.analytics_engine import AnalyticsEngine
from app.agents.progress.graph import progress_graph
from app.agents.progress.state import ProgressState

logger = logging.getLogger("app.agents.progress.service")


class ProgressService:
    """
    Service Layer managing user streak increments, triggering recalculated analytics graphs,
    and retrieving learning scorecards.
    """

    @staticmethod
    def get_or_create_streak(db: Session, user_id: uuid.UUID) -> StudyStreak:
        """
        Retrieves the streak record for the user, initializing one if absent.
        """
        streak = db.query(StudyStreak).filter(StudyStreak.user_id == user_id).first()
        if not streak:
            streak = StudyStreak(
                user_id=user_id,
                current_streak=0,
                longest_streak=0,
                last_active_date=None
            )
            db.add(streak)
            db.commit()
            db.refresh(streak)
        return streak

    @staticmethod
    def update_streak(db: Session, user_id: uuid.UUID) -> StudyStreak:
        """
        Increments active study streaks if active logging occurred on consecutive days.
        """
        streak = ProgressService.get_or_create_streak(db, user_id)
        today = datetime.utcnow().date()

        if streak.last_active_date is None:
            # First activity ever
            streak.current_streak = 1
            streak.longest_streak = max(streak.longest_streak, 1)
            streak.last_active_date = today
        else:
            delta = today - streak.last_active_date
            if delta.days == 1:
                # Active on consecutive day
                streak.current_streak += 1
                streak.longest_streak = max(streak.longest_streak, streak.current_streak)
                streak.last_active_date = today
            elif delta.days > 1:
                # Streak broken, reset
                streak.current_streak = 1
                streak.last_active_date = today
            # If delta.days == 0 (already active today), do nothing

        db.commit()
        db.refresh(streak)
        return streak

    @staticmethod
    def recalculate_analytics(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """
        Assembles all db metrics logs, runs the Progress LangGraph state machine,
        flushes past recommendations, and saves updated metrics.
        """
        logger.info(f"Triggering recalculate_analytics workflow for: {user_id}")

        # 1. Gather raw data aggregates
        raw_metrics = AnalyticsEngine.collect_user_metrics(db, user_id)

        # 2. Invoke state graph machine
        initial_state = ProgressState(
            user_id=user_id,
            collected_raw_data=raw_metrics,
            behavior_analysis={},
            weak_topics=[],
            recommendations=[],
            readiness_prediction={}
        )

        final_state = progress_graph.invoke(initial_state)

        weak_list = final_state.get("weak_topics", [])
        recs_list = final_state.get("recommendations", [])
        prediction = final_state.get("readiness_prediction", {})

        # Calculate overall score as average of readiness indicators
        placement_ready = float(prediction.get("placement_readiness", 50.0))
        interview_ready = float(prediction.get("interview_readiness", 50.0))
        consistency_ready = float(prediction.get("study_consistency", 50.0))
        overall_score = (placement_ready + interview_ready + consistency_ready) / 3.0

        # 3. Wipe old weak topics and recommendations (to avoid duplicate logs)
        db.query(WeakTopic).filter(WeakTopic.user_id == user_id).delete()
        db.query(Recommendation).filter(
            Recommendation.user_id == user_id,
            Recommendation.status == "pending"
        ).delete()

        # 4. Save new weak topics
        for w in weak_list:
            db_w = WeakTopic(
                user_id=user_id,
                topic=w.get("topic", "Coding concepts"),
                confidence=float(w.get("confidence", 0.5)),
                source=w.get("source", "Tutor Quiz")
            )
            db.add(db_w)

        # 5. Save new recommendations
        for r in recs_list:
            db_r = Recommendation(
                user_id=user_id,
                title=r.get("title", "Review topic"),
                description=r.get("description", "Take revision tasks."),
                priority=r.get("priority", "Medium"),
                status="pending"
            )
            db.add(db_r)

        # 6. Record analytics log row
        analytics_log = LearningAnalytics(
            user_id=user_id,
            overall_score=overall_score,
            study_completion_percentage=float(raw_metrics.get("study_completion_percentage", 0.0)),
            interview_score=float(raw_metrics.get("interview_score_avg", 0.0)),
            resume_score=float(raw_metrics.get("resume_score_max", 0.0)),
            knowledge_base_usage=int(raw_metrics.get("knowledge_base_usage", 0))
        )
        db.add(analytics_log)

        db.commit()

        # Compile final dictionary response matching schema
        streak = ProgressService.get_or_create_streak(db, user_id)
        
        # Reload fresh recommendations and weak topics
        db_weaks = db.query(WeakTopic).filter(WeakTopic.user_id == user_id).all()
        db_recs = db.query(Recommendation).filter(
            Recommendation.user_id == user_id,
            Recommendation.status == "pending"
        ).all()

        return {
            "overall_score": overall_score,
            "study_completion_percentage": raw_metrics["study_completion_percentage"],
            "interview_score": raw_metrics["interview_score_avg"],
            "resume_score": raw_metrics["resume_score_max"],
            "knowledge_base_usage": raw_metrics["knowledge_base_usage"],
            "streak": streak,
            "weak_topics": db_weaks,
            "recommendations": db_recs,
            "placement_readiness": placement_ready,
            "interview_readiness": interview_ready,
            "study_consistency": consistency_ready,
            "readiness_explanation": prediction.get("readiness_explanation", "Consistent practice is required."),
            "weekly_activity_chart": raw_metrics["weekly_activity_chart"],
            "interview_score_trend_chart": raw_metrics["interview_score_trend_chart"]
        }

    @staticmethod
    def get_dashboard_data(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """
        Resolves latest analytics records. Triggers recalculate if no previous logs exist.
        """
        latest_log = db.query(LearningAnalytics).filter(
            LearningAnalytics.user_id == user_id
        ).order_by(LearningAnalytics.created_at.desc()).first()

        if not latest_log:
            # Auto-trigger recalculation if no dashboard entries exist yet
            return ProgressService.recalculate_analytics(db, user_id)

        raw_metrics = AnalyticsEngine.collect_user_metrics(db, user_id)
        streak = ProgressService.get_or_create_streak(db, user_id)
        db_weaks = db.query(WeakTopic).filter(WeakTopic.user_id == user_id).all()
        db_recs = db.query(Recommendation).filter(
            Recommendation.user_id == user_id,
            Recommendation.status == "pending"
        ).all()

        # Approximate readiness predictors based on stats if we just read previous log
        study_completion = latest_log.study_completion_percentage
        interview_score = latest_log.interview_score
        
        # Simple calculations to mock readiness mapping
        placement_ready = (study_completion * 0.4) + (interview_score * 0.6) if interview_score > 0 else (study_completion * 0.8)
        placement_ready = min(max(placement_ready, 40.0), 98.0)
        
        interview_ready = interview_score if interview_score > 0 else 55.0
        study_consistency = study_completion if study_completion > 0 else 60.0

        return {
            "overall_score": latest_log.overall_score,
            "study_completion_percentage": study_completion,
            "interview_score": interview_score,
            "resume_score": latest_log.resume_score,
            "knowledge_base_usage": latest_log.knowledge_base_usage,
            "streak": streak,
            "weak_topics": db_weaks,
            "recommendations": db_recs,
            "placement_readiness": placement_ready,
            "interview_readiness": interview_ready,
            "study_consistency": study_consistency,
            "readiness_explanation": "Placement metrics are compiled based on completed study days and mock interviews performance.",
            "weekly_activity_chart": raw_metrics["weekly_activity_chart"],
            "interview_score_trend_chart": raw_metrics["interview_score_trend_chart"]
        }

    @staticmethod
    def update_recommendation_status(db: Session, user_id: uuid.UUID, rec_id: uuid.UUID, status: str) -> Optional[Recommendation]:
        """
        Updates the status of a recommendation card (pending, completed, dismissed).
        """
        rec = db.query(Recommendation).filter(
            Recommendation.id == rec_id,
            Recommendation.user_id == user_id
        ).first()

        if rec:
            rec.status = status
            db.commit()
            db.refresh(rec)
            
            # If marked completed, trigger streak increment to reward student consistency!
            if status == "completed":
                ProgressService.update_streak(db, user_id)
                
        return rec
