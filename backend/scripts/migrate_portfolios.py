import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.student import Student
from app.models.portfolio import PortfolioCustomization

def main():
    db = SessionLocal()
    try:
        students = db.query(Student).all()
        count = 0
        for s in students:
            if s.register_no:
                pc = db.query(PortfolioCustomization).filter(PortfolioCustomization.student_id == s.id).first()
                if pc:
                    pc.email = f"{s.register_no.strip().replace(' ', '')}@kce.ac.in"
                    count += 1
        db.commit()
        print(f"Updated {count} portfolio customization emails successfully.")
    except Exception as e:
        db.rollback()
        print("Error during portfolio email update:", str(e))
    finally:
        db.close()

if __name__ == "__main__":
    main()
