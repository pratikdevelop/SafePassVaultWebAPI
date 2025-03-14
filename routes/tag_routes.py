from fastapi import APIRouter
from controllers.tag_controller import TagController

router = APIRouter(prefix="/tags", tags=["Tags"])

@router.post("/tag", response_model=dict)
async def create_tag(data: dict):
    return await TagController.create_tag(data)

@router.get("/{type}", response_model=list)
async def get_all_tags_by_type(type: str):
    return await TagController.get_all_tags_by_type(type)

@router.get("/{id}", response_model=dict)
async def get_tag_by_id(id: str):
    return await TagController.get_tag_by_id(id)

@router.put("/{id}", response_model=dict)
async def update_tag(id: str, data: dict):
    return await TagController.update_tag(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_tag(id: str):
    return await TagController.delete_tag(id)

@router.get("/search/{type}/{name}", response_model=list)
async def search_tags_by_name(type: str, name: str):
    return await TagController.search_tags_by_name(type, name)