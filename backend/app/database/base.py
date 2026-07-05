# Import all declarative models so that SQLAlchemy Base.metadata
# contains them before being processed by migrations.
from app.database.session import Base
from app.models.user import User  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.conversation import Conversation, ConversationMessage  # noqa: F401
from app.models.planner import StudyPlan, StudyDay  # noqa: F401
from app.models.interview import Resume, InterviewSession, InterviewQuestion, InterviewFeedback  # noqa: F401
from app.models.progress import LearningAnalytics, WeakTopic, Recommendation, StudyStreak  # noqa: F401
from app.models.memory import UserPreference, LearningProfile  # noqa: F401
