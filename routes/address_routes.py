from fastapi import APIRouter
from controllers.address_controller import AddressController  # Placeholder for your controller

router = APIRouter(prefix="/address", tags=["Address"])

@router.post("/", response_model=dict)
async def create_address(data: dict):
    return await AddressController.create_address(data)

@router.get("/", response_model=list)
async def get_all_addresses():
    return await AddressController.get_all_addresses()

@router.get("/{id}", response_model=dict)
async def get_address_by_id(id: str):
    return await AddressController.get_address_by_id(id)

@router.put("/{id}", response_model=dict)
async def update_address(id: str, data: dict):
    return await AddressController.update_address(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_address(id: str):
    return await AddressController.delete_address(id)