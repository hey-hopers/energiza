from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.leitor_pdf_service import extract_invoice_data
import os

router = APIRouter(prefix="/api-python")

class ProcessPDFRequest(BaseModel):
    file_path: str

@router.post("/upload-pdf")
async def upload_pdf(pdf: UploadFile = File(...)):
    UPLOAD_FOLDER = '/tmp/uploads'
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    if pdf.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Arquivo não é PDF")   

    filename = pdf.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(await pdf.read())

    return {"filePath": filepath}

@router.post("/process-pdf")
def process_pdf(payload: ProcessPDFRequest):
    try:
        result = extract_invoice_data(payload.file_path)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))