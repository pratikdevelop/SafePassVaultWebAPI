from fastapi import HTTPException, status, UploadFile, File as FastAPIFile
from models import File, Folder, Invitation, AuditLog  # Assuming Beanie or MongoEngine models
from typing import List, Dict, Optional, Any
from datetime import datetime
import os
import boto3
from boto3.s3.transfer import TransferConfig
from pydantic import BaseModel

# AWS S3 Configuration
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME_FILE_STORAGE")

class FileController:
    @staticmethod
    async def upload_file(
        user_id: str,
        file: UploadFile,
        folder_id: Optional[str] = None,
        shared_with: Optional[List[str]] = None,
        encrypted: bool = False,
        offline_access: bool = False,
    ) -> Dict[str, Any]:
        """Upload a file to S3 and save its metadata in the database."""
        try:
            if not file.filename:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

            # Upload file to S3
            s3_key = f"files/{file.filename}"
            s3.upload_fileobj(
                file.file,
                S3_BUCKET_NAME,
                s3_key,
                Config=TransferConfig(multipart_threshold=1024 * 25, max_concurrency=10),
            )
            s3_location = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

            # Save file metadata in the database
            new_file = File(
                filename=file.filename,
                original_name=file.filename,
                path=s3_key,
                size=file.size,
                shared_with=shared_with or [],
                folder_id=folder_id,
                owner_id=user_id,
                encrypted=encrypted,
                offline_access=offline_access,
                location=s3_location,
            )
            await new_file.save()

            # Log the file upload
            audit_log = AuditLog(
                user_id=user_id,
                action="create",
                entity="file",
                entity_id=new_file.id,
                new_value=new_file.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "File uploaded successfully", "file": new_file.dict()}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def update_file(
        user_id: str,
        file_id: str,
        shared_with: Optional[List[str]] = None,
        permissions: Optional[Dict[str, Any]] = None,
        encrypted: Optional[bool] = None,
        offline_access: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """Update file metadata."""
        try:
            file = await File.find_one(File.id == file_id)
            if not file or file.is_deleted:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

            old_file = file.dict()
            if shared_with:
                file.shared_with = shared_with
            if permissions:
                file.permissions = permissions
            if encrypted is not None:
                file.encrypted = encrypted
            if offline_access is not None:
                file.offline_access = offline_access

            await file.save()

            # Log the file update
            audit_log = AuditLog(
                user_id=user_id,
                action="update",
                entity="file",
                entity_id=file.id,
                old_value=old_file,
                new_value=file.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "File updated successfully", "file": file.dict()}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def delete_file(user_id: str, file_id: str) -> Dict[str, Any]:
        """Delete a file from S3 and its metadata from the database."""
        try:
            file = await File.find_one(File.id == file_id)
            if not file or file.is_deleted:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

            # Delete file from S3
            s3.delete_object(Bucket=S3_BUCKET_NAME, Key=file.path)

            # Delete file metadata from the database
            await file.delete()

            # Log the file deletion
            audit_log = AuditLog(
                user_id=user_id,
                action="delete",
                entity="file",
                entity_id=file.id,
                old_value=file.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "File deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def restore_file(user_id: str, file_id: str) -> Dict[str, Any]:
        """Restore a deleted file."""
        try:
            file = await File.find_one(File.id == file_id)
            if not file or not file.is_deleted:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or not deleted")

            file.is_deleted = False
            await file.save()

            # Log the file restoration
            audit_log = AuditLog(
                user_id=user_id,
                action="restore",
                entity="file",
                entity_id=file.id,
                old_value={"is_deleted": True},
                new_value={"is_deleted": False},
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "File restored successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def get_all_files(user_id: str) -> List[Dict[str, Any]]:
        """Retrieve all files for a user."""
        try:
            files = await File.find(File.owner_id == user_id, File.is_deleted == False).to_list()

            # Log the file retrieval
            audit_log = AuditLog(
                user_id=user_id,
                action="view",
                entity="file",
                entity_id=None,
                new_value=[file.dict() for file in files],
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return files
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def get_file(user_id: str, file_id: str) -> Dict[str, Any]:
        """Retrieve a specific file."""
        try:
            file = await File.find_one(File.id == file_id, File.is_deleted == False)
            if not file:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

            # Log the file retrieval
            audit_log = AuditLog(
                user_id=user_id,
                action="view",
                entity="file",
                entity_id=file.id,
                new_value=file.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return file.dict()
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def download_file(user_id: str, file_id: str):
        """Download a file from S3."""
        try:
            file = await File.find_one(File.id == file_id, File.is_deleted == False)
            if not file:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

            # Generate a presigned URL for the file
            presigned_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": S3_BUCKET_NAME, "Key": file.path},
                ExpiresIn=3600,  # URL expires in 1 hour
            )

            # Log the file download
            audit_log = AuditLog(
                user_id=user_id,
                action="download",
                entity="file",
                entity_id=file.id,
                new_value={"filename": file.original_name, "location": file.location},
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"presigned_url": presigned_url}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def permanently_delete_file(user_id: str, file_id: str) -> Dict[str, Any]:
        """Permanently delete a file from S3 and the database."""
        try:
            file = await File.find_one(File.id == file_id)
            if not file:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

            # Delete file from S3
            s3.delete_object(Bucket=S3_BUCKET_NAME, Key=file.path)

            # Delete file metadata from the database
            await file.delete()

            # Log the permanent deletion
            audit_log = AuditLog(
                user_id=user_id,
                action="permanent_delete",
                entity="file",
                entity_id=file.id,
                old_value=file.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "File permanently deleted"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def create_folder(user_id: str, name: str, parent_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new folder."""
        try:
            if not name:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder name is required")

            existing_folder = await Folder.find_one(Folder.name == name, Folder.owner_id == user_id, Folder.parent_id == parent_id)
            if existing_folder:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Folder with this name already exists")

            new_folder = Folder(
                name=name,
                owner_id=user_id,
                parent_id=parent_id,
            )
            await new_folder.save()

            # Log the folder creation
            audit_log = AuditLog(
                user_id=user_id,
                action="create",
                entity="folder",
                entity_id=new_folder.id,
                new_value=new_folder.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return {"message": "Folder created successfully", "folder": new_folder.dict()}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def search_users(user_id: str, search_term: str) -> List[Dict[str, Any]]:
        """Search users by name or email."""
        try:
            if not search_term:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search term is required")

            invitations = await Invitation.aggregate([
                {"$match": {"sender": user_id}},
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "recipient",
                        "foreignField": "_id",
                        "as": "recipient_details",
                    }
                },
                {"$unwind": "$recipient_details"},
                {
                    "$match": {
                        "$or": [
                            {"recipient_details.name": {"$regex": search_term, "$options": "i"}},
                            {"recipient_details.email": {"$regex": search_term, "$options": "i"}},
                        ]
                    }
                },
            ]).to_list()

            # Log the search action
            audit_log = AuditLog(
                user_id=user_id,
                action="search",
                entity="user",
                entity_id=None,
                new_value=invitations,
                ip_address="0.0.0.0",  # Replace with actual IP from request
                user_agent="user-agent",  # Replace with actual user agent from request
            )
            await audit_log.save()

            return invitations
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))