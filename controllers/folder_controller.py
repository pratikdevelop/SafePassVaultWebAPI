from fastapi import HTTPException, status, Depends
from models import Folder, AuditLog  # Assuming Beanie or MongoEngine models
from typing import List, Dict, Optional,Any
from datetime import datetime
from pydantic import BaseModel

class FolderController:
    @staticmethod
    async def create_folder(user_id: str, name: str, is_special: bool = False, folder_type: Optional[str] = None) -> Dict[str, Any]:
        """Create a new folder and log the action."""
        try:
            folder = Folder(
                user_id=user_id,
                name=name,
                is_special=is_special,
                type=folder_type,
            )
            await folder.save()

            # Log the folder creation
            audit_log = AuditLog(
                user_id=user_id,
                action="create",
                entity="folder",
                entity_id=folder.id,
                new_value=folder.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return folder.dict()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def get_user_folders(user_id: str) -> List[Dict[str, Any]]:
        """Retrieve all folders for the logged-in user."""
        try:
            folders = await Folder.find(Folder.user_id == user_id).to_list()

            # Log the folder retrieval
            audit_log = AuditLog(
                user_id=user_id,
                action="view",
                entity="folder",
                new_value=[folder.dict() for folder in folders],
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return folders
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def get_folder_by_id(user_id: str, folder_id: str) -> Dict[str, Any]:
        """Retrieve a specific folder by ID."""
        try:
            folder = await Folder.find_one(Folder.id == folder_id)
            if not folder:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
            if folder.user_id != user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

            # Log the folder retrieval
            audit_log = AuditLog(
                user_id=user_id,
                action="view",
                entity="folder",
                entity_id=folder.id,
                new_value=folder.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return folder.dict()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def update_folder(
        user_id: str,
        folder_id: str,
        name: Optional[str] = None,
        is_special: Optional[bool] = None,
        folder_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update a folder's metadata."""
        try:
            folder = await Folder.find_one(Folder.id == folder_id)
            if not folder:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
            if folder.user_id != user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

            old_folder = folder.dict()
            if name:
                folder.name = name
            if is_special is not None:
                folder.is_special = is_special
            if folder_type:
                folder.type = folder_type

            await folder.save()

            # Log the folder update
            audit_log = AuditLog(
                user_id=user_id,
                action="update",
                entity="folder",
                entity_id=folder.id,
                old_value=old_folder,
                new_value=folder.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return folder.dict()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def delete_folder(user_id: str, folder_id: str) -> Dict[str, Any]:
        """Delete a folder."""
        try:
            folder = await Folder.find_one(Folder.id == folder_id)
            if not folder:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
            if folder.user_id != user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

            await folder.delete()

            # Log the folder deletion
            audit_log = AuditLog(
                user_id=user_id,
                action="delete",
                entity="folder",
                entity_id=folder.id,
                old_value=folder.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "Folder deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def get_folders_by_type(user_id: str, folder_type: str) -> List[Dict[str, Any]]:
        """Retrieve folders by type."""
        try:
            folders = await Folder.find(Folder.user_id == user_id, Folder.type == folder_type).to_list()
            if not folders:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No folders found for this type")

            formatted_folders = [{"_id": folder.id, "label": folder.name} for folder in folders]

            # Log the folder retrieval
            audit_log = AuditLog(
                user_id=user_id,
                action="view",
                entity="folder",
                entity_id=None,
                new_value=formatted_folders,
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return formatted_folders
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def search_folders(user_id: str, search_term: str, folder_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search folders by name and optional type."""
        try:
            if not search_term:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search term is required")

            query = {"user_id": user_id, "name": {"$regex": search_term, "$options": "i"}}
            if folder_type:
                query["type"] = folder_type

            folders = await Folder.find(query).to_list()
            formatted_folders = [{"_id": folder.id, "label": folder.name, "type": folder.type} for folder in folders]

            # Log the search action
            audit_log = AuditLog(
                user_id=user_id,
                action="search",
                entity="folder",
                entity_id=None,
                new_value=formatted_folders,
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return formatted_folders
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))