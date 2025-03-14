from fastapi import APIRouter
from controllers.folder_controller import FolderController

router = APIRouter(prefix="/folders", tags=["Folders"])

@router.post("/", response_model=dict)
async def create_folder(data: dict):
    return await FolderController.create_folder(data)

@router.get("/", response_model=list)
async def get_user_folders():
    return await FolderController.get_user_folders()

@router.get("/type/{type}", response_model=list)
async def get_folders_by_type(type: str):
    return await FolderController.get_folders_by_type(type)

@router.put("/{id}", response_model=dict)
async def update_folder(id: str, data: dict):
    return await FolderController.update_folder(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_folder(id: str):
    return await FolderController.delete_folder(id)

@router.get("/search", response_model=list)
async def search_folders(query: str):
    return await FolderController.search_folders(query)