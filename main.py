from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from io import BytesIO

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/powerpoint")
async def convert_excel_to_pptx(
    file: UploadFile,
    chart_core_message: str = Form(...)  # Use Form to receive form data
):
    # Your existing endpoint code...
    print(f"Received message: {chart_core_message}")
    print(f"Received file: {file.filename}")
    
    # For testing, just return a simple response
    return {"message": "File received successfully"}