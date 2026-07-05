import uuid
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.memory.profile_service import ProfileService
from app.memory.learning_service import LearningService
from app.memory.summary_service import SummaryService

logger = logging.getLogger("app.memory.manager")


class MemoryManager:
    """
    Unified Coordinator managing user configuration profiles, progress indicators,
    and dialogue summary contexts.
    """

    @staticmethod
    def get_memory_context(
        db: Session,
        user_id: uuid.UUID,
        conversation_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        logger.info(f"Gathering memory context for user: {user_id}")

        # 1. Fetch user preferences
        pref = ProfileService.get_or_create_preference(db, user_id)
        
        # 2. Fetch learning profile details
        profile = LearningService.get_or_create_learning_profile(db, user_id)

        # 3. Retrieve active conversation summary
        summary = "No active dialogue context."
        if conversation_id:
            try:
                summary = SummaryService.summarize_conversation(db, conversation_id)
            except Exception as e:
                logger.warning(f"Could not load conversation summary for context: {e}")

        # 4. Serialize models to dictionaries
        import json
        
        try:
            strong_list = json.loads(profile.strong_topics)
            weak_list = json.loads(profile.weak_topics)
        except Exception:
            strong_list = []
            weak_list = []

        return {
            "preferences": {
                "preferred_language": pref.preferred_language,
                "preferred_role": pref.preferred_role,
                "target_company": pref.target_company,
                "daily_study_hours": pref.daily_study_hours,
                "current_skill_level": pref.current_skill_level,
                "learning_style": pref.learning_style,
                "preferred_interview_type": pref.preferred_interview_type
            },
            "learning_profile": {
                "strong_topics": strong_list,
                "weak_topics": weak_list,
                "completed_study_plans": profile.completed_study_plans,
                "completed_interviews": profile.completed_interviews,
                "resume_score": profile.resume_score,
                "placement_readiness": profile.placement_readiness
            },
            "conversation_summary": summary
        }
