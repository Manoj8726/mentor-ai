import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Float, Integer, Date, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.database.session import Base


class LearningAnalytics(Base):
    __tablename__ = "learning_analytics"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    overall_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    study_completion_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    interview_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    resume_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    knowledge_base_usage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<LearningAnalytics {self.id} Overall: {self.overall_score}>"


class WeakTopic(Base):
    __tablename__ = "weak_topics"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)  # Tutor Quiz, Mock Interview, Study Plan

    def __repr__(self) -> str:
        return f"<WeakTopic {self.topic} Source: {self.source} Conf: {self.confidence}>"


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), nullable=False)  # High, Medium, Low
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, completed, dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Recommendation {self.title} Status: {self.status}>"


class StudyStreak(Base):
    __tablename__ = "study_streaks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_active_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    def __repr__(self) -> str:
        return f"<StudyStreak User: {self.user_id} Streak: {self.current_streak}>"
