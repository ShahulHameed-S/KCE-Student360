from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class AISummaryRequest(BaseModel):
    register_no: Optional[str] = None
    registerNo: Optional[str] = None

class AISummaryResponse(BaseModel):
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    placement_advice: str
    placementAdvice: str

class FacultyQueryRequest(BaseModel):
    query: str

class FacultyQueryResponse(BaseModel):
    intent: str
    domain: str
    limit: int
    students: List[Dict[str, Any]] = Field(default_factory=list)
    answer: str

class AIAssistantRequest(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None

class AIAssistantResponse(BaseModel):
    intent: str
    domain: str
    limit: int
    students: List[Dict[str, Any]] = Field(default_factory=list)
    answer: str
    provider: str
