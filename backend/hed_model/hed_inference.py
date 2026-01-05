import cv2
import numpy as np

_net = None  # will be initialized on startup

class CropLayer(object):
    def __init__(self, params, blobs):
        self.startX = self.startY = 0
        self.endX = self.endY = 0

    def getMemoryShapes(self, inputs):
        inputShape, targetShape = inputs
        batchSize, numChannels = inputShape[0], inputShape[1]
        H, W = targetShape[2], targetShape[3]

        self.startX = int((inputShape[3] - W) / 2)
        self.startY = int((inputShape[2] - H) / 2)
        self.endX = self.startX + W
        self.endY = self.startY + H

        return [[batchSize, numChannels, H, W]]

    def forward(self, inputs):
        return [inputs[0][:, :, self.startY:self.endY, self.startX:self.endX]]


# ---- Model loading (runs once) ----
def load_hed_model():
    """Load HED model into memory (called once on startup)."""
    global _net

    if _net is not None:
        return  # already loaded

    proto_path = "hed_model/deploy.prototxt"
    model_path = "hed_model/hed_pretrained_bsds.caffemodel"

    cv2.dnn_registerLayer("Crop", CropLayer)
    _net = cv2.dnn.readNetFromCaffe(proto_path, model_path)

    print("HED model loaded")

def generate_hed_image(img: np.ndarray) -> np.ndarray:
    """
    Runs HED edge detection on a BGR OpenCV image.

    Returns:
        uint8 numpy array (H, W) with values [0, 255]
    """
    if img is None:
        raise ValueError("Input image is None")

    H, W = img.shape[:2]

    blob = cv2.dnn.blobFromImage(
        img,
        scalefactor=0.7,
        size=(W, H),
        mean=(105, 117, 123),
        swapRB=False,
        crop=False,
    )

    _net.setInput(blob)
    hed = _net.forward()

    hed = hed[0, 0, :, :]
    hed = (255 * hed).astype("uint8")

    return hed
