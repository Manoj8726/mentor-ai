import uuid
import logging
from sqlalchemy.orm import Session
from app.models.memory import UserPreference
from app.schemas.memory import UserPreferenceUpdate

logger = logging.getLogger("app.memory.profile_service")


class ProfileService:
    """
    Service Layer managing user profile configuration preferences database records.
    """

    @staticmethod
    def get_or_create_preference(db: Session, user_id: uuid.UUID) -> UserPreference:
        """
        Retrieves preference row, or instantiates baseline fallback defaults.
        """
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            logger.info(f"Creating default UserPreference row for user: {user_id}")
            pref = UserPreference(
                user_id=user_id,
                preferred_language="English",
                preferred_role="Full Stack Developer",
                target_company="FAANG",
                daily_study_hours=2.0,
                current_skill_level="Beginner",
                learning_style="Video Lectures & Code Practice",
                preferred_interview_type="Technical Coding"
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    @staticmethod
    def update_preference(
        db: Session,
        user_id: uuid.UUID,
        payload: UserPreferenceUpdate
    ) -> UserPreference:
        """
        Updates preference fields and records timestamp change.
        """
        pref = ProfileService.get_or_create_preference(db, user_id)
        
        update_data = payload.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(pref, key, val)

        db.commit()
        db.refresh(pref)
        logger.info(f"Updated preferences for user: {user_id}")
        return pref
