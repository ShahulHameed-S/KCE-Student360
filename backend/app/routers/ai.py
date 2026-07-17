from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.student import Student
from app.schemas.ai import AISummaryRequest, AISummaryResponse, FacultyQueryRequest, FacultyQueryResponse, AIAssistantRequest, AIAssistantResponse
from app.services.ai_service import generate_student_ai_summary, execute_faculty_query, execute_assistant_query

router = APIRouter()

@router.post("/generate-summary", response_model=AISummaryResponse)
async def generate_summary(payload: AISummaryRequest, db: Session = Depends(get_db)):
    """
    Generates or retrieves an AI-driven student performance summary.
    Saves metrics in the database and returns a frontend-compatible representation.
    """
    # Accept register_no or registerNo
    reg_no = payload.register_no or payload.registerNo
    if not reg_no:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student register number is required in request payload"
        )

    # 1. Fetch student
    student = db.query(Student).filter(Student.register_no == reg_no).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with register number '{reg_no}' not found"
        )

    # 2. Trigger async summary generator
    summary_report = await generate_student_ai_summary(db, student.id)
    return summary_report

@router.post("/faculty-query", response_model=FacultyQueryResponse)
async def faculty_query(
    payload: FacultyQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses and answers natural language requests submitted by faculties
    regarding student toppers, placement readies, and performance warning flags.
    """
    if not payload.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string is required"
        )

    result = execute_faculty_query(db, payload.query)
    return result

@router.post("/assistant", response_model=AIAssistantResponse)
async def ai_assistant(
    payload: AIAssistantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified AI Assistant endpoint that accepts natural language queries,
    performs database-first querying, and returns conversational analysis.
    Accepts both 'query' and 'message' fields in request payload.
    """
    user_query = payload.query or payload.message
    if not user_query or not user_query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query or message string is required"
        )
        
    result = await execute_assistant_query(db, user_query)
    return result
