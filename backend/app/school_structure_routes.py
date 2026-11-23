"""School academic structure, isolated by authenticated school."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .db import get_db
from .models import User, AcademicYear, SchoolSection, SchoolSubject, SectionSubject
from .security import current_user

router = APIRouter(prefix='/school/structure', tags=['School structure'])

def admin(user):
    if user.role != 'admin': raise HTTPException(403, 'School admin required')

def owned(db, model, identifier, school_id):
    obj = db.get(model, identifier)
    if obj is None or obj.school_id != school_id: raise HTTPException(404, 'Record not found')
    return obj

def save(db):
    try: db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Duplicate or invalid record')

class YearInput(BaseModel):
    name: str = Field(min_length=3,max_length=40)
    start_date: datetime
    end_date: datetime

class SectionInput(BaseModel):
    academic_year_id: int
    grade: int = Field(ge=1,le=12)
    section: str = Field(min_length=1,max_length=20)

class SubjectInput(BaseModel):
    name: str = Field(min_length=2,max_length=100)
    code: str = Field(min_length=2,max_length=30)

class AssignmentInput(BaseModel):
    section_id: int
    subject_id: int

@router.get('/years')
def years(user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user)
    return list(db.scalars(select(AcademicYear).where(AcademicYear.school_id==user.school_id).order_by(AcademicYear.start_date.desc())))

@router.post('/years',status_code=201)
def add_year(data:YearInput,user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user)
    if data.end_date <= data.start_date: raise HTTPException(422,'End date must follow start date')
    obj=AcademicYear(school_id=user.school_id,**data.model_dump())
    db.add(obj);save(db);db.refresh(obj);return obj

@router.put('/years/{year_id}/activate')
def activate_year(year_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user);obj=owned(db,AcademicYear,year_id,user.school_id)
    db.execute(update(AcademicYear).where(AcademicYear.school_id==user.school_id).values(is_active=False))
    obj.is_active=True;save(db);return {'active_year_id':obj.id}

@router.get('/sections')
def sections(user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user)
    return list(db.scalars(select(SchoolSection).where(SchoolSection.school_id==user.school_id).order_by(SchoolSection.grade,SchoolSection.section)))

@router.post('/sections',status_code=201)
def add_section(data:SectionInput,user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user);owned(db,AcademicYear,data.academic_year_id,user.school_id)
    obj=SchoolSection(school_id=user.school_id,academic_year_id=data.academic_year_id,grade=data.grade,section=data.section.strip().upper())
    db.add(obj);save(db);db.refresh(obj);return obj

@router.get('/subjects')
def subjects(user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user)
    return list(db.scalars(select(SchoolSubject).where(SchoolSubject.school_id==user.school_id).order_by(SchoolSubject.name)))

@router.post('/subjects',status_code=201)
def add_subject(data:SubjectInput,user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user)
    obj=SchoolSubject(school_id=user.school_id,name=data.name.strip(),code=data.code.strip().upper())
    db.add(obj);save(db);db.refresh(obj);return obj

@router.get('/assignments')
def assignments(user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user)
    rows=db.execute(select(SectionSubject.section_id,SectionSubject.subject_id).join(SchoolSection,SchoolSection.id==SectionSubject.section_id).where(SchoolSection.school_id==user.school_id))
    return [{'section_id':s,'subject_id':t} for s,t in rows]

@router.post('/assignments',status_code=201)
def add_assignment(data:AssignmentInput,user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user);owned(db,SchoolSection,data.section_id,user.school_id);owned(db,SchoolSubject,data.subject_id,user.school_id)
    db.add(SectionSubject(**data.model_dump()));save(db);return {'assigned':True}

@router.delete('/assignments/{section_id}/{subject_id}')
def delete_assignment(section_id:int,subject_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    admin(user);owned(db,SchoolSection,section_id,user.school_id)
    obj=db.scalar(select(SectionSubject).where(SectionSubject.section_id==section_id,SectionSubject.subject_id==subject_id))
    if obj is None: raise HTTPException(404,'Assignment not found')
    db.delete(obj);save(db);return {'removed':True}
