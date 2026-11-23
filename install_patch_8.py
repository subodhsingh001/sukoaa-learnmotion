"""Apply Curriculum Mapping without replacing existing auth, models, or chapter-detection code."""
from pathlib import Path
import shutil
import sys

root = Path(__file__).resolve().parent
project = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
model_block = "class ChapterCurriculumMap(Base):\n    __tablename__ = 'chapter_curriculum_maps'\n    id: Mapped[int] = mapped_column(primary_key=True)\n    school_id: Mapped[int] = mapped_column(ForeignKey('schools.id'), index=True)\n    textbook_id: Mapped[int] = mapped_column(ForeignKey('textbooks.id'), index=True)\n    chapter_id: Mapped[int] = mapped_column(ForeignKey('book_chapters.id'), unique=True)\n    board: Mapped[str] = mapped_column(String(30))\n    topic: Mapped[str] = mapped_column(String(220))\n    source: Mapped[str] = mapped_column(String(24), default='manual')\n    status: Mapped[str] = mapped_column(String(24), default='draft')\n    updated_by: Mapped[int] = mapped_column(ForeignKey('users.id'))\n    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)\n\n\n"
models = project / 'backend/app/models.py'
main = project / 'backend/app/main.py'
page = project / 'app/book-workspace/[bookId]/page.tsx'
for f in (models, main, page):
    if not f.is_file():
        raise SystemExit(f'Missing required project file: {f}')
ms = models.read_text(encoding='utf-8')
if 'class ChapterCurriculumMap(Base):' not in ms:
    marker = 'class TeacherPermission(Base):'
    if marker not in ms:
        raise SystemExit('Cannot find TeacherPermission model; no files changed')
    ms = ms.replace(marker, model_block + marker, 1)
ma = main.read_text(encoding='utf-8')
if 'from .curriculum_mapping_routes import router as curriculum_mapping_router' not in ma:
    marker = 'from .textbook_routes import router as textbook_router'
    if marker not in ma: raise SystemExit('Cannot find textbook router import; no files changed')
    ma = ma.replace(marker, marker + '\nfrom .curriculum_mapping_routes import router as curriculum_mapping_router', 1)
if 'app.include_router(curriculum_mapping_router)' not in ma:
    marker = 'app.include_router(textbook_router)'
    if marker not in ma: raise SystemExit('Cannot find textbook router registration; no files changed')
    ma = ma.replace(marker, marker + '\napp.include_router(curriculum_mapping_router)', 1)
pg = page.read_text(encoding='utf-8')
if 'import CurriculumMapping from' not in pg:
    marker = 'import { statusTone } from "@/lib/format";'
    if marker not in pg: raise SystemExit('Cannot locate book page imports; no files changed')
    pg = pg.replace(marker, marker + '\nimport CurriculumMapping from "@/components/book/CurriculumMapping";', 1)
if 'const [showCurriculum, setShowCurriculum]' not in pg:
    marker = '  const [showAdd, setShowAdd] = useState(false);'
    if marker not in pg: raise SystemExit('Cannot locate book page state; no files changed')
    pg = pg.replace(marker, marker + '\n  const [showCurriculum, setShowCurriculum] = useState(false);', 1)
if 'Hide Curriculum' not in pg:
    marker = '          <Button size="sm" onClick={detect}'
    if marker not in pg: raise SystemExit('Cannot locate chapter toolbar; no files changed')
    pg = pg.replace(marker, '          <Button size="sm" onClick={() => setShowCurriculum((v) => !v)}>{showCurriculum ? "Hide Curriculum" : "Map Curriculum"}</Button>\n' + marker, 1)
if '<CurriculumMapping bookId={bookId}' not in pg:
    marker = '      {(drafts.length > 0'
    if marker not in pg: raise SystemExit('Cannot locate book page footer; no files changed')
    pg = pg.replace(marker, '      {showCurriculum && book && <CurriculumMapping bookId={bookId} />}\n' + marker, 1)
for f, content in ((models,ms),(main,ma),(page,pg)):
    shutil.copy2(f, f.with_suffix(f.suffix + '.before_curriculum_patch_8'))
    f.write_text(content,encoding='utf-8')
for rel in ('backend/app/curriculum_mapping_routes.py','components/book/CurriculumMapping.tsx'):
    dest=project / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists(): shutil.copy2(dest,dest.with_suffix(dest.suffix+'.before_curriculum_patch_8'))
    print('COPYING:', root / rel, 'TO:', dest, flush=True)
    source = root / rel

    if source.resolve() != dest.resolve():
     shutil.copy2(source, dest)
    else:
     print(f"SKIPPED: {rel} (source and destination are identical)")
    print('Curriculum Mapping Patch 8 installed. Existing auth and chapter detection code preserved.')

