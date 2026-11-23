from pathlib import Path
import shutil, datetime
root=Path(__file__).resolve().parent
project=root
assert (project/'app').is_dir() and (project/'components').is_dir(), 'Extract ZIP to project root first'
backup=project/'.patch9_backups'/datetime.datetime.now().strftime('%Y%m%d_%H%M%S')

def edit(rel, transform):
    p=project/rel
    if not p.exists():
        print('MISSING:',rel); return
    old=p.read_text(encoding='utf-8-sig'); new=transform(old)
    if new==old:
        print('UNCHANGED:',rel); return
    backup_file=backup/rel; backup_file.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(p,backup_file)
    p.write_text(new,encoding='utf-8')
    print('UPDATED:',rel)

def roadmap(s):
    start=s.index('  { name: "Textbook & Curriculum", modules: [')
    end=s.index('  { name: "AI Content Studio", modules: [',start)
    new='''  { name: "Textbook & Curriculum", modules: [
    { name: "Class & Subject Book Library", status: "done" }, { name: "PDF Upload & Book Management", status: "done" },
    { name: "OCR for Scanned Textbooks", status: "done" }, { name: "Automatic Chapter Detection", status: "done" },
    { name: "Automatic Page Range & PDF Offset", status: "done" }, { name: "Chapter Information & Editing", status: "done" },
    { name: "Extract Chapter Text & Preview", status: "done" },
    { name: "Curriculum Mapping (CBSE/ICSE)", status: "partial", note: "Mapping UI installed; verify saving and reloading before marking working" },
    { name: "Book & Chapter Approval", status: "done" } ] },
'''
    return s[:start]+new+s[end:]

def shell(s):
    a='  const [menuOpen, setMenuOpen] = useState(false);'
    if a not in s: raise RuntimeError('AppShell structure changed; no edits made')
    s=s.replace(a,a+'''
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem("sukoaa-sidebar-collapsed") === "true"); } catch {}
  }, []);
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sukoaa-sidebar-collapsed", String(next)); } catch {}
  };''')
    s=s.replace('<div className="sk-shell">','<div className={`sk-shell${collapsed ? " sk-collapsed" : ""}`}>')
    s=s.replace('<Sidebar open={menuOpen} close={() => setMenuOpen(false)} />','<Sidebar open={menuOpen} close={() => setMenuOpen(false)} collapsed={collapsed} toggleCollapsed={toggleSidebar} />')
    return s

def sidebar(s):
    s=s.replace('Users, X, type LucideIcon','Users, X, PanelLeftClose, PanelLeftOpen, type LucideIcon')
    old='export default function Sidebar({ open, close }: { open: boolean; close: () => void }) {'
    new='export default function Sidebar({ open, close, collapsed, toggleCollapsed }: { open: boolean; close: () => void; collapsed: boolean; toggleCollapsed: () => void }) {'
    if old not in s: raise RuntimeError('Sidebar signature changed; no edits made')
    s=s.replace(old,new)
    s=s.replace('<aside className={`sk-sidebar${open ? " open" : ""}`}>','<aside className={`sk-sidebar${open ? " open" : ""}${collapsed ? " sk-sidebar-collapsed" : ""}`} >')
    s=s.replace('<div><b>SUKOAA</b><small>LearnMotion AI</small></div>','<div className="sk-brand-title"><b>SUKOAA</b><small>LearnMotion AI</small></div>\n          <button type="button" className="sk-desktop-collapse" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button>')
    s=s.replace('<Link href="/" aria-current={pathname === "/" ? "page" : undefined}><Home size={18} />Dashboard</Link>','<Link href="/" title="Dashboard" onClick={close} aria-current={pathname === "/" ? "page" : undefined}><Home size={18} /><span className="sk-nav-text">Dashboard</span></Link>')
    s=s.replace('<Link key={item.href} href={item.href} aria-current={item.href === current ? "page" : undefined}>','<Link key={item.href} href={item.href} title={item.name} onClick={close} aria-current={item.href === current ? "page" : undefined}>')
    s=s.replace('<item.icon size={18} />{item.name}','<item.icon size={18} /><span className="sk-nav-text">{item.name}</span>')
    s=s.replace('<LogOut size={18} />Sign out','<LogOut size={18} /><span className="sk-nav-text">Sign out</span>')
    s=s.replace('<LogIn size={18} />Sign in','<LogIn size={18} /><span className="sk-nav-text">Sign in</span>')
    return s

css='''
/* Patch 9: desktop sidebar collapse; mobile drawer stays full width */
@media (min-width: 769px) {
  .sk-sidebar, .sk-main { transition: width .2s ease, margin-left .2s ease; }
  .sk-desktop-collapse { display: inline-flex; align-items: center; justify-content: center; margin-left: auto; border: 0; background: transparent; color: #fff; cursor: pointer; padding: 6px; border-radius: 8px; }
  .sk-desktop-collapse:hover { background: rgba(255,255,255,.12); }
  .sk-collapsed .sk-sidebar { width: 68px; }
  .sk-collapsed .sk-main { margin-left: 68px; }
  .sk-collapsed .sk-sidebar .sk-brand-title, .sk-collapsed .sk-sidebar .sk-nav-label, .sk-collapsed .sk-sidebar .sk-nav-text { display: none; }
  .sk-collapsed .sk-sidebar .sk-brand { justify-content: center; flex-wrap: wrap; }
  .sk-collapsed .sk-sidebar .sk-desktop-collapse { margin-left: 0; }
  .sk-collapsed .sk-sidebar .sk-nav a, .sk-collapsed .sk-sidebar .sk-nav-link { justify-content: center; gap: 0; }
}
@media (max-width: 768px) {
  .sk-desktop-collapse { display: none; }
  .sk-collapsed .sk-sidebar { width: 264px; }
}
'''

edit('data/roadmap.ts',roadmap)
edit('components/layout/AppShell.tsx',shell)
edit('components/layout/Sidebar.tsx',sidebar)
edit('app/ui.css',lambda s:s if 'Patch 9: desktop sidebar collapse' in s else s+'\n'+css)
print('Patch 9 complete. Backups:',backup)
