"""One-time, interactive Super Admin provisioning. Never ships with a default password."""
from getpass import getpass
from sqlalchemy import select
from app.db import SessionLocal
from app.models import User, School
from app.security import passwords
email=input('Super Admin email: ').strip().lower()
name=input('Full name: ').strip()
pw=getpass('New password (at least 12 characters): ')
if '@' not in email or len(name)<2 or len(pw)<12:
    raise SystemExit('Invalid email/name/password')
with SessionLocal() as db:
    if db.scalar(select(User).where(User.email==email)):
        raise SystemExit('Email already exists. No changes made.')
    school=db.scalar(select(School).order_by(School.id))
    if not school:
        school=School(name='SUKOAA Platform');db.add(school);db.flush()
    db.add(User(school_id=school.id,email=email,full_name=name,role='super_admin',password_hash=passwords.hash(pw),is_active=True,token_version=0))
    db.commit()
print('Super Admin created. Keep credentials secure.')
