import uuid
from datetime import datetime, date

from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    Integer,
    Uuid,
    Date,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Changed from String(500) to Text
    goal: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    hours_per_day: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    days: Mapped[list["StudyDay"]] = relationship(
        "StudyDay",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="StudyDay.day_number",
    )

    def __repr__(self) -> str:
        return f"<StudyPlan {self.id} Goal: {self.title}>"


class StudyDay(Base):
    __tablename__ = "study_days"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    study_plan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("study_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    day_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    # Changed from String(500) to Text
    topic: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    estimated_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )

    plan: Mapped["StudyPlan"] = relationship(
        "StudyPlan",
        back_populates="days",
    )

    def __repr__(self) -> str:
        return (
            f"<StudyDay {self.day_number} "
            f"Plan: {self.study_plan_id} "
            f"Status: {self.status}>"
        )