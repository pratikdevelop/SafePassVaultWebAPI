from fastapi import APIRouter, UploadFile, File
from controllers.file_controller import FileController

router = APIRouter(prefix="/files", tags=["Files"])

@router.post("/upload", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    return await FileController.upload_file(file)

@router.get("/preview/{id}", response_model=dict)
async def download_file(id: str):
    return await FileController.download_file(id)

@router.get("/", response_model=list)
async def get_all_files():
    return await FileController.get_all_files()

@router.put("/{id}", response_model=dict)
async def update_file(id: str, data: dict):
    return await FileController.update_file(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_file(id: str):
    return await FileController.delete_file(id)

@router.patch("/{id}/restore", response_model=dict)
async def restore_file(id: str):
    return await FileController.restore_file(id)

@router.delete("/file/{id}", response_model=dict)
async def permanently_delete_file(id: str):
    return await FileController.permanently_delete_file(id)

@router.post("/folder", response_model=dict)
async def create_folder(data: dict):
    return await FileController.create_folder(data)

@router.get("/searchUsers/{search_term}", response_model=list)
async def search_users(search_term: str):
    return await FileController.search_users(search_term)