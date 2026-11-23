"""Per-school curriculum mapping, separate from chapter publishing."""
import json
import re
from difflib import SequenceMatcher
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from .db import get_db
from .models import User, Textbook, BookChapter, ChapterCurriculumMap
from .security import current_user
from .textbook_routes import allowed

router = APIRouter(prefix='/textbooks', tags=['Curriculum Mapping'])


def book_for_user(db, user, book_id):
    book = db.scalar(select(Textbook).where(Textbook.id == book_id, Textbook.school_id == user.school_id))
    if book is None:
        raise HTTPException(404, 'Textbook not found')
    return book


def mapping_board(board):
    name = board.casefold().strip()
    if 'cbse' in name or 'ncert' in name:
        return 'CBSE/NCERT'
    if 'icse' in name or 'isc' in name or 'cisce' in name:
        return 'ICSE/ISC'
    return None


def normalize(value):
    return ' '.join(re.findall(r'[a-z0-9]+', value.casefold()))


def suggestions_for(book, chapters):
    path = Path(__file__).with_name('curriculum_catalog.json')
    catalog = json.loads(path.read_text(encoding='utf-8')) if path.exists() else []
    board = mapping_board(book.board)
    options = [x for x in catalog if x.get('board') == board and x.get('classLevel') == book.grade and normalize(x.get('subject','')) == normalize(book.subject)]
    result = {}
    for c in chapters:
        scored = []
        for entry in options:
            topic = entry.get('chapterTitle', '')
            if not topic:
                continue
            score = SequenceMatcher(None, normalize(c.title), normalize(topic)).ratio()
            if normalize(c.title) == normalize(topic):
                score = 1.0
            scored.append({'topic': topic, 'score': round(score, 2), 'catalog_status': entry.get('status', 'planned')})
        result[c.id] = sorted(scored, key=lambda x: x['score'], reverse=True)[:3]
    return result


@router.get('/{book_id}/curriculum-mapping')
def get_mapping(book_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    book = book_for_user(db, user, book_id)
    chapters = list(db.scalars(select(BookChapter).where(BookChapter.textbook_id == book_id, BookChapter.school_id == user.school_id).order_by(BookChapter.number)))
    if user.role == 'student':
        chapters = [c for c in chapters if c.status == 'published']
    saved = {m.chapter_id: m for m in db.scalars(select(ChapterCurriculumMap).where(ChapterCurriculumMap.textbook_id == book_id, ChapterCurriculumMap.school_id == user.school_id))}
    proposed = suggestions_for(book, chapters)
    return {'board': mapping_board(book.board), 'grade': book.grade, 'subject': book.subject, 'catalog_is_official': False,
            'chapters': [{'id': c.id, 'number': c.number, 'title': c.title,
                          'mapping': ({'topic': saved[c.id].topic, 'status': saved[c.id].status, 'source': saved[c.id].source} if c.id in saved else None),
                          'suggestions': proposed[c.id]} for c in chapters]}


class MappingInput(BaseModel):
    topic: str = Field(min_length=2, max_length=220)
    status: str = 'draft'


@router.put('/{book_id}/curriculum-mapping/{chapter_id}')
def save_mapping(book_id: int, chapter_id: int, data: MappingInput, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not allowed(db, user, 'chapters.edit'):
        raise HTTPException(403, 'Permission required: chapters.edit')
    book = book_for_user(db, user, book_id)
    if data.status not in ('draft', 'reviewed'):
        raise HTTPException(422, 'Mapping status must be draft or reviewed')
    chapter = db.scalar(select(BookChapter).where(BookChapter.id == chapter_id, BookChapter.textbook_id == book_id, BookChapter.school_id == user.school_id))
    if chapter is None:
        raise HTTPException(404, 'Chapter not found')
    row = db.scalar(select(ChapterCurriculumMap).where(ChapterCurriculumMap.chapter_id == chapter_id, ChapterCurriculumMap.school_id == user.school_id))
    if row is None:
        row = ChapterCurriculumMap(school_id=user.school_id, textbook_id=book_id, chapter_id=chapter_id, board=mapping_board(book.board) or book.board, topic=data.topic.strip(), status=data.status, source='manual', updated_by=user.id)
        db.add(row)
    else:
        row.topic = data.topic.strip()
        row.status = data.status
        row.source = 'manual'
        row.updated_by = user.id
    db.commit()
    return {'chapter_id': chapter_id, 'topic': row.topic, 'status': row.status}
