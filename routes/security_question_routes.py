from fastapi import APIRouter
from controllers.security_question_controller import SecurityQuestionController

router = APIRouter(prefix="/security-questions", tags=["Security Questions"])

@router.post("/", response_model=dict)
async def add_or_update_security_questions(data: dict):
    return await SecurityQuestionController.add_or_update_security_questions(data)

@router.get("/", response_model=list)
async def get_security_questions():
    return await SecurityQuestionController.get_security_questions()

@router.put("/{id}", response_model=dict)
async def update_security_question(id: str, data: dict):
    return await SecurityQuestionController.update_security_question(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_security_question(id: str):
    return await SecurityQuestionController.delete_security_question(id)