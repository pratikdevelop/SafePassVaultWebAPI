from fastapi import HTTPException, Request
from models import Tag, AuditLog  # Assuming Beanie models
from typing import Dict, Any, List

class TagController:
    @staticmethod
    async def create_tag(data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Create a new tag and log the action."""
        try:
            tag = Tag(**data)
            await tag.insert()

            await AuditLog(
                user_id=user_id,
                action="create",
                entity="tag",
                entity_id=str(tag.id),
                new_value=tag.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return tag.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def get_all_tags_by_type(tag_type: str, request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve all tags by type and log the action."""
        try:
            tags = await Tag.find(Tag.tag_type == tag_type).to_list()
            formatted_tags = [{"_id": str(tag.id), "label": tag.name, "type": tag.tag_type} for tag in tags]

            await AuditLog(
                user_id=user_id,
                action="view",
                entity="tag",
                entity_id=None,
                new_value=formatted_tags,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return {"tags": formatted_tags}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_tag_by_id(tag_id: str, request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve a specific tag and log the action."""
        try:
            tag = await Tag.get(tag_id)
            if not tag:
                raise HTTPException(status_code=404, detail="Tag not found")

            await AuditLog(
                user_id=user_id,
                action="view",
                entity="tag",
                entity_id=str(tag.id),
                new_value=tag.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return tag.dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def update_tag(tag_id: str, data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Update a tag and log the action."""
        try:
            tag = await Tag.get(tag_id)
            if not tag:
                raise HTTPException(status_code=404, detail="Tag not found")

            old_value = tag.dict()
            for key, value in data.items():
                setattr(tag, key, value)
            await tag.save()

            await AuditLog(
                user_id=user_id,
                action="update",
                entity="tag",
                entity_id=str(tag.id),
                old_value=old_value,
                new_value=tag.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return tag.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def delete_tag(tag_id: str, request: Request, user_id: str) -> Dict[str, str]:
        """Delete a tag and log the action."""
        try:
            tag = await Tag.get(tag_id)
            if not tag:
                raise HTTPException(status_code=404, detail="Tag not found")

            old_value = tag.dict()
            await tag.delete()

            await AuditLog(
                user_id=user_id,
                action="delete",
                entity="tag",
                entity_id=tag_id,
                old_value=old_value,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return {"message": "Tag deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def search_tags_by_name(tag_type: str, name: str) -> List[Dict[str, Any]]:
        """Search tags by name."""
        try:
            tags = await Tag.find(
                Tag.name.regex(f"(?i){name}"),
                Tag.tag_type == tag_type
            ).to_list()
            return [tag.dict() for tag in tags]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))