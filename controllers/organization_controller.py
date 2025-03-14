from fastapi import HTTPException, status, Depends
from models import User, Organization, Invitation, AuditLog  # Assuming Beanie or MongoEngine models
from typing import List, Dict, Optional,Any
from datetime import datetime
import uuid
import bcrypt
from configuration import send_email  # Replace with your email service

class OrganizationController:
    @staticmethod
    async def create_organization(user_id: str, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Create a new organization."""
        try:
            organization = Organization(
                name=name,
                description=description,
                owner=user_id,
            )
            await organization.save()

            # Log the organization creation
            audit_log = AuditLog(
                user_id=user_id,
                action="create",
                entity="organization",
                entity_id=organization.id,
                new_value=organization.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent
            )
            await audit_log.save()

            return {"message": "Organization created successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))