from fastapi import APIRouter
from controllers.secret_controller import SecretController

router = APIRouter(prefix="/secrets", tags=["Secrets"])

@router.post("/create", response_model=dict)
async def create_secret(data: dict):
    return await SecretController.create_secret(data)

@router.get("/all", response_model=list)
async def get_all_secrets():
    return await SecretController.get_all_secrets()

@router.get("/{id}", response_model=dict)
async def get_secret_by_id(id: str):
    return await SecretController.get_secret_by_id(id)

@router.put("/{id}", response_model=dict)
async def update_secret(id: str, data: dict):
    return await SecretController.update_secret(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_secret(id: str):
    return await SecretController.delete_secret(id)

@router.get("/search/{name}", response_model=list)
async def search_secrets_by_name(name: str):
    return await SecretController.search_secrets_by_name(name)