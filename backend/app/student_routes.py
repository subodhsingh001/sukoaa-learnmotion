"""Student reading and practice: only PUBLISHED content from the student's own school."""
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session, defer
from .db import get_db
from .models import User, Textbook, BookChapter, ChapterAsset, AssetAttempt
from .security import current_user
from .textbook_routes import public_body

router = APIRouter(prefix='/student', tags=['Student learning'])


def student_only(user: User):
    if user.role != 'student':
        raise HTTPException(403, 'Student account required')


@router.get('/library')
def library(user: User = Depends(current_user), db: Session = Depends(get_db)):
    student_only(user)
    rows = db.execute(select(BookChapter.textbook_id, func.count()).where(
        BookChapter.school_id == user.school_id, BookChapter.status == 'published').group_by(BookChapter.textbook_id)).all()
    counts = dict(rows)
    books = db.scalars(select(Textbook).options(defer(Textbook.extracted_text)).where(
        Textbook.school_id == user.school_id, Textbook.id.in_(list(counts) or [0])).order_by(Textbook.subject, Textbook.title))
    return [{'id': b.id, 'title': b.title, 'board': b.board, 'grade': b.grade, 'subject': b.subject, 'chapters': counts[b.id]} for b in books]


@router.get('/books/{book_id}')
def book_chapters(book_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    student_only(user)
    book = db.scalar(select(Textbook).options(defer(Textbook.extracted_text)).where(Textbook.id == book_id, Textbook.school_id == user.school_id))
    if not book:
        raise HTTPException(404, 'Book not found')
    chapters = list(db.scalars(select(BookChapter).where(BookChapter.textbook_id == book_id, BookChapter.school_id == user.school_id,
                                                         BookChapter.status == 'published').order_by(BookChapter.number)))
    if not chapters:
        raise HTTPException(404, 'Book not found')
    return {'book': {'id': book.id, 'title': book.title, 'subject': book.subject, 'grade': book.grade, 'board': book.board},
            'chapters': [{'id': c.id, 'number': c.number, 'title': c.title} for c in chapters]}


@router.get('/chapters/{chapter_id}')
def chapter(chapter_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    student_only(user)
    c = db.scalar(select(BookChapter).where(BookChapter.id == chapter_id, BookChapter.school_id == user.school_id, BookChapter.status == 'published'))
    if not c:
        raise HTTPException(404, 'Chapter not found')
    assets = list(db.scalars(select(ChapterAsset).where(ChapterAsset.chapter_id == c.id, ChapterAsset.school_id == user.school_id,
                                                        ChapterAsset.status == 'published').order_by(ChapterAsset.id)))
    best = {}
    for a in db.scalars(select(AssetAttempt).where(AssetAttempt.user_id == user.id, AssetAttempt.school_id == user.school_id,
                                                   AssetAttempt.asset_id.in_([a.id for a in assets] or [0]))):
        if a.asset_id not in best or a.score / a.total > best[a.asset_id]['score'] / best[a.asset_id]['total']:
            best[a.asset_id] = {'score': a.score, 'total': a.total}
    return {'chapter': {'id': c.id, 'number': c.number, 'title': c.title, 'textbook_id': c.textbook_id},
            'assets': [{'id': a.id, 'kind': a.kind, 'title': a.title, 'body': public_body(a.kind, a.body), 'best': best.get(a.id)} for a in assets]}


class Answers(BaseModel):
    answers: list[int | None] = Field(min_length=1, max_length=100)


@router.post('/assets/{asset_id}/submit', status_code=201)
def submit(asset_id: int, data: Answers, user: User = Depends(current_user), db: Session = Depends(get_db)):
    student_only(user)
    a = db.scalar(select(ChapterAsset).where(ChapterAsset.id == asset_id, ChapterAsset.school_id == user.school_id,
                                             ChapterAsset.kind == 'quiz', ChapterAsset.status == 'published'))
    chap = db.get(BookChapter, a.chapter_id) if a else None
    if not a or not chap or chap.status != 'published':
        raise HTTPException(404, 'Quiz not found')
    try:
        questions = json.loads(a.body)['questions']
    except (ValueError, KeyError, TypeError):
        raise HTTPException(422, 'This quiz cannot be graded')
    graded = [q for q in questions if q.get('correct_option') is not None]
    if not graded or len(data.answers) != len(questions):
        raise HTTPException(422, 'Answer every question')
    results, score = [], 0
    for q, given in zip(questions, data.answers):
        key = q.get('correct_option')
        if key is None:  # open-ended question inside a quiz: shown, not graded
            results.append({'graded': False, 'correct': None, 'correct_option': None, 'explanation': ''})
            continue
        ok = given == key
        score += int(ok)
        results.append({'graded': True, 'correct': ok, 'correct_option': key, 'explanation': q.get('explanation', '') or q.get('answer', '')})
    db.add(AssetAttempt(school_id=user.school_id, user_id=user.id, asset_id=a.id, score=score, total=len(graded)))
    db.commit()
    return {'score': score, 'total': len(graded), 'results': results}


@router.get('/summary')
def summary(user: User = Depends(current_user), db: Session = Depends(get_db)):
    student_only(user)
    attempts = list(db.scalars(select(AssetAttempt).where(AssetAttempt.user_id == user.id, AssetAttempt.school_id == user.school_id)))
    avg = round(sum(a.score / a.total for a in attempts) / len(attempts) * 100, 1) if attempts else None
    return {'quiz_attempts': len(attempts), 'average_percent': avg}
