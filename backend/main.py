from typing import Optional, Union
import base64
from fastapi.responses import JSONResponse
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from hed_model.hed_inference import load_hed_model, generate_hed_image, generate_threshold_image, generate_colored_object_image, generate_colored_filtered_areas_image

load_dotenv()

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
    if not image_bytes:
        raise ValueError("Uploaded file is empty")

    # encode uploaded bytes as base64 string for the async HED functions
    encoded_input_image = base64.b64encode(image_bytes).decode('utf-8')
    if encoded_input_image is None:
        raise ValueError("Could not decode the image. Please upload a valid image file.")
    # client = AsyncDedalus(api_key=os.getenv("DEDALUS_API_KEY"))
    # runner = DedalusRunner(client)
    # response = await runner.run(
    #     input=prompt + f" Here's the encode image as base64 to use when to call the tools. Do not process it! Just use it as an argument to call the tools: {encoded_input_image}",
    #     model="openai/gpt-4o-mini",
    #     tools=[generate_hed_image, generate_threshold_image, generate_colored_object_image, generate_colored_filtered_areas_image]
    # )
    # print(response)
    encoded_base64 = await generate_hed_image(encoded_input_image)
    
    return JSONResponse(
        content={
            "text": "HED edge detection completed.",
            "imageAttachment": encoded_base64,
            "mime_type": "image/png"
        }
    )