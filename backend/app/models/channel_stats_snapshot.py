from sqlalchemy import Integer, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.database import Base


class ChannelStatsSnapshot(Base):
    __tablename__ = "channel_stats_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    channel_id: Mapped[int] = mapped_column(ForeignKey("channels.id"))
    period_type: Mapped[str] = mapped_column(nullable=False)
    period_value: Mapped[int] = mapped_column(nullable=False)
    day_of_week: Mapped[int | None] = mapped_column(nullable=True)
    posts_count: Mapped[int] = mapped_column(Integer, default=0)
    total_views: Mapped[int] = mapped_column(Integer, default=0)
    total_reactions: Mapped[int] = mapped_column(Integer, default=0)
    subscribers_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
