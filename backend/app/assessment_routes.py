"""Milestone 12: server-graded quizzes and school-scoped analytics."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from .db import get_db
from .models import User, Lesson, Progress, QuizAttempt, Classroom, Enrollment
from .security import current_user
from .school_routes import scoped_classroom

router = APIRouter(prefix='/assessments', tags=['Assessments'])
# Correct answers stay on the server. Keep these aligned with the lesson content.
BANK = {
 'solar-system': [
  ('Which planet is closest to the Sun?', ['Venus','Mercury','Earth'],1),
  ('Which planet is the largest?', ['Jupiter','Saturn','Neptune'],0),
  ('What causes planets to stay in orbit around the Sun?', ['Wind','Magnetism alone','Gravity and their motion'],2)],
 'atomic-structure': [
  ('Which particle has a positive charge?', ['Electron','Proton','Neutron'],1),
  ("Where is most of an atom's mass?", ['Nucleus','Electron cloud','Outside the atom'],0),
  ('What changes when you select carbon instead of helium?', ['Number of protons','Gravity','Electron charge'],0)],
 'geometry': [
  ('How many faces does a cube have?', ['4','6','8'],1),
  ('Which shape has no edges or vertices?', ['Cube','Cylinder','Sphere'],2),
  ('What is the volume of a cube with side 3 units?', ['9','18','27'],2)],
 'human-body': [
  ('Which organ pumps blood around the body?', ['Lungs','Heart','Stomach'],1),
  ('Which organs exchange oxygen and carbon dioxide?', ['Lungs','Kidneys','Intestines'],0),
  ('Which organ coordinates memory and movement?', ['Brain','Stomach','Heart'],0)],
 'photosynthesis': [
  ('Which gas do plants absorb for photosynthesis?', ['Oxygen','Carbon dioxide','Nitrogen'],1),
  ('Which substance is released during photosynthesis?', ['Oxygen','Salt','Carbon dioxide'],0),
  ('If water is low but light and CO2 are high, what limits photosynthesis?', ['Water','Light','Neither'],0)],
 'fractions': [
  ('What fraction is three of four equal parts?', ['3/4','4/3','1/4'],0),
  ('Which is equivalent to 1/2?', ['1/3','2/4','3/4'],1),
  ('What is 1/4 + 2/4?', ['3/8','3/4','1/2'],1)],
 'force-and-motion': [
  ('When applied force is less than the maximum static friction, what happens to an object initially at rest?', ['It remains at rest','It accelerates immediately','It moves at constant speed'],0),
  ('For the same net force, doubling mass makes acceleration:', ['Twice as large','Half as large','Unchanged'],1),
  ('If the object is moving right and the net force points left, what initially happens?', ['It speeds up right','It slows down','It immediately moves left'],1)]
}
class Submission(BaseModel):
 answers: list[int] = Field(min_length=1, max_length=30)

@router.get('/quizzes/{slug}')
def get_quiz(slug: str, user: User = Depends(current_user)):
 if slug not in BANK: raise HTTPException(404,'Quiz not found')
 return {'lesson_slug':slug,'questions':[{'question':q,'options':opts} for q,opts,_ in BANK[slug]]}

@router.post('/quizzes/{slug}/submit',status_code=201)
def submit(slug: str, data: Submission, user: User = Depends(current_user), db: Session = Depends(get_db)):
 if user.role!='student': raise HTTPException(403,'Only students can submit quizzes')
 questions=BANK.get(slug)
 if questions is None or db.get(Lesson,slug) is None: raise HTTPException(404,'Quiz not found')
 if len(data.answers)!=len(questions) or any(type(a) is not int or a<0 or a>=len(q[1]) for a,q in zip(data.answers,questions)):
  raise HTTPException(422,'Invalid answers')
 score=sum(int(a==q[2]) for a,q in zip(data.answers,questions))
 db.add(QuizAttempt(school_id=user.school_id,user_id=user.id,lesson_slug=slug,score=score,total=len(questions)))
 progress=db.scalar(select(Progress).where(Progress.user_id==user.id,Progress.school_id==user.school_id,Progress.lesson_slug==slug))
 if progress is None:
  progress=Progress(school_id=user.school_id,user_id=user.id,lesson_slug=slug)
  db.add(progress)
 progress.completed=True
 # Progress keeps best score, attempts preserve every submission.
 if progress.score is None or score*progress.total>progress.score*len(questions):
  progress.score=score;progress.total=len(questions)
 db.commit()
 return {'score':score,'total':len(questions),'completed':True}

@router.get('/me/attempts')
def my_attempts(user: User = Depends(current_user), db: Session = Depends(get_db)):
 return [{'id':a.id,'lesson_slug':a.lesson_slug,'score':a.score,'total':a.total,'submitted_at':a.submitted_at} for a in db.scalars(select(QuizAttempt).where(QuizAttempt.user_id==user.id,QuizAttempt.school_id==user.school_id).order_by(QuizAttempt.submitted_at.desc(),QuizAttempt.id.desc()).limit(100))]

@router.get('/classrooms/{classroom_id}/report')
def classroom_report(classroom_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
 if user.role not in ('admin','teacher'): raise HTTPException(403,'Teacher or admin required')
 room=scoped_classroom(db,user,classroom_id)
 students=list(db.scalars(select(User).join(Enrollment,Enrollment.student_id==User.id).where(Enrollment.classroom_id==room.id,User.school_id==user.school_id,User.role=='student').order_by(User.full_name)))
 result=[]
 for s in students:
  attempts=list(db.scalars(select(QuizAttempt).where(QuizAttempt.school_id==user.school_id,QuizAttempt.user_id==s.id).order_by(QuizAttempt.submitted_at.desc(),QuizAttempt.id.desc())))
  completed=db.scalar(select(func.count()).select_from(Progress).where(Progress.school_id==user.school_id,Progress.user_id==s.id,Progress.completed.is_(True)))
  result.append({'student_id':s.id,'name':s.full_name,'email':s.email,'completed_lessons':completed,'attempts':len(attempts),'latest_score':{'score':attempts[0].score,'total':attempts[0].total,'lesson_slug':attempts[0].lesson_slug} if attempts else None,'average_percent':round(sum(a.score/a.total for a in attempts)/len(attempts)*100,1) if attempts else None})
 return {'classroom_id':room.id,'classroom_name':room.name,'students':result}
