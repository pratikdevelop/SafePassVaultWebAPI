from fastapi import APIRouter
from controllers.note_controller import NoteController

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.post("/note", response_model=dict)
async def create_note(data: dict):
    return await NoteController.create_note(data)

@router.get("/", response_model=list)
async def get_all_notes():
    return await NoteController.get_all_notes()

@router.get("/export", response_model=dict)
async def export_all_notes_as_csv():
    return await NoteController.export_all_notes_as_csv()

@router.get("/{id}", response_model=dict)
async def get_note_by_id(id: str):
    return await NoteController.get_note_by_id(id)

@router.patch("/{id}", response_model=dict)
async def update_note(id: str, data: dict):
    return await NoteController.update_note(id, data)

@router.delete("/{id}", response_model=dict)
async def delete_note(id: str):
    return await NoteController.delete_note(id)

@router.post("/note/{note_id}/favorite", response_model=dict)
async def toggle_favorite(note_id: str):
    return await NoteController.toggle_favorite(note_id)

@router.post("/add-tag", response_model=dict)
async def add_tag(data: dict):
    return await NoteController.add_tag(data)

@router.post("/{note_id}/comments", response_model=dict)
async def post_comment(note_id: str, data: dict):
    return await NoteController.post_comment(note_id, data)