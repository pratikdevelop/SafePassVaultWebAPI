from fastapi import HTTPException, status, Depends
from models import User, Organization, Invitation, AuditLog  # Assuming Beanie or MongoEngine models
from typing import List, Dict, Optional,Any
from datetime import datetime
import uuid
import bcrypt
from configuration import send_email  # Replace with your email service

class NoteController:
    @staticmethod
    async def create_note(user_id: str, folder_id: str, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new note."""
        try:
            if not folder_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder ID is required")

            note_data["user_id"] = user_id
            note_data["folder_id"] = folder_id
            note_data["modified_by"] = user_id

            new_note = Note(**note_data)
            await new_note.save()

            # Log the note creation
            audit_log = AuditLog(
                user_id=user_id,
                action="create",
                entity="note",
                entity_id=new_note.id,
                new_value=new_note.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent
            )
            await audit_log.save()

            return new_note.dict()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))