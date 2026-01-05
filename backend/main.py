from typing import Optional, Union
import cv2
import numpy as np
import base64
from fastapi.responses import JSONResponse
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from hed_model.hed_inference import load_hed_model,generate_hed_image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    load_hed_model()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.post("/chat")
async def segment_image(
    prompt: str = Form(""),
    image: Optional[UploadFile] = File(None)
):
    if image is None and prompt.strip() == "":
        return {"text": "Please provide an image or a prompt."}
    
    elif image is None:
        return {"text": "Prompt received, but no image provided. Please upload an image for segmentation."}
    
    image_bytes = await image.read()
    # bytes -> numpy buffer
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # decode numpy buffer to image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Could not decode the image. Please upload a valid image file.")
    
    hed = generate_hed_image(img)
    
    success, encoded_image = cv2.imencode('.png', hed)
    if not success:
        raise ValueError("Could not encode the image to PNG format.")
    
    encoded_png_bytes = encoded_image.tobytes()
    encoded_base64 = base64.b64encode(encoded_png_bytes).decode('utf-8')
    
    return JSONResponse(
        content={
            "text": "HED edge detection completed.",
            "imageAttachment": encoded_base64,
            "mime_type": "image/png"
        }
    )