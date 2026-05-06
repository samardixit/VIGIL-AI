"""
VIGIL-AI Database Connection Module
Async SQLAlchemy engine + session factory using mysql+aiomysql.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.core.config import get_settings

settings = get_settings()

# Create async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Session factory — produces new AsyncSession instances
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """
    FastAPI dependency that provides an async database session.
    Automatically closes the session when the request is complete.
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
