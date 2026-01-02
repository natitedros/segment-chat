from typing import Union
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

class CropLayer(object):
    def __init__(self, params, blobs):
        self.startX = 0
        self.startY = 0
        self.endX = 0
        self.endY = 0

    def getMemoryShapes(self, inputs):
        (inputShape, targetShape) = (inputs[0], inputs[1])
        (batchSize, numChannels) = (inputShape[0], inputShape[1])
        (H, W) = (targetShape[2], targetShape[3])

        self.startX = int((inputShape[3] - targetShape[3]) / 2)
        self.startY = int((inputShape[2] - targetShape[2]) / 2)
        self.endX = self.startX + W
        self.endY = self.startY + H

        return [[batchSize, numChannels, H, W]]

    def forward(self, inputs):
        return [inputs[0][:, :, self.startY:self.endY,
                self.startX:self.endX]]

# Load pre-trained model
protoPath = "hed_model/deploy.prototxt"
modelPath = "hed_model/hed_pretrained_bsds.caffemodel"
net = cv2.dnn.readNetFromCaffe(protoPath, modelPath)

# Register crop layer
cv2.dnn_registerLayer("Crop", CropLayer)

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

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.post("/chat")
async def segment_image(
    prompt: str = Form(...),
    image: UploadFile = File(...)
):
    image_bytes = await image.read()
    
    # bytes -> numpy buffer
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # decode numpy buffer to image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Could not decode the image. Please upload a valid image file.")
    
    (H, W) = img.shape[:2]
    blob = cv2.dnn.blobFromImage(img, scalefactor=0.7, size=(W, H),
                             mean=(105, 117, 123),
                             swapRB=False, crop=False)
    
    # Perform edge detection
    net.setInput(blob)
    hed = net.forward()
    hed = hed[0, 0, :, :]
    hed = (255 * hed).astype("uint8")
    
    success, encoded_image = cv2.imencode('.png', hed)
    if not success:
        raise ValueError("Could not encode the image to PNG format.")
    return Response(
        content=encoded_image.tobytes(),
        media_type="image/png"
    )