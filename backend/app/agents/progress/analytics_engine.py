import uuid
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.conversation import Conversation, ConversationMessage
from app.models.planner import StudyPlan, StudyDay
from app.models.interview import Resume, InterviewSession, InterviewQuestion, InterviewFeedback

logger = logging.getLogger("app.agents.progress.analytics_engine")


class AnalyticsEngine:
    """
    Core engine collecting raw performance metrics from database records
    to feed state nodes and compile charting metrics.
    """

    @staticmethod
    def collect_user_metrics(db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """
        Gathers raw counters, percentages, and performance averages for the user.
        """
        logger.info(f"Running metrics collection engine for user: {user_id}")

        # 1. Tutor Conversations Metrics
        threads = db.query(Conversation).filter(Conversation.user_id == user_id).all()
        thread_ids = [t.id for t in threads]
        message_count = 0
        quiz_errors_sample = []
        
        if thread_ids:
            message_count = db.query(ConversationMessage).filter(
                ConversationMessage.conversation_id.in_(thread_ids)
            ).count()
            
            # Sample tutor explanations containing quizzes to analyze for weak topics
            quiz_msgs = db.query(ConversationMessage).filter(
                ConversationMessage.conversation_id.in_(thread_ids),
                ConversationMessage.role != "user",
                ConversationMessage.content.like("%Quiz%")
            ).limit(3).all()
            quiz_errors_sample = [m.content for m in quiz_msgs]

        # 2. Study Plan Progress Metrics
        plans = db.query(StudyPlan).filter(StudyPlan.user_id == user_id).all()
        plan_ids = [p.id for p in plans]
        completed_days_count = 0
        total_days_count = 0
        incomplete_topics_sample = []

        if plan_ids:
            completed_days_count = db.query(StudyDay).filter(
                StudyDay.study_plan_id.in_(plan_ids),
                StudyDay.status == "completed"
            ).count()
            total_days_count = db.query(StudyDay).filter(
                StudyDay.study_plan_id.in_(plan_ids)
            ).count()
            
            # Fetch sample of incomplete topics
            incomplete_days = db.query(StudyDay).filter(
                StudyDay.study_plan_id.in_(plan_ids),
                StudyDay.status == "pending"
            ).limit(4).all()
            incomplete_topics_sample = [d.topic for d in incomplete_days]

        study_completion = (completed_days_count / total_days_count * 100) if total_days_count > 0 else 0.0

        # 3. Mock Interviews Metrics
        sessions = db.query(InterviewSession).filter(InterviewSession.user_id == user_id).all()
        sessions_count = len(sessions)
        avg_interview_score = 0.0
        interview_mistakes_sample = []

        if sessions_count > 0:
            scores = [s.overall_score for s in sessions if s.overall_score > 0]
            if scores:
                avg_interview_score = sum(scores) / len(scores)

            # Sample low score questions
            low_q = db.query(InterviewQuestion).filter(
                InterviewQuestion.session_id.in_([s.id for s in sessions]),
                InterviewQuestion.score < 6.0
            ).limit(4).all()
            interview_mistakes_sample = [f"Q: {q.question} (Score: {q.score}) - Feedback: {q.feedback}" for q in low_q]

        # 4. Resume & ATS Ratings
        latest_resume = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).first()
        resume_score = 0.0
        parsed_resume_json = {}
        if latest_resume:
            import json
            try:
                parsed_resume_json = json.loads(latest_resume.parsed_json)
                # Attempt to extract score from previous analysis row or default to 75
                # For simplicity, if we don't have separate ATS table, set baseline to 75
                resume_score = 75.0
            except Exception:
                pass

        # 5. Knowledge Base Usage
        kb_docs_count = db.query(Document).filter(Document.user_id == user_id).count()

        # 6. Weekly Activity Chart Data (Mon-Sun)
        # We parse the last 7 days and check completed study milestones or mock session counts
        weekly_activity = []
        today = datetime.utcnow().date()
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_label = day_date.strftime("%a")
            
            # Check completed study days on this date
            day_completion = 0
            if plan_ids:
                day_completion = db.query(StudyDay).filter(
                    StudyDay.study_plan_id.in_(plan_ids),
                    StudyDay.date == day_date,
                    StudyDay.status == "completed"
                ).count()
                
            weekly_activity.append({
                "day": day_label,
                "study_milestones": day_completion,
                "study_hours": day_completion * 2  # Simulated 2 hours per completed milestone
            })

        # 7. Interview Score Trend Chart Data
        interview_trend = []
        sorted_sessions = sorted(sessions, key=lambda x: x.created_at)
        for s in sorted_sessions[-5:]:  # Last 5 sessions
            interview_trend.append({
                "date": s.created_at.strftime("%m/%d"),
                "score": s.overall_score
            })

        return {
            "tutor_conversations_count": len(threads),
            "tutor_messages_count": message_count,
            "quiz_errors_sample": quiz_errors_sample,
            "study_plans_count": len(plans),
            "study_completion_percentage": study_completion,
            "incomplete_topics_sample": incomplete_topics_sample,
            "mock_interviews_count": sessions_count,
            "interview_score_avg": avg_interview_score,
            "interview_mistakes_sample": interview_mistakes_sample,
            "resume_score_max": resume_score,
            "parsed_resume": parsed_resume_json,
            "knowledge_base_usage": kb_docs_count,
            "weekly_activity_chart": weekly_activity,
            "interview_score_trend_chart": interview_trend
        }
