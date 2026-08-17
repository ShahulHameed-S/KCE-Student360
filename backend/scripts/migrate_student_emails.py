import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.student import Student
from app.models.user import User
from app.models.profile import UserProfile
from sqlalchemy import func

def main():
    db = SessionLocal()
    try:
        students = db.query(Student).all()
        reg_counts = {}
        for s in students:
            if s.register_no:
                reg = s.register_no.strip().replace(" ", "")
                reg_counts[reg] = reg_counts.get(reg, 0) + 1
                
        conflicts = []
        updated_count = 0
        skipped_count = 0
        errors = []
        
        for student in students:
            if not student.register_no:
                skipped_count += 1
                continue
                
            clean_reg = student.register_no.strip().replace(" ", "")
            
            if reg_counts.get(clean_reg, 0) > 1:
                conflicts.append({
                    "register_no": student.register_no,
                    "reason": "Duplicate register number in students table"
                })
                skipped_count += 1
                continue
                
            if not student.user_id:
                skipped_count += 1
                continue
                
            user = db.query(User).filter(User.id == student.user_id).first()
            if not user:
                skipped_count += 1
                continue
                
            if user.role != "student":
                skipped_count += 1
                continue
                
            new_email = f"{clean_reg}@kce.ac.in"
            
            if user.email == new_email and user.username == clean_reg:
                student.email = new_email
                up = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
                if up:
                    up.email = new_email
                skipped_count += 1
                continue
                
            existing_with_email = db.query(User).filter(
                (func.lower(User.email) == new_email.lower()) & (User.id != user.id)
            ).first()
            if existing_with_email:
                conflicts.append({
                    "register_no": student.register_no,
                    "reason": f"Email conflict: email {new_email} is already used by another user (ID: {existing_with_email.id})"
                })
                skipped_count += 1
                continue
                
            try:
                user.email = new_email
                user.username = clean_reg
                student.email = new_email
                
                up = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
                if up:
                    up.email = new_email
                    
                db.flush()
                updated_count += 1
            except Exception as e:
                db.rollback()
                errors.append({
                    "register_no": student.register_no,
                    "error": str(e)
                })
                skipped_count += 1
                
        db.commit()
        print(f"Migration completed successfully!")
        print(f"Summary: updated={updated_count}, skipped={skipped_count}, conflicts={len(conflicts)}, errors={len(errors)}")
        if conflicts:
            print("Conflicts:", conflicts)
        if errors:
            print("Errors:", errors)
    except Exception as e:
        db.rollback()
        print("Migration failed:", str(e))
    finally:
        db.close()

if __name__ == "__main__":
    main()
