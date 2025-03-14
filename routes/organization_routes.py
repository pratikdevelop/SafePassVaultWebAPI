from fastapi import APIRouter
from controllers.organization_controller import OrganizationController

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("/organization", response_model=dict, status_code=201)
async def create_organization(data: dict):
    """Create a new organization."""
    return await OrganizationController.create_organization(data)

@router.delete("/organization/{id}", response_model=dict)
async def delete_organization(id: str):
    return await OrganizationController.delete_organization(id)

@router.get("/organizations", response_model=list)
async def get_organizations():
    """Retrieve a list of organizations."""
    return await OrganizationController.get_organizations()

@router.get("/organization/{id}", response_model=dict)
async def get_organization_by_id(id: str):
    return await OrganizationController.get_organization_by_id(id)

@router.put("/organization/{id}", response_model=dict)
async def update_organization(id: str, data: dict):
    return await OrganizationController.update_organization(id, data)