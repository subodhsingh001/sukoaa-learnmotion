from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import User

passwords = PasswordHash.recommended()
bearer = HTTPBearer()
def create_token(user: User):
    return jwt.encode({'sub':str(user.id), 'ver':user.token_version, 'exp':datetime.now(timezone.utc)+timedelta(minutes=settings.token_minutes)},settings.jwt_secret,algorithm='HS256')
def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=['HS256'])
        user_id = int(payload['sub'])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401,'Invalid or expired token')
    user = db.get(User,user_id)
    if not user or not user.is_active: raise HTTPException(401,'Account unavailable')
    if payload.get('ver') != user.token_version: raise HTTPException(401,'Session has been revoked')
    return user
