from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UploadErrorItem(BaseModel):
    row: int
    message: str

class UploadScoresResponse(BaseModel):
    success: bool
    inserted: int = 0
    updated: int = 0
    failed: int = 0
    skipped: int = 0
    unauthorized: int = 0
    analytics_recalculated: bool = False
    affected_students: int = 0
    total_rows: int
    valid_rows: int
    error_rows: int
    status: str
    errors: List[UploadErrorItem] = Field(default_factory=list)

class ScoreHistoryItem(BaseModel):
    id: int
    date: str
    assessment_date: str
    assessment_name: str
    assessmentName: str
    category: str
    score: float
    max_marks: float
    maxMarks: float
    percentage: float

    class Config:
        from_attributes = True

class PerformanceSummary(BaseModel):
    total_assessments: int
    totalAssessments: int
    average_test_score: float
    averageTestScore: float
    best_assessment: Optional[ScoreHistoryItem] = None
    lowest_assessment: Optional[ScoreHistoryItem] = None
    improvement_trend: str
    placement_readiness_score: float
    placement_readiness_level: str

class StudentPerformanceResponse(BaseModel):
    student_id: int
    studentId: int
    register_no: str
    registerNo: str
    overall_score: float
    overallScore: float
    domain_scores: Dict[str, float]
    domainScores: Dict[str, float]
    strongest_domain: Optional[str] = None
    weakest_domain: Optional[str] = None
    score_history: List[ScoreHistoryItem] = Field(default_factory=list)
    scoreHistory: List[ScoreHistoryItem] = Field(default_factory=list)
    summary: PerformanceSummary
