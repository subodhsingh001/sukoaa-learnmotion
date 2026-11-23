"""School-isolated textbook library. Text extraction is NOT AI content generation."""
import io
import json
import os
import re
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, defer
from .db import get_db
from .models import User, Textbook, BookChapter, Enrollment, Classroom, TeacherPermission, ChapterPageRange, ChapterAsset
from .security import current_user
from . import storyboard as sb

router = APIRouter(prefix='/textbooks', tags=['Textbooks'])
STORAGE = Path(os.environ.get('SUKOAA_UPLOAD_DIR', './storage/textbooks')).resolve()
MAX_BYTES = 20 * 1024 * 1024

def allowed(db, user, permission):
    if user.role == 'admin': return True
    if user.role != 'teacher': return False
    if permission == 'exercises.create': return True
    return db.scalar(select(TeacherPermission.id).where(
        TeacherPermission.school_id == user.school_id,
        TeacherPermission.teacher_id == user.id,
        TeacherPermission.permission == permission)) is not None

def require(db, user, permission):
    if not allowed(db, user, permission):
        raise HTTPException(403, 'Permission required: ' + permission)

def editor(user):
    if user.role not in ('admin', 'teacher'):
        raise HTTPException(403, 'Teacher or admin required')

def book_or_404(db, user, book_id):
    book = db.scalar(select(Textbook).options(defer(Textbook.extracted_text)).where(Textbook.id == book_id, Textbook.school_id == user.school_id))
    if not book: raise HTTPException(404, 'Textbook not found')
    return book

def public_body(kind, body):
    """Remove answers from quiz/Q&A/exercise bodies before a student sees them (answers are graded on the server)."""
    if kind not in ('quiz','qa','exercise'): return body
    try:
        data=json.loads(body)
    except ValueError:
        return body
    if not isinstance(data,dict) or data.get('format')!='question_set_v1': return body
    for q in data.get('questions',[]):
        q.pop('correct_option',None)
        if kind in ('quiz','exercise'): q['answer']=''  # marking guides stay with teachers
        q['explanation']=''
    return json.dumps(data,ensure_ascii=False)

def book_json(b):
    return {'id':b.id,'title':b.title,'board':b.board,'grade':b.grade,'subject':b.subject,'edition':b.edition,'filename':b.filename,'extraction_status':b.extraction_status,'created_at':b.created_at}

def chapter_json(c):
    return {'id':c.id,'number':c.number,'title':c.title,'status':c.status,'source_text':c.source_text}


def page_ranges(items):
    """Use the next chapter's TOC page as the end boundary."""
    ordered=sorted(items,key=lambda x:x['number'])
    return [(item, ordered[i+1]['page']-1 if i+1<len(ordered) else None) for i,item in enumerate(ordered)]

def normalized_title(title, page):
    return re.sub(r'\s+'+re.escape(str(page))+r'$', '', title).strip()

def detect_contents(reader):
    """Extract numbered TOC entries from early PDF pages, including wrapped titles.

    Results are unverified drafts, never published automatically.
    """
    lines=[]
    for page in reader.pages[:min(15,len(reader.pages))]:
        text=page.extract_text() or ''
        if re.search(r'(?im)^\s*(contents|table of contents)\s*$',text):
            lines=text.splitlines()
            break
    if not lines:
        return []
    found=[]
    pending=None
    for raw in lines:
        line=' '.join(raw.split())
        match=re.match(r'^(\d{1,3})\s*[.\)]\s*(.+?)\s+(\d{1,4})$',line)
        if not match:
            # A title and its page number may be split across PDF text lines.
            wrapped=re.match(r'^(\d{1,3})\s*[.\)]\s*(.{2,220})$',line)
            if wrapped:
                pending=(int(wrapped.group(1)),wrapped.group(2).strip())
            elif pending and re.fullmatch(r'\d{1,4}',line):
                number,title=pending
                if 1<=number<=500 and (not found or number>found[-1]['number']):
                    found.append({'number':number,'title':title,'page':int(line)})
                pending=None
            continue
        number,title,page=int(match.group(1)),match.group(2).strip(' .-'),int(match.group(3))
        if 1<=number<=500 and 2<=len(title)<=220 and (not found or number>found[-1]['number']):
            found.append({'number':number,'title':title,'page':page})
    return found if len(found)>=2 else []

@router.get('/ocr-status')
def ocr_status(user:User=Depends(current_user)):
    """Read-only diagnostics for the exact Python process running FastAPI."""
    import importlib.util
    import shutil
    import sys
    packages = {name:importlib.util.find_spec(name) is not None for name in ('fitz','pytesseract','PIL','pypdf')}
    tesseract = shutil.which('tesseract')
    return {'python_executable':sys.executable,'packages':packages,'tesseract_on_path':bool(tesseract),
            'ready':all(packages.values()) and bool(tesseract),
            'installation_hint':'From backend folder: .\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt; install Tesseract OCR for Windows and restart the backend.'}

@router.get('')
def list_books(user:User=Depends(current_user),db:Session=Depends(get_db)):
    books=list(db.scalars(select(Textbook).options(defer(Textbook.extracted_text)).where(Textbook.school_id==user.school_id).order_by(Textbook.id.desc())))
    if user.role=='student':
        published=set(db.scalars(select(BookChapter.textbook_id).where(BookChapter.school_id==user.school_id,BookChapter.status=='published')))
        books=[b for b in books if b.id in published]
    return [book_json(b) for b in books]

@router.post('',status_code=201)
async def upload_book(title:str=Form(...),board:str=Form(...),grade:int=Form(...),subject:str=Form(...),edition:str=Form(''),rights_confirmed:bool=Form(False),file:UploadFile=File(...),user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'books.upload')
    if not rights_confirmed: raise HTTPException(422,'Confirm you are authorized to upload and process this book')
    if board not in ('CBSE','ICSE'): raise HTTPException(422,'Board must be CBSE or ICSE')
    if not 1<=grade<=12: raise HTTPException(422,'Class must be 1–12')
    if not title.strip() or not subject.strip(): raise HTTPException(422,'Title and subject required')
    if not file.filename or not file.filename.lower().endswith('.pdf'): raise HTTPException(415,'Only PDF supported in this version')
    data=await file.read(MAX_BYTES+1)
    if len(data)>MAX_BYTES: raise HTTPException(413,'Maximum upload is 20 MB')
    if not data.startswith(b'%PDF-'): raise HTTPException(415,'Invalid PDF file')
    key=uuid.uuid4().hex+'.pdf'
    folder=STORAGE / str(user.school_id)
    folder.mkdir(parents=True,exist_ok=True)
    target=folder / key
    target.write_bytes(data)
    status='ready'; extracted=''; detected=[]
    try:
        from pypdf import PdfReader
        reader=PdfReader(io.BytesIO(data))
        if len(reader.pages)>1000: raise ValueError('PDF exceeds 1000 pages')
        extracted='\n'.join((p.extract_text() or '') for p in reader.pages)
        detected=detect_contents(reader)
        if not extracted.strip(): status='needs_ocr'
    except Exception:
        status='needs_review'
    book=Textbook(school_id=user.school_id,title=title.strip()[:220],board=board,grade=grade,subject=subject.strip()[:100],edition=edition.strip()[:100],filename=Path(file.filename).name[:255],storage_key=key,extraction_status=status,extracted_text=extracted,uploaded_by=user.id)
    db.add(book);db.flush()
    for item, ending in page_ranges(detected):
        chapter=BookChapter(school_id=user.school_id,textbook_id=book.id,number=item['number'],title=normalized_title(item['title'],item['page']),source_text='',status='draft')
        db.add(chapter); db.flush()
        db.add(ChapterPageRange(school_id=user.school_id,chapter_id=chapter.id,printed_start=item['page'],printed_end=ending,pdf_offset=0))
    db.commit();db.refresh(book)
    return {**book_json(book),'detected_chapters':len(detected)}

@router.get('/my-permissions')
def my_permissions(user:User=Depends(current_user),db:Session=Depends(get_db)):
    return {'permissions':[p for p in PERMISSIONS if allowed(db,user,p)]}

class BookEdit(BaseModel):
    title: str = Field(min_length=2, max_length=220)
    board: str
    grade: int = Field(ge=1, le=12)
    subject: str = Field(min_length=1, max_length=100)
    edition: str = Field(default='', max_length=100)

@router.put('/{book_id}')
def edit_book(book_id:int,data:BookEdit,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'books.upload')
    b=book_or_404(db,user,book_id)
    if data.board not in ('CBSE','ICSE'):raise HTTPException(422,'Invalid board')
    b.title=data.title.strip();b.board=data.board;b.grade=data.grade;b.subject=data.subject.strip();b.edition=data.edition.strip()
    db.commit();return book_json(b)

@router.delete('/{book_id}',status_code=204)
def delete_book(book_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'books.upload')
    b=book_or_404(db,user,book_id)
    if db.scalar(select(BookChapter.id).where(BookChapter.textbook_id==b.id).limit(1)) is not None:
        raise HTTPException(409,'This book contains chapters. Archive instead of deleting it; deletion is blocked to protect learning history.')
    db.delete(b);db.commit()

@router.get('/{book_id}/pdf')
def read_book_pdf(book_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    book=book_or_404(db,user,book_id)
    if user.role=='student':
        visible=db.scalar(select(BookChapter.id).where(BookChapter.textbook_id==book.id,BookChapter.school_id==user.school_id,BookChapter.status=='published').limit(1))
        if visible is None: raise HTTPException(403,'Book is not published')
    path=STORAGE / str(user.school_id) / book.storage_key
    if not path.is_file(): raise HTTPException(404,'PDF file not found')
    return FileResponse(path,media_type='application/pdf',filename=book.filename or f'book-{book_id}.pdf',content_disposition_type='inline')

@router.get('/{book_id}')
def get_book(book_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    book=book_or_404(db,user,book_id)
    query=select(BookChapter).where(BookChapter.textbook_id==book.id,BookChapter.school_id==user.school_id).order_by(BookChapter.number)
    chapters=[c for c in db.scalars(query) if user.role!='student' or c.status=='published']
    return {'book':book_json(book),'chapters':[chapter_json(c) for c in chapters],
            'extracted_preview':book.extracted_text[:10000] if user.role in ('teacher','admin') else ''}

class ChapterInput(BaseModel):
    number:int=Field(ge=1,le=500)
    title:str=Field(min_length=2,max_length=220)
    source_text:str=Field(default='',max_length=100000)

@router.post('/{book_id}/chapters',status_code=201)
def add_chapter(book_id:int,data:ChapterInput,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'chapters.edit');book=book_or_404(db,user,book_id)
    if db.scalar(select(BookChapter).where(BookChapter.textbook_id==book.id,BookChapter.number==data.number)):
        raise HTTPException(409,'Chapter number already exists')
    chapter=BookChapter(school_id=user.school_id,textbook_id=book.id,number=data.number,title=data.title,source_text=data.source_text,status='draft')
    db.add(chapter);db.commit();db.refresh(chapter)
    return chapter_json(chapter)

class ChapterUpdate(BaseModel):
    title:str|None=Field(default=None,min_length=2,max_length=220)
    source_text:str|None=Field(default=None,max_length=100000)
    status:str|None=None

@router.put('/{book_id}/chapters/{chapter_id}')
def edit_chapter(book_id:int,chapter_id:int,data:ChapterUpdate,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'chapters.edit');book_or_404(db,user,book_id)
    c=db.scalar(select(BookChapter).where(BookChapter.id==chapter_id,BookChapter.textbook_id==book_id,BookChapter.school_id==user.school_id))
    if not c: raise HTTPException(404,'Chapter not found')
    if c.status=='published' and (data.title is not None or data.source_text is not None): require(db,user,'content.publish')
    if data.title is not None: c.title=data.title
    if data.source_text is not None: c.source_text=data.source_text
    if data.status is not None:
        if data.status not in ('draft','reviewed','published'): raise HTTPException(422,'Invalid status')
        if data.status=='published': require(db,user,'content.publish')
        c.status=data.status
    db.commit();return chapter_json(c)

@router.get('/{book_id}/chapter-suggestions')
def suggestions(book_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    editor(user);book=book_or_404(db,user,book_id)
    matches=[]
    for line in book.extracted_text.splitlines():
        m=re.match(r'^\s*(?:chapter|unit)\s+(\d{1,3})\s*[:.\-–]?\s*(.{3,120})$',line,re.I)
        if m and len(matches)<100:
            item={'number':int(m.group(1)),'title':m.group(2).strip()}
            if item not in matches:matches.append(item)
    return {'suggestions':matches,'method':'heuristic','review_required':True}

class BulkReview(BaseModel):
    chapter_ids:list[int]=Field(min_length=1,max_length=500)
    action:str

@router.post('/{book_id}/chapters/bulk-review')
def bulk_review(book_id:int,data:BulkReview,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'chapters.edit')
    book_or_404(db,user,book_id)
    if data.action not in ('review','publish'):
        raise HTTPException(422,'Action must be review or publish')
    if data.action=='publish': require(db,user,'content.publish')
    else: require(db,user,'chapters.edit')
    ids=set(data.chapter_ids)
    chapters=list(db.scalars(select(BookChapter).where(BookChapter.textbook_id==book_id,BookChapter.school_id==user.school_id,BookChapter.id.in_(ids))))
    if len(chapters)!=len(ids):
        raise HTTPException(404,'One or more chapters not found in this school textbook')
    if data.action=='publish' and any(c.status!='reviewed' for c in chapters):
        raise HTTPException(409,'Review every selected chapter before publishing')
    for chapter in chapters:
        if data.action=='review' and chapter.status=='draft': chapter.status='reviewed'
        if data.action=='publish': chapter.status='published'
    db.commit()
    return {'updated':len(chapters),'action':data.action}

@router.post('/{book_id}/detect-chapters')
def detect_existing_book(book_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'chapters.edit')
    book=book_or_404(db,user,book_id)
    target=STORAGE / str(user.school_id) / book.storage_key
    if not target.is_file(): raise HTTPException(404,'Original PDF not found on server')
    from pypdf import PdfReader
    try:
        items=detect_contents(PdfReader(str(target)))
    except Exception:
        raise HTTPException(422,'Unable to read this PDF')
    existing=set(db.scalars(select(BookChapter.number).where(BookChapter.textbook_id==book_id)))
    added=0
    for item, ending in page_ranges(items):
        if item['number'] not in existing:
            chapter=BookChapter(school_id=user.school_id,textbook_id=book_id,number=item['number'],title=normalized_title(item['title'],item['page']),source_text='',status='draft')
            db.add(chapter);db.flush()
            db.add(ChapterPageRange(school_id=user.school_id,chapter_id=chapter.id,printed_start=item['page'],printed_end=ending,pdf_offset=0))
            added+=1
    db.commit()
    return {'detected':len(items),'added':added,'review_required':True}


PERMISSIONS = ('books.upload','chapters.edit','content.generate','content.publish','exercises.create')
KINDS = ('notes','qa','quiz','exercise','animation_script','video')

@router.get('/permissions/teachers')
def list_teacher_permissions(user:User=Depends(current_user),db:Session=Depends(get_db)):
    if user.role != 'admin': raise HTTPException(403,'Admin required')
    teachers=list(db.scalars(select(User).where(User.school_id==user.school_id,User.role=='teacher').order_by(User.full_name)))
    return [{'id':t.id,'name':t.full_name,'email':t.email,'permissions':list(db.scalars(select(TeacherPermission.permission).where(TeacherPermission.teacher_id==t.id,TeacherPermission.school_id==user.school_id)))} for t in teachers]

class PermissionUpdate(BaseModel):
    permissions:list[str]

@router.put('/permissions/teachers/{teacher_id}')
def set_teacher_permissions(teacher_id:int,data:PermissionUpdate,user:User=Depends(current_user),db:Session=Depends(get_db)):
    if user.role != 'admin': raise HTTPException(403,'Admin required')
    teacher=db.scalar(select(User).where(User.id==teacher_id,User.school_id==user.school_id,User.role=='teacher'))
    if not teacher: raise HTTPException(404,'Teacher not found')
    if any(p not in PERMISSIONS for p in data.permissions): raise HTTPException(422,'Invalid permission')
    for old in db.scalars(select(TeacherPermission).where(TeacherPermission.teacher_id==teacher_id,TeacherPermission.school_id==user.school_id)):
        db.delete(old)
    db.flush()
    for perm in set(data.permissions): db.add(TeacherPermission(school_id=user.school_id,teacher_id=teacher_id,permission=perm))
    db.commit()
    return {'teacher_id':teacher_id,'permissions':sorted(set(data.permissions))}


def chapter_for(db,user,book_id,chapter_id):
    book_or_404(db,user,book_id)
    c=db.scalar(select(BookChapter).where(BookChapter.id==chapter_id,BookChapter.textbook_id==book_id,BookChapter.school_id==user.school_id))
    if not c: raise HTTPException(404,'Chapter not found')
    if user.role=='student' and c.status!='published': raise HTTPException(404,'Chapter not found')
    return c

@router.get('/{book_id}/chapter-workspace')
def chapter_workspace(book_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    book=book_or_404(db,user,book_id)
    chapters=list(db.scalars(select(BookChapter).where(BookChapter.textbook_id==book.id,BookChapter.school_id==user.school_id).order_by(BookChapter.number)))
    ranges={r.chapter_id:r for r in db.scalars(select(ChapterPageRange).where(ChapterPageRange.school_id==user.school_id,ChapterPageRange.chapter_id.in_([c.id for c in chapters])))} if chapters else {}
    # Repair legacy chapters whose ranges were never saved during upload.
    # Use the uploaded book's TOC as the authoritative chapter-to-page mapping.
    if user.role in ('admin', 'teacher') and chapters and any(not ranges.get(c.id) or ranges[c.id].printed_start is None for c in chapters):
        from pypdf import PdfReader
        target=STORAGE/str(user.school_id)/book.storage_key
        if target.is_file():
            try:
                toc=detect_contents(PdfReader(str(target)))
                by_number={item['number']:item for item in toc}
                repaired=False
                for c in chapters:
                    item=by_number.get(c.number)
                    if not item: continue
                    r=ranges.get(c.id)
                    if r and r.printed_start is not None: continue
                    if not r:
                        r=ChapterPageRange(school_id=user.school_id,chapter_id=c.id)
                        db.add(r); ranges[c.id]=r
                    r.printed_start=item['page']
                    next_item=next((x for x in toc if x['number']>c.number),None)
                    r.printed_end=next_item['page']-1 if next_item else None
                    r.pdf_offset=0
                    c.title=normalized_title(item['title'],item['page'])
                    repaired=True
                if repaired: db.commit()
            except Exception:
                # An unreadable PDF should not prevent opening the chapter page.
                pass
    result=[]
    for i,c in enumerate(chapters):
        if user.role=='student' and c.status!='published':continue
        r=ranges.get(c.id)
        next_start=next((ranges[x.id].printed_start for x in chapters[i+1:] if x.id in ranges and ranges[x.id].printed_start is not None),None)
        start=r.printed_start if r else None
        end=(next_start-1) if next_start is not None else None
        assets=list(db.scalars(select(ChapterAsset).where(ChapterAsset.chapter_id==c.id,ChapterAsset.school_id==user.school_id).order_by(ChapterAsset.id)))
        if user.role=='student': assets=[a for a in assets if a.status=='published']
        display_title=c.title
        if r and r.printed_start is not None and display_title.endswith(' '+str(r.printed_start)):
            display_title=display_title[:-(len(str(r.printed_start))+1)].strip()
        result.append({'id':c.id,'number':c.number,'title':display_title,'status':c.status,'printed_start':start,'printed_end':(r.printed_end if r and r.printed_end is not None else end),'pdf_offset':(r.pdf_offset if r else None),'source_available':bool(r and r.source_available),'source_text':c.source_text if user.role!='student' or c.status=='published' else '', 'assets':[{'id':a.id,'kind':a.kind,'title':a.title,'body':public_body(a.kind,a.body) if user.role=='student' else a.body,'status':a.status} for a in assets]})
    return {'book':book_json(book),'chapters':result}

class RangeUpdate(BaseModel):
    printed_start:int|None=Field(default=None,ge=1)
    printed_end:int|None=Field(default=None,ge=1)
    pdf_offset:int|None=None

@router.put('/{book_id}/chapters/{chapter_id}/pages')
def set_chapter_pages(book_id:int,chapter_id:int,data:RangeUpdate,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'chapters.edit');c=chapter_for(db,user,book_id,chapter_id)
    r=db.scalar(select(ChapterPageRange).where(ChapterPageRange.chapter_id==c.id,ChapterPageRange.school_id==user.school_id))
    if not r:
        r=ChapterPageRange(school_id=user.school_id,chapter_id=c.id);db.add(r)
    if data.printed_start is None or data.printed_end is None:
        raise HTTPException(422,'Start and end pages are required. Use the book contents to recover missing pages.')
    if data.printed_end < data.printed_start:
        raise HTTPException(422,'End page must not precede start page')
    r.printed_start=data.printed_start;r.printed_end=data.printed_end;r.pdf_offset=data.pdf_offset if data.pdf_offset is not None else 0;r.source_available=False;c.source_text=''
    db.commit();return {'saved':True}

@router.post('/{book_id}/chapters/{chapter_id}/extract')
def extract_chapter(book_id:int,chapter_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    require(db,user,'chapters.edit');c=chapter_for(db,user,book_id,chapter_id)
    book=book_or_404(db,user,book_id)
    r=db.scalar(select(ChapterPageRange).where(ChapterPageRange.chapter_id==c.id,ChapterPageRange.school_id==user.school_id))
    if not r or r.printed_start is None:
        raise HTTPException(422,'Verify chapter start page first')
    siblings=list(db.scalars(select(BookChapter).where(BookChapter.textbook_id==book_id).order_by(BookChapter.number)))
    ix=next(i for i,x in enumerate(siblings) if x.id==c.id)
    next_start=None
    for x in siblings[ix+1:]:
        nr=db.scalar(select(ChapterPageRange).where(ChapterPageRange.chapter_id==x.id))
        if nr and nr.printed_start is not None:next_start=nr.printed_start;break
    from pypdf import PdfReader
    target=STORAGE/str(user.school_id)/book.storage_key
    if not target.is_file():raise HTTPException(404,'Original PDF missing')
    reader=PdfReader(str(target))
    end=r.printed_end or (next_start-1 if next_start else None)
    if end is None:
        # Final chapter with no recorded end: read to the last page of the PDF.
        end=len(reader.pages)-(r.pdf_offset or 0)
    if end<r.printed_start:raise HTTPException(422,'Invalid chapter page range')
    first=r.printed_start+(r.pdf_offset or 0)-1;last=end+(r.pdf_offset or 0)-1
    if first<0 or last>=len(reader.pages):raise HTTPException(422,f'Chapter needs PDF pages {first+1}–{last+1}, but uploaded file contains {len(reader.pages)} pages. Check the page offset or upload the missing pages.')
    parts=[]
    scanned=[]
    for i in range(first,last+1):
        page_text=(reader.pages[i].extract_text() or '').strip()
        if not page_text:
            scanned.append(i)
        parts.append(page_text)
    if scanned:
        try:
            import fitz
            import pytesseract
            from PIL import Image
            with fitz.open(str(target)) as doc:
                for i in scanned:
                    pix=doc[i].get_pixmap(matrix=fitz.Matrix(2,2),alpha=False)
                    img=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
                    parts[i-first]=pytesseract.image_to_string(img,lang='eng').strip()
        except ImportError as exc:
            raise HTTPException(503, 'OCR dependency missing in the running FastAPI Python environment: '+str(exc)+'. Run: python -m pip install -r requirements.txt and restart FastAPI. (PyMuPDF is imported as fitz.)')
        except Exception as exc:
            if exc.__class__.__name__=='TesseractNotFoundError':
                raise HTTPException(503, 'Tesseract OCR executable not found. Install Tesseract, add it to PATH (or set pytesseract.pytesseract.tesseract_cmd), then restart FastAPI.') from exc
            raise HTTPException(422,'OCR failed: '+str(exc))
    content='\n\n'.join(f'[PDF page {first+i+1}]\n'+part for i,part in enumerate(parts) if part)
    if not content.strip():raise HTTPException(422,'No readable text after PDF extraction and OCR. Check the scan quality.')
    c.source_text=content[:100000];r.source_available=True;db.commit()
    return {'extracted_characters':len(c.source_text),'pdf_pages':[first+1,last+1],'source_text':c.source_text}

class AssetInput(BaseModel):
    kind:str
    title:str=Field(min_length=2,max_length=220)
    body:str=Field(min_length=1,max_length=100000)

@router.post('/{book_id}/chapters/{chapter_id}/assets',status_code=201)
def create_asset(book_id:int,chapter_id:int,data:AssetInput,user:User=Depends(current_user),db:Session=Depends(get_db)):
    if data.kind not in KINDS:raise HTTPException(422,'Invalid asset type')
    require(db,user,'exercises.create' if data.kind=='exercise' else 'content.generate')
    c=chapter_for(db,user,book_id,chapter_id)
    if data.kind=='video':
        try: data.body=sb.sanitize_body(data.body)
        except ValueError as exc: raise HTTPException(422,'Invalid animated lesson: '+str(exc))
    asset=ChapterAsset(school_id=user.school_id,chapter_id=c.id,kind=data.kind,title=data.title,body=data.body,status='draft',created_by=user.id)
    db.add(asset);db.commit();db.refresh(asset)
    return {'id':asset.id,'status':asset.status}

class AssetUpdate(BaseModel):
    title:str|None=Field(default=None,min_length=2,max_length=220)
    body:str|None=Field(default=None,min_length=1,max_length=100000)
    status:str|None=None

@router.put('/{book_id}/chapters/{chapter_id}/assets/{asset_id}')
def update_asset(book_id:int,chapter_id:int,asset_id:int,data:AssetUpdate,user:User=Depends(current_user),db:Session=Depends(get_db)):
    c=chapter_for(db,user,book_id,chapter_id)
    a=db.scalar(select(ChapterAsset).where(ChapterAsset.id==asset_id,ChapterAsset.chapter_id==c.id,ChapterAsset.school_id==user.school_id))
    if not a:raise HTTPException(404,'Asset not found')
    if data.status=='published':
        require(db,user,'content.publish')
        if a.status!='reviewed':raise HTTPException(409,'Review before publishing')
        if c.status!='published':raise HTTPException(409,'Publish chapter before assets')
    else:
        require(db,user,'exercises.create' if a.kind=='exercise' else 'content.generate')
    if data.status is not None:
        if data.status not in ('draft','reviewed','published'):raise HTTPException(422,'Invalid status')
        a.status=data.status
    if a.kind=='video' and data.body is not None:
        try: data.body=sb.sanitize_body(data.body)
        except ValueError as exc: raise HTTPException(422,'Invalid animated lesson: '+str(exc))
    if a.status=='published' and (data.title is not None or data.body is not None):
        a.status='draft'
    if data.title is not None:a.title=data.title
    if data.body is not None:a.body=data.body
    db.commit();return {'id':a.id,'status':a.status}

@router.post('/{book_id}/sync-chapter-pages')
def sync_chapter_pages(book_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    """Explicit admin/authorized-teacher refresh from PDF table of contents."""
    require(db,user,'chapters.edit')
    book=book_or_404(db,user,book_id)
    from pypdf import PdfReader
    target=STORAGE/str(user.school_id)/book.storage_key
    if not target.is_file():raise HTTPException(404,'Original PDF missing')
    reader=PdfReader(str(target))
    items=detect_contents(reader)
    if not items:raise HTTPException(422,'No numbered contents page detected. Edit page ranges manually.')
    by_number={i['number']:i for i in items}
    chapters=list(db.scalars(select(BookChapter).where(BookChapter.school_id==user.school_id,BookChapter.textbook_id==book_id)))
    changed=0
    for c in chapters:
        item=by_number.get(c.number)
        if not item:continue
        r=db.scalar(select(ChapterPageRange).where(ChapterPageRange.school_id==user.school_id,ChapterPageRange.chapter_id==c.id))
        if not r:
            r=ChapterPageRange(school_id=user.school_id,chapter_id=c.id)
            db.add(r)
        next_item=next((x for x in items if x['number']>c.number),None)
        new_end=next_item['page']-1 if next_item else None
        if (r.printed_start,r.printed_end)!=(item['page'],new_end) or c.title!=normalized_title(item['title'],item['page']):
            r.printed_start=item['page'];r.printed_end=new_end;r.pdf_offset=0
            r.source_available=False;c.source_text='';c.title=normalized_title(item['title'],item['page']);changed+=1
    db.commit()
    return {'updated':changed,'detected':len(items),'note':'Verify PDF offset and chapter ranges before extraction.'}


class QuestionItem(BaseModel):
    question: str = Field(min_length=1,max_length=3000)
    answer: str = Field(default='',max_length=10000)
    options: list[str] = Field(default_factory=list,max_length=8)
    correct_option: int | None = None
    explanation: str = Field(default='',max_length=10000)

class QuestionSetInput(BaseModel):
    kind: str
    title: str = Field(min_length=2,max_length=220)
    questions: list[QuestionItem] = Field(min_length=1,max_length=100)

@router.post('/{book_id}/chapters/{chapter_id}/question-sets',status_code=201)
def create_question_set(book_id:int,chapter_id:int,data:QuestionSetInput,user:User=Depends(current_user),db:Session=Depends(get_db)):
    if data.kind not in ('qa','quiz','exercise'): raise HTTPException(422,'Choose Q&A, quiz, or exercise')
    require(db,user,'exercises.create' if data.kind=='exercise' else 'content.generate')
    c=chapter_for(db,user,book_id,chapter_id)
    for q in data.questions:
        if q.correct_option is not None and (q.correct_option<0 or q.correct_option>=len(q.options)):
            raise HTTPException(422,'Correct option must match an existing option')
    body=json.dumps({'format':'question_set_v1','questions':[q.model_dump() for q in data.questions]},ensure_ascii=False)
    a=ChapterAsset(school_id=user.school_id,chapter_id=c.id,kind=data.kind,title=data.title,body=body,status='draft',created_by=user.id)
    db.add(a);db.commit();db.refresh(a)
    return {'id':a.id,'status':a.status,'question_count':len(data.questions)}

