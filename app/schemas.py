import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict


class PatientBase(BaseModel):
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: date
    sex: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    insurance_id: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    insurance_id: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None


class PatientOut(PatientBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "clinician"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
