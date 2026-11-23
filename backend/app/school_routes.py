"""Milestone 11 school administration and classroom-scoped teacher endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .db import get_db
from .models import School, User, Classroom, Enrollment, Progress
from .security import current_user, passwords

router = APIRouter(prefix='/school', tags=['School management'])

def require(user: User, *roles: str):
    if user.role not in roles:
        raise HTTPException(status_code=403, detail='Insufficient permissions')

def school_user(db: Session, user: User, user_id: int, role: str):
    result = db.scalar(select(User).where(User.id == user_id, User.school_id == user.school_id, User.role == role))
    if result is None:
        raise HTTPException(404, f'{role.title()} not found in your school')
    return result

def scoped_classroom(db: Session, user: User, classroom_id: int):
    room = db.scalar(select(Classroom).where(Classroom.id == classroom_id, Classroom.school_id == user.school_id))
    if room is None:
        raise HTTPException(404, 'Classroom not found')
    if user.role == 'teacher' and room.teacher_id != user.id:
        raise HTTPException(403, 'Not assigned to this classroom')
    return room

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=140)
    password: str = Field(min_length=10, max_length=128)
    role: str

class ClassroomCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    teacher_id: int

class ClassroomUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    teacher_id: int

class EnrollmentCreate(BaseModel):
    student_id: int

def user_view(u: User):
    return {'id': u.id, 'full_name': u.full_name, 'email': u.email, 'role': u.role}

def room_view(db: Session, room: Classroom):
    teacher = db.get(User, room.teacher_id)
    count = db.scalar(select(func.count()).select_from(Enrollment).where(Enrollment.classroom_id == room.id))
    return {'id': room.id, 'name': room.name, 'teacher_id': room.teacher_id,
            'teacher_name': teacher.full_name if teacher else 'Unknown', 'student_count': count}

@router.get('/overview')
def overview(user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin', 'teacher')
    school = db.get(School, user.school_id)
    rooms = list(db.scalars(select(Classroom).where(Classroom.school_id == user.school_id, *([Classroom.teacher_id == user.id] if user.role == 'teacher' else []))))
    students_query = select(func.count(func.distinct(Enrollment.student_id))).join(Classroom, Classroom.id == Enrollment.classroom_id).where(Classroom.school_id == user.school_id)
    if user.role == 'teacher':
        students_query = students_query.where(Classroom.teacher_id == user.id)
    return {'school': {'id': school.id, 'name': school.name} if school else None,
            'classrooms': len(rooms), 'enrolled_students': db.scalar(students_query),
            'teachers': db.scalar(select(func.count()).select_from(User).where(User.school_id == user.school_id, User.role == 'teacher')) if user.role == 'admin' else None}

@router.get('/users')
def list_users(role: str | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin')
    if role is not None and role not in ('student', 'teacher', 'admin'):
        raise HTTPException(422, 'Invalid role')
    query = select(User).where(User.school_id == user.school_id)
    if role:
        query = query.where(User.role == role)
    return [user_view(u) for u in db.scalars(query.order_by(User.full_name))]

@router.post('/users', status_code=201)
def create_user(data: UserCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin')
    if data.role not in ('student', 'teacher'):
        raise HTTPException(422, 'Only student and teacher accounts can be created here')
    email = str(data.email).lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(409, 'Email already registered')
    new_user = User(school_id=user.school_id, email=email, full_name=data.full_name.strip(),
                    role=data.role, password_hash=passwords.hash(data.password))
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Email already registered')
    db.refresh(new_user)
    return user_view(new_user)

@router.get('/classrooms')
def list_classrooms(user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin', 'teacher')
    query = select(Classroom).where(Classroom.school_id == user.school_id)
    if user.role == 'teacher':
        query = query.where(Classroom.teacher_id == user.id)
    return [room_view(db, r) for r in db.scalars(query.order_by(Classroom.name))]

@router.post('/classrooms', status_code=201)
def create_classroom(data: ClassroomCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin')
    school_user(db, user, data.teacher_id, 'teacher')
    room = Classroom(school_id=user.school_id, name=data.name.strip(), teacher_id=data.teacher_id)
    db.add(room); db.commit(); db.refresh(room)
    return room_view(db, room)

@router.put('/classrooms/{classroom_id}')
def update_classroom(classroom_id: int, data: ClassroomUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin')
    room = scoped_classroom(db, user, classroom_id)
    school_user(db, user, data.teacher_id, 'teacher')
    room.name = data.name.strip(); room.teacher_id = data.teacher_id
    db.commit()
    return room_view(db, room)

@router.get('/classrooms/{classroom_id}/students')
def classroom_students(classroom_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin', 'teacher')
    scoped_classroom(db, user, classroom_id)
    students = db.scalars(select(User).join(Enrollment, Enrollment.student_id == User.id).where(
        Enrollment.classroom_id == classroom_id, User.school_id == user.school_id, User.role == 'student').order_by(User.full_name))
    return [user_view(s) for s in students]

@router.post('/classrooms/{classroom_id}/enrollments', status_code=201)
def enroll(classroom_id: int, data: EnrollmentCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin')
    scoped_classroom(db, user, classroom_id)
    school_user(db, user, data.student_id, 'student')
    existing = db.scalar(select(Enrollment).where(Enrollment.classroom_id == classroom_id, Enrollment.student_id == data.student_id))
    if existing:
        raise HTTPException(409, 'Student already enrolled')
    db.add(Enrollment(classroom_id=classroom_id, student_id=data.student_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Student already enrolled')
    return {'enrolled': True}

@router.delete('/classrooms/{classroom_id}/enrollments/{student_id}')
def unenroll(classroom_id: int, student_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin')
    scoped_classroom(db, user, classroom_id)
    row = db.scalar(select(Enrollment).where(Enrollment.classroom_id == classroom_id, Enrollment.student_id == student_id))
    if not row:
        raise HTTPException(404, 'Enrollment not found')
    db.delete(row); db.commit()
    return {'removed': True}

@router.get('/classrooms/{classroom_id}/progress')
def classroom_progress(classroom_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require(user, 'admin', 'teacher')
    scoped_classroom(db, user, classroom_id)
    students = list(db.scalars(select(User).join(Enrollment, Enrollment.student_id == User.id).where(
        Enrollment.classroom_id == classroom_id, User.school_id == user.school_id, User.role == 'student').order_by(User.full_name)))
    return [{'student': user_view(s), 'completed_lessons': db.scalar(select(func.count()).select_from(Progress).where(
        Progress.school_id == user.school_id, Progress.user_id == s.id, Progress.completed.is_(True)))} for s in students]
