"""Account lifecycle endpoints. Password reset is admin-assisted; no email reset tokens are issued."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .db import get_db
from .models import User, School
from .security import current_user, passwords, create_token

router = APIRouter(prefix='/auth', tags=['Authentication'])

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=12, max_length=128)

class ResetPassword(BaseModel):
    new_password: str = Field(min_length=12, max_length=128)

class UpdateAccount(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    email: EmailStr
    role: str
    school_id: int = Field(gt=0)

class SetActive(BaseModel):
    active: bool

def safe_user(u):
    return {'id':u.id,'name':u.full_name,'email':u.email,'role':u.role,'school_id':u.school_id,'is_active':u.is_active}

@router.post('/change-password')
def change_password(data:ChangePassword, user:User=Depends(current_user),db:Session=Depends(get_db)):
    if not passwords.verify(data.current_password,user.password_hash):
        raise HTTPException(400,'Current password is incorrect')
    if data.current_password == data.new_password:
        raise HTTPException(422,'Choose a different password')
    user.password_hash=passwords.hash(data.new_password)
    user.token_version+=1
    db.commit()
    return {'changed':True,'sessions_revoked':True}

@router.post('/logout')
def logout_all(user:User=Depends(current_user),db:Session=Depends(get_db)):
    user.token_version+=1
    db.commit()
    return {'signed_out':True,'sessions_revoked':True}

@router.get('/schools')
def list_schools(user:User=Depends(current_user),db:Session=Depends(get_db)):
    if user.role!='super_admin': raise HTTPException(403,'Super Admin required')
    return [{'id':s.id,'name':s.name} for s in db.scalars(select(School).order_by(School.name,School.id))]

@router.get('/accounts')
def accounts(user:User=Depends(current_user),db:Session=Depends(get_db)):
    if user.role not in ('admin','super_admin'): raise HTTPException(403,'Admin required')
    q=select(User).order_by(User.full_name)
    if user.role=='admin': q=q.where(User.school_id==user.school_id,User.role!='super_admin')
    return [safe_user(u) for u in db.scalars(q)]

def target_user(db,user,target_id):
    if user.role not in ('admin','super_admin'):raise HTTPException(403,'Admin required')
    target=db.get(User,target_id)
    if target is None or (user.role!='super_admin' and (target.school_id!=user.school_id or target.role in ('admin','super_admin'))):
        raise HTTPException(404,'Account not found')
    if target.id==user.id:raise HTTPException(403,'Cannot change your own account using admin tools')
    if target.role=='super_admin':raise HTTPException(403,'Super Admin accounts cannot be modified here')
    return target

@router.patch('/accounts/{user_id}/active')
def set_active(user_id:int,data:SetActive,user:User=Depends(current_user),db:Session=Depends(get_db)):
    target=target_user(db,user,user_id)
    target.is_active=data.active
    target.token_version+=1
    db.commit()
    return safe_user(target)

@router.post('/accounts/{user_id}/reset-password')
def reset_password(user_id:int,data:ResetPassword,user:User=Depends(current_user),db:Session=Depends(get_db)):
    target=target_user(db,user,user_id)
    target.password_hash=passwords.hash(data.new_password)
    target.token_version+=1
    db.commit()
    return {'reset':True,'sessions_revoked':True}

@router.patch('/accounts/{user_id}')
def update_account(user_id:int,data:UpdateAccount,user:User=Depends(current_user),db:Session=Depends(get_db)):
    if user.role!='super_admin': raise HTTPException(403,'Super Admin required')
    target=target_user(db,user,user_id)
    if data.role not in ('admin','teacher','student'):
        raise HTTPException(422,'Invalid role')
    if not db.get(School,data.school_id):
        raise HTTPException(422,'School does not exist')
    email=str(data.email).strip().lower()
    if db.scalar(select(User.id).where(User.email==email,User.id!=target.id)) is not None:
        raise HTTPException(409,'Email is already registered')
    target.full_name=data.name.strip()
    target.email=email
    target.role=data.role
    target.school_id=data.school_id
    target.token_version+=1
    try: db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409,'Account update conflicts with existing records')
    return safe_user(target)

@router.delete('/accounts/{user_id}',status_code=204)
def delete_account(user_id:int,user:User=Depends(current_user),db:Session=Depends(get_db)):
    if user.role!='super_admin': raise HTTPException(403,'Super Admin required')
    target=target_user(db,user,user_id)
    # No cascading deletion: protect student progress, textbook ownership and school records.
    db.delete(target)
    try: db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409,'This account has related school or learning records. Pause it instead to preserve data.')
