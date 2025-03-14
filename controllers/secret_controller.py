from fastapi import HTTPException, Request
from models import Secret, AuditLog  # Assuming Beanie models
from typing import Dict, Any, List
from datetime import datetime

class SecretController:
    @staticmethod
    async def create_secret(data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Create a new secret and log the action."""
        try:
            if "tags" in data and data["tags"]:
                data["tags"] = [tag["id"] for tag in data["tags"] if "id" in tag]
            data["created_by"] = user_id

            secret = Secret(**data)
            await secret.insert()

            await AuditLog(
                user_id=user_id,
                action="create",
                entity="secrets",
                entity_id=str(secret.id),
                new_value=secret.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return {"message": "Secret stored successfully", "secret": secret.dict()}
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to store secret")

    @staticmethod
    async def get_all_secrets(request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve all secrets and log the action."""
        try:
            secrets = await Secret.find_all().to_list()
            secrets_dict = [secret.dict() for secret in secrets]

            await AuditLog(
                user_id=user_id,
                action="view",
                entity="secrets",
                entity_id=None,
                new_value=secrets_dict,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return {"secrets": secrets_dict}
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to retrieve secrets")

    @staticmethod
    async def get_secret_by_id(secret_id: str, request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve a secret by ID and log the action."""
        try:
            secret = await Secret.get(secret_id)
            if not secret:
                raise HTTPException(status_code=404, detail="Secret not found")

            await AuditLog(
                user_id=user_id,
                action="view",
                entity="secrets",
                entity_id=str(secret.id),
                new_value=secret.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return secret.dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to retrieve secret")

    @staticmethod
    async def update_secret(secret_id: str, data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Update a secret and log the action."""
        try:
            secret = await Secret.get(secret_id)
            if not secret:
                raise HTTPException(status_code=404, detail="Secret not found")

            old_value = secret.dict()
            for key, value in data.items():
                setattr(secret, key, value)
            await secret.save()

            await AuditLog(
                user_id=user_id,
                action="update",
                entity="secrets",
                entity_id=str(secret.id),
                old_value=old_value,
                new_value=secret.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return secret.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail="Failed to update secret")

    @staticmethod
    async def delete_secret(secret_id: str, request: Request, user_id: str) -> Dict[str, str]:
        """Delete a secret and log the action."""
        try:
            secret = await Secret.get(secret_id)
            if not secret:
                raise HTTPException(status_code=404, detail="Secret not found")

            old_value = secret.dict()
            await secret.delete()

            await AuditetteLog(
                user_id=user_id,
                action="delete",
                entity="secrets",
                entity_id=secret_id,
                old_value=old_value,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return {"message": "Secret deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to delete secret")

    @staticmethod
    async def search_secrets_by_name(name: str, request: Request, user_id: str) -> List[Dict[str, Any]]:
        """Search secrets by name and log the action."""
        try:
            secrets = await Secret.find(Secret.name.regex(f"(?i){name}")).to_list()
            secrets_dict = [secret.dict() for secret in secrets]

            await AuditLog(
                user_id=user_id,
                action="search",
                entity="secrets",
                entity_id=None,
                new_value=secrets_dict,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return secrets_dict
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to search secrets")