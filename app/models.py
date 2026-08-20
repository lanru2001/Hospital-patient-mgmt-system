import uuid
from datetime import datetime

from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """Staff accounts (clinicians, admins). RBAC via `role`."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="clinician")  # admin | clinician | staff
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mrn = Column(String, unique=True, nullable=False, index=True)  # medical record number
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    sex = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    # Encrypted at rest via RDS storage encryption (see rds.tf); consider
    # field-level encryption (e.g. pgcrypto) for SSN/insurance IDs.
    insurance_id = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)  # soft delete for record retention

    audit_entries = relationship("AuditLog", back_populates="patient")


class AuditLog(Base):
    """Every read/write to a patient record is logged for HIPAA compliance."""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # VIEW | CREATE | UPDATE | DELETE
    timestamp = Column(DateTime, default=datetime.utcnow)
    detail = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="audit_entries")
