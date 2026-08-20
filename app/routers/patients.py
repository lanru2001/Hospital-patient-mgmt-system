import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models import AuditLog, Patient, User
from app.schemas import PatientCreate, PatientOut, PatientUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


def _log(db: Session, patient_id, user_id, action: str, detail: str = ""):
    db.add(AuditLog(patient_id=patient_id, user_id=user_id, action=action, detail=detail))
    db.commit()


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "clinician", "staff")),
):
    if db.query(Patient).filter(Patient.mrn == payload.mrn).first():
        raise HTTPException(status_code=409, detail="MRN already exists")
    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    _log(db, patient.id, user.id, "CREATE")
    return patient


@router.get("", response_model=list[PatientOut])
def list_patients(
    q: str | None = Query(None, description="Search by name or MRN"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Patient).filter(Patient.is_deleted.is_(False))
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Patient.first_name.ilike(like))
            | (Patient.last_name.ilike(like))
            | (Patient.mrn.ilike(like))
        )
    return query.offset(skip).limit(min(limit, 200)).all()


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.is_deleted.is_(False))
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    _log(db, patient.id, user.id, "VIEW")
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "clinician")),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    _log(db, patient.id, user.id, "UPDATE")
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.is_deleted = True  # soft delete for retention/audit requirements
    db.commit()
    _log(db, patient.id, user.id, "DELETE")
