"""Storyboards: an animated lesson is DATA (scenes + narration), played by reusable 2D/3D templates in the browser.

The AI never draws anything. It only chooses a template for each scene and fills in its parameters, so every
animation is predictable, cheap to produce and easy for a teacher to review and correct.
"""
import json
import re

FORMAT = 'storyboard_v1'
MAX_SCENES = 12

# template -> human description used in the AI prompt (also the single source of truth for allowed templates)
CATALOGUE = {
    'title_card':    '2D. Opening card. params: heading (str), subtitle (str)',
    'bullets':       '2D. Key points revealed one by one. params: heading (str), points (list of 2-5 short str)',
    'number_line':   '2D. A marker moving along a number line (integers, fractions, temperature, time). params: min (int), max (int), mark (number), label (str)',
    'force_diagram': '2D. A box pushed by a force; shows a = F/m. params: force (1-20, newtons), mass (1-10, kg), label (str)',
    'orbit':         '2D. One body orbiting another (planet/Sun, electron/nucleus, Moon/Earth). params: center_label (str), orbiter_label (str)',
    'cycle':         '2D. A repeating process shown as a loop (water cycle, food chain, life cycle). params: heading (str), steps (list of 3-6 short str)',
    'formula':       '2D. One big formula or rule with a caption. params: expression (str), caption (str)',
    'atom3d':        '3D. Rotating atom model. params: protons (1-18), neutrons (0-20), electrons (1-18)',
    'shape3d':       '3D. Rotating solid. params: shape (cube|sphere|cylinder|cone), wireframe (bool)',
}


def _s(v, n):
    return re.sub(r'\s+', ' ', str(v if v is not None else '')).strip()[:n]


def _num(v, lo, hi, default):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, x))


def _list(v, n_min, n_max, item_len):
    items = [_s(x, item_len) for x in (v if isinstance(v, list) else []) if _s(x, item_len)]
    return items[:n_max] if len(items) >= n_min else []


def clean_params(template, p):
    p = p if isinstance(p, dict) else {}
    if template == 'title_card':
        return {'heading': _s(p.get('heading'), 90), 'subtitle': _s(p.get('subtitle'), 120)}
    if template == 'bullets':
        pts = _list(p.get('points'), 1, 5, 110)
        return {'heading': _s(p.get('heading'), 80), 'points': pts} if pts else None
    if template == 'number_line':
        lo, hi = int(_num(p.get('min'), -1000, 999, 0)), int(_num(p.get('max'), -999, 1000, 10))
        if hi <= lo:
            lo, hi = 0, 10
        if hi - lo > 40:
            hi = lo + 40
        return {'min': lo, 'max': hi, 'mark': _num(p.get('mark'), lo, hi, lo), 'label': _s(p.get('label'), 60)}
    if template == 'force_diagram':
        return {'force': _num(p.get('force'), 1, 20, 8), 'mass': _num(p.get('mass'), 1, 10, 2), 'label': _s(p.get('label'), 60)}
    if template == 'orbit':
        return {'center_label': _s(p.get('center_label'), 24) or 'Center', 'orbiter_label': _s(p.get('orbiter_label'), 24) or 'Orbiter'}
    if template == 'cycle':
        steps = _list(p.get('steps'), 3, 6, 40)
        return {'heading': _s(p.get('heading'), 70), 'steps': steps} if steps else None
    if template == 'formula':
        expr = _s(p.get('expression'), 70)
        return {'expression': expr, 'caption': _s(p.get('caption'), 140)} if expr else None
    if template == 'atom3d':
        return {'protons': int(_num(p.get('protons'), 1, 18, 6)), 'neutrons': int(_num(p.get('neutrons'), 0, 20, 6)), 'electrons': int(_num(p.get('electrons'), 1, 18, 6))}
    if template == 'shape3d':
        shape = p.get('shape') if p.get('shape') in ('cube', 'sphere', 'cylinder', 'cone') else 'cube'
        return {'shape': shape, 'wireframe': bool(p.get('wireframe', False))}
    return None


def sanitize(data, title='Lesson', language='en'):
    """Return a safe storyboard dict, silently dropping anything malformed. Raises ValueError if nothing usable is left."""
    if not isinstance(data, dict):
        raise ValueError('Storyboard must be an object')
    scenes = []
    for raw in (data.get('scenes') if isinstance(data.get('scenes'), list) else [])[:MAX_SCENES]:
        if not isinstance(raw, dict) or raw.get('template') not in CATALOGUE:
            continue
        params = clean_params(raw['template'], raw.get('params'))
        narration = _s(raw.get('narration'), 420)
        if params is None or not narration:
            continue
        words = len(narration.split())
        scenes.append({'template': raw['template'], 'params': params, 'narration': narration,
                       'seconds': int(_num(raw.get('seconds'), 4, 30, max(5, round(words / 2.4) + 1)))})
    if len(scenes) < 2:
        raise ValueError('A storyboard needs at least two valid scenes')
    lang = data.get('language') if data.get('language') in ('en', 'hi', 'bn') else language
    return {'format': FORMAT, 'title': _s(data.get('title'), 120) or title, 'language': lang, 'scenes': scenes}


def sanitize_body(body):
    return json.dumps(sanitize(json.loads(body)), ensure_ascii=False)
