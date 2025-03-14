from fastapi import HTTPException, status, Depends
from models import Password, User, SharedItem, Tag, Comment, AuditLog
from typing import List, Dict, Optional,Any
from datetime import datetime
import uuid
import bcrypt
import jwt
from configuration import send_email  # Replace with your email service
import os
import csv
import zipfile
import shutil
from pathlib import Path

# Ensure the directory exists
csv_directory = Path("temp-csv")
csv_directory.mkdir(exist_ok=True)

class PasswordController:
    @staticmethod
    async def share_password(user_id: str, password_id: str) -> Dict[str, Any]:
        """Share a password with a shareable link."""
        try:
            password = await Password.find_one(Password.id == password_id)
            if not password:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Password not found")

            # Generate a share token
            share_token = jwt.encode({"_id": password_id}, "2lZ2QpWg43", algorithm="HS256")
            expiration_date = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiration

            # Update the password with the share token
            password.share_token = share_token
            password.share_expiration = expiration_date
            await password.save()

            share_link = f"{os.getenv('FRONTEND_URL')}/api/passwords/share/{password_id}/{share_token}"

            # Log the share action
            audit_log = AuditLog(
                user_id=user_id,
                action="share",
                entity="passwords",
                entity_id=password_id,
                new_value={"share_link": share_link, "expiration_date": expiration_date},
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent
            )
            await audit_log.save()

            return {"share_link": share_link}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def get_shared_password(password_id: str, share_token: str) -> Dict[str, Any]:
        """Retrieve a shared password."""
        try:
            password = await Password.find_one(Password.id == password_id)
            if (
                not password
                or password.share_token != share_token
                or datetime.utcnow() > password.share_expiration
            ):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid share link or expired")

            # Decrypt the password (assuming CryptoJS-like functionality)
            decrypted_password = password.password  # Replace with actual decryption logic

            return {"password": decrypted_password}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def toggle_favorite(user_id: str, password_ids: List[str]) -> Dict[str, Any]:
        """Toggle favorite status for passwords."""
        try:
            user = await User.find_one(User.id == user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

            for password_id in password_ids:
                if password_id in user.favorites:
                    user.favorites.remove(password_id)
                else:
                    user.favorites.append(password_id)

            await user.save()

            # Log the action
            audit_log = AuditLog(
                user_id=user_id,
                action="toggle_favorite",
                entity="passwords",
                entity_id=password_ids,
                new_value={"favorites": user.favorites},
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent
            )
            await audit_log.save()

            return {"message": "Favorites updated successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def export_all_passwords(user_id: str, password_ids: List[str]) -> Dict[str, Any]:
        """Export passwords as a CSV file."""
        try:
            passwords = await Password.find({"_id": {"$in": password_ids}}).to_list()
            if not passwords:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No passwords found")

            # Convert passwords to CSV
            csv_data = []
            for password in passwords:
                csv_data.append({
                    "id": password.id,
                    "name": password.name,
                    "website": password.website,
                    "username": password.username,
                    "password": password.password,
                    "description": password.description,
                })

            # Save CSV file
            filename = f"{uuid.uuid4()}.csv"
            filepath = csv_directory / filename
            with open(filepath, "w") as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=csv_data[0].keys())
                writer.writeheader()
                writer.writerows(csv_data)

            # Log the export action
            audit_log = AuditLog(
                user_id=user_id,
                action="export",
                entity="passwords",
                entity_id=password_ids,
                new_value={"count": len(passwords)},
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent,
            )
            await audit_log.save()

            return {"filepath": str(filepath)}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def add_tag(user_id: str, password_id: str, tag_name: str) -> Dict[str, Any]:
        """Add a tag to a password."""
        try:
            password = await Password.find_one(Password.id == password_id)
            if not password:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Password not found")

            tag = await Tag.find_one(Tag.name == tag_name)
            if not tag:
                tag = Tag(name=tag_name)
                await tag.save()

            if tag.id not in password.tags:
                password.tags.append(tag.id)
                await password.save()

            # Log the action
            audit_log = AuditLog(
                user_id=user_id,
                action="add_tag",
                entity="passwords",
                entity_id=password_id,
                new_value={"tag": tag.dict()},
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent,
            )
            await audit_log.save()

            return {"message": "Tag added successfully", "tag": tag.dict()}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def post_comment(user_id: str, password_id: str, content: str) -> Dict[str, Any]:
        """Add a comment to a password."""
        try:
            password = await Password.find_one(Password.id == password_id)
            if not password:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Password not found")

            comment = Comment(content=content, created_by=user_id)
            await comment.save()

            password.comments.append(comment.id)
            await password.save()

            # Log the action
            audit_log = AuditLog(
                user_id=user_id,
                action="post_comment",
                entity="passwords",
                entity_id=password_id,
                new_value={"comment": comment.dict()},
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent,
            )
            await audit_log.save()

            return {"message": "Comment added successfully", "comment": comment.dict()}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))