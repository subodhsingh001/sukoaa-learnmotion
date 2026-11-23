"""Read-only board-aware starter curriculum endpoints. No database migration required."""
import json
from functools import lru_cache
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
router=APIRouter(prefix="/curriculum",tags=["curriculum"])
@lru_cache(maxsize=1)
def catalog():
    return json.loads(Path(__file__).with_name("curriculum_catalog.json").read_text(encoding="utf-8"))
@router.get("/boards")
def boards(): return ["CBSE/NCERT", "ICSE/ISC"]
@router.get("/chapters")
def chapters(board: str=Query(...), class_level:int=Query(...,ge=1,le=12),subject:str|None=None):
    if board not in ("CBSE/NCERT","ICSE/ISC"): raise HTTPException(422,"Unsupported board")
    return [c for c in catalog() if c["board"]==board and c["classLevel"]==class_level and (subject is None or c["subject"]==subject)]
