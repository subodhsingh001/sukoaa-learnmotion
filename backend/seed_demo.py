"""Explicit LOCAL demo seed. Run from backend directory: python seed_demo.py"""
from sqlalchemy import select
from app.db import Base,engine,SessionLocal
from app.models import School,User,Classroom,Enrollment,Lesson
from app.security import passwords

Base.metadata.create_all(engine)
with SessionLocal() as db:
    school=db.scalar(select(School).where(School.name=='SUKOAA Demo School'))
    if not school:
        school=School(name='SUKOAA Demo School');db.add(school);db.flush()
    for slug,title,subject in [('solar-system','Solar System','Science'),('atomic-structure','Atomic Structure','Chemistry'),('geometry','3D Geometry','Mathematics'),('force-and-motion','Force and Motion','Physics')]:
        if not db.get(Lesson,slug):db.add(Lesson(slug=slug,title=title,subject=subject))
    demo=[('student@example.com','Demo Student','student'),('teacher@example.com','Demo Teacher','teacher'),('admin@example.com','Demo Admin','admin')]
    for email,name,role in demo:
        if not db.scalar(select(User).where(User.email==email)):
            db.add(User(school_id=school.id,email=email,full_name=name,role=role,password_hash=passwords.hash('DemoOnly123!')))
    db.flush()
    teacher=db.scalar(select(User).where(User.email=='teacher@example.com'))
    student=db.scalar(select(User).where(User.email=='student@example.com'))
    classroom=db.scalar(select(Classroom).where(Classroom.school_id==school.id,Classroom.name=='Demo Class A'))
    if not classroom:
        classroom=Classroom(school_id=school.id,name='Demo Class A',teacher_id=teacher.id);db.add(classroom);db.flush()
    if not db.scalar(select(Enrollment).where(Enrollment.classroom_id==classroom.id,Enrollment.student_id==student.id)):
        db.add(Enrollment(classroom_id=classroom.id,student_id=student.id))
    db.commit()
print('LOCAL DEMO ONLY: student@example.com / DemoOnly123!')
print('LOCAL DEMO ONLY: teacher@example.com / DemoOnly123!')
print('LOCAL DEMO ONLY: admin@example.com / DemoOnly123!')
