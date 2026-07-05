import json
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.memory import LearningProfile
from app.models.planner import StudyPlan, StudyDay
from app.models.interview import Resume, InterviewSession
from app.models.progress import WeakTopic, LearningAnalytics

logger = logging.getLogger("app.memory.learning_service")


class LearningService:
    """
    Service Layer aggregating academic history statistics to build candidate learning profiles.
    """

    @staticmethod
    def get_or_create_learning_profile(db: Session, user_id: uuid.UUID) -> LearningProfile:
        """
        Retrieves learning profile cache row, initializing database aggregations if absent.
        """
        profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()
        if not profile:
            logger.info(f"Initializing fresh LearningProfile for: {user_id}")
            # Auto-aggregate current stats
            profile = LearningService.update_learning_profile_cache(db, user_id)
        return profile

    @staticmethod
    def update_learning_profile_cache(db: Session, user_id: uuid.UUID) -> LearningProfile:
        """
        Re-scans study milestones, resumes, and interview feedback records
        to save compiled statistics in the LearningProfile cache row.
        """
        logger.info(f"Recalculating LearningProfile cache for user: {user_id}")

        # 1. Total completed study plans
        plans_count = db.query(StudyPlan).filter(StudyPlan.user_id == user_id).count()

        # 2. Total completed interviews
        sessions_count = db.query(InterviewSession).filter(InterviewSession.user_id == user_id).count()

        # 3. Resume ATS Rating
        latest_resume = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).first()
        resume_score = 0.0
        if latest_resume:
            import json
            try:
                parsed = json.loads(latest_resume.parsed_json)
                # Baseline mock score if present, else 75
                resume_score = float(parsed.get("ats_score", 75.0))
            except Exception:
                resume_score = 70.0

        # 4. Placement Readiness overall index
        latest_analytics = db.query(LearningAnalytics).filter(
            LearningAnalytics.user_id == user_id
        ).order_by(LearningAnalytics.created_at.desc()).first()
        readiness = latest_analytics.overall_score if latest_analytics else 55.0

        # 5. Extract Weak topics list
        weaks = db.query(WeakTopic).filter(WeakTopic.user_id == user_id).all()
        weak_topics_list = list(set([w.topic for w in weaks]))

        # 6. Compile Strong topics list
        # Extract topics completed successfully in study plan that are not marked as weak
        strong_days = db.query(StudyDay).join(StudyPlan).filter(
            StudyPlan.user_id == user_id,
            StudyDay.status == "completed"
        ).all()
        strong_topics_raw = [d.topic for d in strong_days if d.topic]
        strong_topics_list = list(set([t for t in strong_topics_raw if t not in weak_topics_list]))

        # Fetch profile or create new
        profile = db.query(LearningProfile).filter(LearningProfile.user_id == user_id).first()
        if not profile:
            profile = LearningProfile(user_id=user_id)
            db.add(profile)

        # Update cache attributes
        profile.strong_topics = json.dumps(strong_topics_list[:8])  # limit to top 8
        profile.weak_topics = json.dumps(weak_topics_list[:8])
        profile.completed_study_plans = plans_count
        profile.completed_interviews = sessions_count
        profile.resume_score = resume_score
        profile.placement_readiness = readiness
        profile.last_learning_activity = datetime.utcnow()

        db.commit()
        db.refresh(profile)
        return profile
