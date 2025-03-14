from fastapi import APIRouter
from controllers.proof_id_controller import ProofIdController

router = APIRouter(prefix="/proof-ids", tags=["Proof IDs"])

@router.post("/", response_model=dict)
async def create_proof_id(data: dict):
    return await ProofIdController.create_proof_id(data)

@router.get("/", response_model=list)
async def get_all_proof_ids():
    return await ProofIdController.get_all_proof_ids()

@router.get("/{id}", response_model=dict)
async def get_proof_id_by_id(id: str):
    return await ProofIdController.get_proof_id_by_id(id)

@router.patch("/{id}", response_model=dict)
async def update_proof_id(id: str, data: dict):
    return await ProofIdController.update_proof_id(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_proof_id(id: str):
    return await ProofIdController.delete_proof_id(id)