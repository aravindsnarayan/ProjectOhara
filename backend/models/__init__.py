"""
Project Ohara - Database Models
===============================
SQLAlchemy models for users, sessions, research.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from database import Base
import uuid


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    """User model - OAuth authenticated users."""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # OAuth fields
    provider = Column(String(50), nullable=False)  # google, github
    provider_id = Column(String(255), nullable=False)
    
    # Settings
    api_keys = Column(JSON, default=dict)  # {"openrouter": "key", "openai": "key", ...}
    preferences = Column(JSON, default=dict)  # {"language": "en", "theme": "dark", ...}
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sessions = relationship("ResearchSession", back_populates="user", cascade="all, delete-orphan")


class ResearchSession(Base):
    """Research session - contains messages, context, results."""
    __tablename__ = "research_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Session info
    title = Column(String(500), default="New Research")
    phase = Column(String(50), default="initial")  # initial, clarifying, planning, researching, done
    
    # Research state
    context_state = Column(JSON, default=dict)  # Full context state
    messages = Column(JSON, default=list)  # Chat messages
    
    # Results
    final_document = Column(Text, nullable=True)
    source_registry = Column(JSON, default=dict)  # {1: "url", 2: "url", ...}
    
    # Stats
    total_sources = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    
    # Mode
    academic_mode = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")


class Checkpoint(Base):
    """Research checkpoint for crash recovery."""
    __tablename__ = "checkpoints"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("research_sessions.id"), nullable=False, index=True)
    
    # Checkpoint data
    data = Column(JSON, nullable=False)  # Full checkpoint state
    status = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
