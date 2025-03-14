from fastapi import APIRouter
from controllers.password_controller import PasswordController

router = APIRouter(prefix="/passwords", tags=["Passwords"])

@router.get("/", response_model=list)
async def get_all_passwords():
    return await PasswordController.get_all_passwords()

@router.post("/password", response_model=dict)
async def create_password(data: dict):
    return await PasswordController.create_password(data)

@router.delete("/password/{ids}", response_model=dict)
async def delete_passwords(ids: str):
    return await PasswordController.delete_passwords(ids)

@router.put("/password/{id}", response_model=dict)
async def update_password(id: str, data: dict):
    return await PasswordController.update_password(id, data)

@router.post("/share", response_model=dict)
async def handle_share_request(data: dict):
    return await PasswordController.handle_share_request(data)

@router.get("/share/{password_id}/{share_token}", response_model=dict)
async def get_shared_password(password_id: str, share_token: str):
    return await PasswordController.get_shared_password(password_id, share_token)

@router.post("/password/{password_id}/favorite", response_model=dict)
async def toggle_favorite(password_id: str):
    return await PasswordController.toggle_favorite(password_id)

@router.get("/export", response_model=dict)
async def export_all_passwords():
    return await PasswordController.export_all_passwords()

@router.post("/add-tag", response_model=dict)
async def add_tag(data: dict):
    return await PasswordController.add_tag(data)

@router.post("/{password_id}/comments", response_model=dict)
async def post_comment(password_id: str, data: dict):
    return await PasswordController.post_comment(password_id, data)

@router.get("/download/{filename}", response_model=dict)
async def download_as_csv(filename: str):
    return await PasswordController.download_as_csv(filename)