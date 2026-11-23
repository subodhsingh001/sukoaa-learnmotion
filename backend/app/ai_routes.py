"""Milestone 15: AI content generation from verified chapter text.

Everything generated here is saved as a DRAFT asset. A teacher must review it and an
authorised person must publish it before students can see it.

Engine selection
  * ANTHROPIC_API_KEY set  -> Claude writes the content (best quality).
  * no key                 -> deterministic offline generator (extractive; good for testing the pipeline).
"""
import json
import random
import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import User, BookChapter, ChapterAsset, AIUsage, Textbook
from .security import current_user
from .textbook_routes import allowed, chapter_for
from . import storyboard as sb

router = APIRouter(prefix='/ai', tags=['AI content'])
KINDS = ('notes', 'qa', 'quiz', 'exercise')
LABELS = {'notes': 'Study notes', 'qa': 'Q&A set', 'quiz': 'Quiz', 'exercise': 'Exercise set'}
MIN_SOURCE_CHARS = 300
MAX_SOURCE_CHARS = 24000


class GenerateInput(BaseModel):
    kind: str
    count: int = Field(default=8, ge=3, le=20)
    difficulty: str = 'medium'


def month_start():
    n = datetime.now(timezone.utc)
    return n.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def used_this_month(db: Session, school_id: int) -> int:
    return db.scalar(select(func.count()).select_from(AIUsage).where(AIUsage.school_id == school_id, AIUsage.created_at >= month_start())) or 0


@router.get('/usage')
def usage(user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.role not in ('admin', 'teacher'):
        raise HTTPException(403, 'Teacher or admin required')
    return {'used': used_this_month(db, user.school_id), 'limit': settings.ai_monthly_limit,
            'engine': 'claude' if settings.anthropic_api_key else 'offline'}


# ---------------------------------------------------------------- offline engine
STOP = set('the a an and or but if of to in on at by for with from as is are was were be been being this that these those it its they them their he she his her we you your i not no nor so than then there here which who whom whose what when where why how can could should would may might will shall do does did done have has had also into over under about after before between during each other such only own same very just more most less least many much any all both few some one two three'.split())


def sentences(text):
    text = re.sub(r'\[PDF page \d+\]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    out = [s.strip() for s in re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])', text)]
    return [s for s in out if 40 <= len(s) <= 260 and sum(c.isalpha() for c in s) > 0.6 * len(s)]


def keywords(sentence):
    words = re.findall(r"[A-Za-z][A-Za-z\-']{4,}", sentence)
    return [w for w in words if w.lower() not in STOP]


def offline_generate(kind, source, count, title):
    rnd = random.Random(len(source))
    sents = sentences(source)
    if len(sents) < 3:
        raise HTTPException(422, 'The extracted text is too short or too noisy to build content from. Check the chapter text first.')
    if kind == 'notes':
        chosen = sents[:: max(1, len(sents) // (count * 2))][: count * 2]
        lines = [f'# {title} — study notes', '', '## Key points']
        lines += [f'- {s}' for s in chosen]
        lines += ['', '## Revise', 'Close the book and explain each key point in your own words.']
        return '\n'.join(lines)
    pool = [w for s in sents for w in keywords(s)]
    pool = list(dict.fromkeys(pool))
    items = []
    for s in rnd.sample(sents, min(len(sents), count * 3)):
        kws = keywords(s)
        if not kws:
            continue
        target = max(kws, key=len)
        if kind == 'quiz':
            wrong = [w for w in pool if w.lower() != target.lower() and abs(len(w) - len(target)) < 5]
            if len(wrong) < 3:
                continue
            opts = rnd.sample(wrong, 3) + [target]
            rnd.shuffle(opts)
            items.append({'question': 'Fill in the blank: ' + re.sub(re.escape(target), '_____', s, count=1, flags=re.I),
                          'answer': target, 'options': opts, 'correct_option': opts.index(target),
                          'explanation': s})
        elif kind == 'qa':
            items.append({'question': f'What does the chapter explain about "{target}"?', 'answer': s,
                          'options': [], 'correct_option': None, 'explanation': ''})
        else:
            items.append({'question': f'In your own words, explain: {target}. Support your answer with an example.',
                          'answer': 'Marking guide: ' + s, 'options': [], 'correct_option': None, 'explanation': ''})
        if len(items) >= count:
            break
    if not items:
        raise HTTPException(422, 'Could not build questions from this text. Check the chapter text first.')
    return items


# ---------------------------------------------------------------- Claude engine
def claude_generate(kind, source, count, difficulty, ctx):
    try:
        import anthropic
    except ImportError:
        raise HTTPException(503, 'The "anthropic" package is not installed. Run: pip install -r requirements.txt')
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    system = ('You are an expert school curriculum writer. Use ONLY the supplied chapter text. '
              'Never invent facts that are not supported by it. Write for the stated class level. '
              'Reply with a single JSON object and nothing else.')
    meta = f'Board: {ctx["board"]}. Class {ctx["grade"]}. Subject: {ctx["subject"]}. Chapter: {ctx["title"]}. Difficulty: {difficulty}.'
    if kind == 'notes':
        ask = 'Write concise, well-structured revision notes in Markdown (headings, short bullets, key terms in bold, a 3-line summary at the end). Return {"notes": "<markdown>"}.'
    elif kind == 'quiz':
        ask = (f'Write {count} multiple-choice questions. Each has exactly 4 options and exactly one correct option. '
               'Return {"questions":[{"question":str,"options":[4 strings],"correct_option":0-3,"explanation":str}]}.')
    elif kind == 'qa':
        ask = f'Write {count} short-answer questions with model answers. Return {{"questions":[{{"question":str,"answer":str}}]}}.'
    else:
        ask = (f'Write {count} practice exercises of increasing difficulty (application, reasoning, a real-life scenario). '
               'Each needs a marking guide. Return {"questions":[{"question":str,"answer":"<marking guide>"}]}.')
    try:
        msg = client.messages.create(model=settings.ai_model, max_tokens=4000, system=system,
                                     messages=[{'role': 'user', 'content': f'{meta}\n\n{ask}\n\nCHAPTER TEXT:\n{source[:MAX_SOURCE_CHARS]}'}])
    except Exception as exc:  # network, auth, quota...
        raise HTTPException(502, f'AI service error: {exc.__class__.__name__}. Check ANTHROPIC_API_KEY and your network.')
    raw = ''.join(b.text for b in msg.content if getattr(b, 'type', '') == 'text')
    start, end = raw.find('{'), raw.rfind('}')
    try:
        data = json.loads(raw[start:end + 1])
    except ValueError:
        raise HTTPException(502, 'The AI returned an unreadable answer. Please try again.')
    if kind == 'notes':
        text = str(data.get('notes', '')).strip()
        if not text:
            raise HTTPException(502, 'The AI returned empty notes. Please try again.')
        return text
    items = []
    for q in data.get('questions', []):
        if not isinstance(q, dict) or not str(q.get('question', '')).strip():
            continue
        opts = [str(o) for o in q.get('options', [])][:8] if kind == 'quiz' else []
        co = q.get('correct_option') if kind == 'quiz' else None
        if kind == 'quiz' and (len(opts) < 2 or not isinstance(co, int) or not 0 <= co < len(opts)):
            continue  # reject malformed quiz items instead of publishing a wrong key
        items.append({'question': str(q['question']).strip(), 'answer': str(q.get('answer', '')),
                      'options': opts, 'correct_option': co, 'explanation': str(q.get('explanation', ''))})
    if not items:
        raise HTTPException(502, 'The AI did not return usable questions. Please try again.')
    return items


@router.post('/chapters/{chapter_id}/generate', status_code=201)
def generate(chapter_id: int, data: GenerateInput, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if data.kind not in KINDS:
        raise HTTPException(422, 'Choose notes, qa, quiz or exercise')
    if data.difficulty not in ('easy', 'medium', 'hard'):
        raise HTTPException(422, 'Difficulty must be easy, medium or hard')
    perm = 'exercises.create' if data.kind == 'exercise' else 'content.generate'
    if not allowed(db, user, perm):
        raise HTTPException(403, 'Permission required: ' + perm)
    chapter = db.scalar(select(BookChapter).where(BookChapter.id == chapter_id, BookChapter.school_id == user.school_id))
    if not chapter:
        raise HTTPException(404, 'Chapter not found')
    chapter = chapter_for(db, user, chapter.textbook_id, chapter_id)
    source = (chapter.source_text or '').strip()
    if len(source) < MIN_SOURCE_CHARS:
        raise HTTPException(422, 'Extract the chapter text first (Chapter Information → Extract & preview), then generate.')
    if used_this_month(db, user.school_id) >= settings.ai_monthly_limit:
        raise HTTPException(429, f'Your school has used all {settings.ai_monthly_limit} AI generations for this month.')
    book = db.get(Textbook, chapter.textbook_id)
    ctx = {'board': book.board, 'grade': book.grade, 'subject': book.subject, 'title': chapter.title}
    engine = 'claude' if settings.anthropic_api_key else 'offline'
    if engine == 'claude':
        result = claude_generate(data.kind, source, data.count, data.difficulty, ctx)
    else:
        result = offline_generate(data.kind, source, data.count, chapter.title)
    body = result if data.kind == 'notes' else json.dumps({'format': 'question_set_v1', 'questions': result}, ensure_ascii=False)
    n = db.scalar(select(func.count()).select_from(ChapterAsset).where(ChapterAsset.chapter_id == chapter.id, ChapterAsset.kind == data.kind)) or 0
    asset = ChapterAsset(school_id=user.school_id, chapter_id=chapter.id, kind=data.kind,
                         title=f'AI {LABELS[data.kind]} {n + 1} (draft)', body=body, status='draft', created_by=user.id)
    db.add(asset)
    db.add(AIUsage(school_id=user.school_id, user_id=user.id, chapter_id=chapter.id, kind=data.kind, engine=engine))
    db.commit()
    db.refresh(asset)
    return {'id': asset.id, 'status': asset.status, 'engine': engine, 'title': asset.title}


# ---------------------------------------------------------------- animated lesson storyboards
class StoryboardInput(BaseModel):
    scenes: int = Field(default=6, ge=4, le=10)
    language: str = 'en'


LANG_NAME = {'en': 'English', 'hi': 'Hindi (Devanagari script)', 'bn': 'Bengali'}


def offline_storyboard(source, title, scenes):
    rnd_sents = sentences(source)
    if len(rnd_sents) < 3:
        raise HTTPException(422, 'The extracted text is too short or too noisy to build a lesson from. Check the chapter text first.')
    text = source.lower()
    out = [{'template': 'title_card', 'params': {'heading': title, 'subtitle': 'Animated lesson'},
            'narration': f'Welcome. In this lesson we will learn about {title}.'}]
    picks = rnd_sents[:: max(1, len(rnd_sents) // max(1, scenes))]
    visual = []
    if re.search(r'\b(atom|proton|electron|neutron)', text):
        visual.append({'template': 'atom3d', 'params': {'protons': 6, 'neutrons': 6, 'electrons': 6}, 'narration': 'An atom has a nucleus of protons and neutrons, with electrons moving around it.'})
    if re.search(r'\b(force|newton|acceleration|friction)', text):
        visual.append({'template': 'force_diagram', 'params': {'force': 8, 'mass': 2, 'label': 'Force and motion'}, 'narration': 'A bigger force gives a bigger acceleration, and a bigger mass gives a smaller one.'})
    if re.search(r'\b(orbit|planet|revolve|satellite)', text):
        visual.append({'template': 'orbit', 'params': {'center_label': 'Sun', 'orbiter_label': 'Planet'}, 'narration': 'The smaller body travels around the larger one along a path called an orbit.'})
    if re.search(r'\b(cube|sphere|cylinder|cone|volume|surface area)', text):
        visual.append({'template': 'shape3d', 'params': {'shape': 'cube', 'wireframe': True}, 'narration': 'Look at the solid from every side to count its faces, edges and corners.'})
    if re.search(r'\b(cycle|stages|process)', text):
        visual.append({'template': 'cycle', 'params': {'heading': 'The process', 'steps': ['Start', 'Change', 'Result', 'Repeat']}, 'narration': 'This process repeats again and again in a cycle.'})
    for i, sent in enumerate(picks[: max(0, scenes - 2 - len(visual))]):
        out.append({'template': 'bullets', 'params': {'heading': f'Key idea {i + 1}', 'points': [sent[:110]]}, 'narration': sent[:400]})
    out[1:1] = visual[:3]
    out.append({'template': 'bullets', 'params': {'heading': 'Remember', 'points': ['Review the key ideas', 'Try the chapter quiz']},
                'narration': 'That is the end of the lesson. Review the key ideas and try the quiz.'})
    return {'title': title, 'language': 'en', 'scenes': out[:-1][:scenes - 1] + [out[-1]]}


def claude_storyboard(source, ctx, scenes, language):
    try:
        import anthropic
    except ImportError:
        raise HTTPException(503, 'The "anthropic" package is not installed. Run: pip install -r requirements.txt')
    catalogue = '\n'.join(f'- {k}: {v}' for k, v in sb.CATALOGUE.items())
    system = ('You are an expert school teacher who plans short animated lessons. Use ONLY the supplied chapter text; never invent facts. '
              'You do not draw: you choose one template per scene from the catalogue and fill its params. '
              'Reply with a single JSON object and nothing else.')
    ask = (f'Board: {ctx["board"]}. Class {ctx["grade"]}. Subject: {ctx["subject"]}. Chapter: {ctx["title"]}.\n'
           f'Plan an animated lesson of exactly {scenes} scenes in {LANG_NAME.get(language, "English")}. Start with a title_card and end with a bullets summary. '
           'Use a 2D or 3D concept template only where it truly fits the content; otherwise use bullets. '
           'Each scene has 1-3 short narration sentences (spoken aloud to a student of this class), matching what is on screen.\n'
           f'TEMPLATES:\n{catalogue}\n\n'
           'Return {"title": str, "language": "' + language + '", "scenes": [{"template": str, "params": {...}, "narration": str}]}.\n\n'
           f'CHAPTER TEXT:\n{source[:MAX_SOURCE_CHARS]}')
    try:
        msg = anthropic.Anthropic(api_key=settings.anthropic_api_key).messages.create(
            model=settings.ai_model, max_tokens=4000, system=system, messages=[{'role': 'user', 'content': ask}])
    except Exception as exc:
        raise HTTPException(502, f'AI service error: {exc.__class__.__name__}. Check ANTHROPIC_API_KEY and your network.')
    raw = ''.join(b.text for b in msg.content if getattr(b, 'type', '') == 'text')
    try:
        return json.loads(raw[raw.find('{'):raw.rfind('}') + 1])
    except ValueError:
        raise HTTPException(502, 'The AI returned an unreadable storyboard. Please try again.')


@router.get('/templates')
def templates(user: User = Depends(current_user)):
    return sb.CATALOGUE


@router.post('/chapters/{chapter_id}/storyboard', status_code=201)
def make_storyboard(chapter_id: int, data: StoryboardInput, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if data.language not in LANG_NAME:
        raise HTTPException(422, 'Language must be en, hi or bn')
    if not allowed(db, user, 'content.generate'):
        raise HTTPException(403, 'Permission required: content.generate')
    chapter = db.scalar(select(BookChapter).where(BookChapter.id == chapter_id, BookChapter.school_id == user.school_id))
    if not chapter:
        raise HTTPException(404, 'Chapter not found')
    chapter = chapter_for(db, user, chapter.textbook_id, chapter_id)
    source = (chapter.source_text or '').strip()
    if len(source) < MIN_SOURCE_CHARS:
        raise HTTPException(422, 'Extract the chapter text first (Chapter information → Extract chapter text), then create the lesson.')
    if used_this_month(db, user.school_id) >= settings.ai_monthly_limit:
        raise HTTPException(429, f'Your school has used all {settings.ai_monthly_limit} AI generations for this month.')
    book = db.get(Textbook, chapter.textbook_id)
    ctx = {'board': book.board, 'grade': book.grade, 'subject': book.subject, 'title': chapter.title}
    engine = 'claude' if settings.anthropic_api_key else 'offline'
    raw = claude_storyboard(source, ctx, data.scenes, data.language) if engine == 'claude' else offline_storyboard(source, chapter.title, data.scenes)
    try:
        board = sb.sanitize(raw, title=chapter.title, language=data.language)
    except ValueError:
        raise HTTPException(502, 'The generated lesson had too few usable scenes. Please try again.')
    n = db.scalar(select(func.count()).select_from(ChapterAsset).where(ChapterAsset.chapter_id == chapter.id, ChapterAsset.kind == 'video')) or 0
    asset = ChapterAsset(school_id=user.school_id, chapter_id=chapter.id, kind='video', title=f'Animated lesson {n + 1} (draft)',
                         body=json.dumps(board, ensure_ascii=False), status='draft', created_by=user.id)
    db.add(asset)
    db.add(AIUsage(school_id=user.school_id, user_id=user.id, chapter_id=chapter.id, kind='video', engine=engine))
    db.commit()
    db.refresh(asset)
    return {'id': asset.id, 'status': asset.status, 'engine': engine, 'scenes': len(board['scenes'])}
