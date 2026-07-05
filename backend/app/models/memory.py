import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Float, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.database.session import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

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
        unique=True,
        index=True
    )
    preferred_language: Mapped[str] = mapped_column(String(50), default="English", nullable=False)
    preferred_role: Mapped[str] = mapped_column(String(100), default="Full Stack Developer", nullable=False)
    target_company: Mapped[str] = mapped_column(String(100), default="Any Company", nullable=False)
    daily_study_hours: Mapped[float] = mapped_column(Float, default=2.0, nullable=False)
    current_skill_level: Mapped[str] = mapped_column(String(50), default="Beginner", nullable=False)
    learning_style: Mapped[str] = mapped_column(String(100), default="Video Lectures & Code Practice", nullable=False)
    preferred_interview_type: Mapped[str] = mapped_column(String(100), default="Technical Coding", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<UserPreference {self.id} User: {self.user_id}>"


class LearningProfile(Base):
    __tablename__ = "learning_profiles"

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
        unique=True,
        index=True
    )
    strong_topics: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    weak_topics: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    completed_study_plans: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_interviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    resume_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    placement_readiness: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    last_learning_activity: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<LearningProfile {self.id} User: {self.user_id}>"
