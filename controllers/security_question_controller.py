from fastapi import HTTPException, Request
from models import SecurityQuestion  # Assuming Beanie model
from typing import Dict, Any, List

class SecurityQuestionController:
    @staticmethod
    async def add_or_update_security_questions(data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Add or update security questions for a user."""
        try:
            security_questions = data.get("securityQuestions", [])
            if not isinstance(security_questions, list) or not security_questions:
                security_questions = [
                    {"question": data.get("securityQuestion1"), "answer": data.get("securityAnswer1")},
                    {"question": data.get("securityQuestion2"), "answer": data.get("securityAnswer2")},
                ]

            updated_document = await SecurityQuestion.find_one(SecurityQuestion.user_id == user_id)
            if updated_document:
                updated_document.security_questions = security_questions
                updated_document.updated_at = datetime.now()
                await updated_document.save()
            else:
                updated_document = SecurityQuestion(
                    user_id=user_id,
                    security_questions=security_questions,
                    updated_at=datetime.now()
                )
                await updated_document.insert()

            return updated_document.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def get_security_questions(user_id: str) -> Dict[str, Any]:
        """Retrieve all security questions for a user."""
        try:
            questions = await SecurityQuestion.find_one(SecurityQuestion.user_id == user_id)
            return {"questions": questions.dict() if questions else None}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def update_security_question(question_id: str, data: Dict[str, str]) -> Dict[str, Any]:
        """Update a specific security question."""
        try:
            question = await SecurityQuestion.get(question_id)
            if not question:
                raise HTTPException(status_code=404, detail="Question not found")

            question.question = data.get("question", question.question)
            question.answer = data.get("answer", question.answer)
            question.updated_at = datetime.now()
            await question.save()

            return question.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def delete_security_question(question_id: str) -> Dict[str, str]:
        """Delete a specific security question."""
        try:
            question = await SecurityQuestion.get(question_id)
            if not question:
                raise HTTPException(status_code=404, detail="Question not found")

            await question.delete()
            return {"message": "Question deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))