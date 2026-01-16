import cv2
import numpy as np
import base64

_net = None  # will be initialized on startup


def base64_to_numpy(base64_string: str) -> np.ndarray:
    # Remove data URL prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    # Decode base64 to bytes
    image_bytes = base64.b64decode(base64_string)

    # Convert bytes to numpy buffer
    np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)

    # Decode image buffer into NumPy array
    image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)

    return image

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

async def generate_hed_image(img: str) -> str:
    
    img = base64_to_numpy(img)
    
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
    success, encoded_image = cv2.imencode('.png', hed)
    if not success:
        raise ValueError("Could not encode the image to PNG format.")
    
    encoded_png_bytes = encoded_image.tobytes()
    encoded_base64 = base64.b64encode(encoded_png_bytes).decode('utf-8')
    return encoded_base64

async def generate_threshold_image(img: str) -> str:
    
    img = base64_to_numpy(img)
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
    blur = cv2.GaussianBlur(hed, (3, 3), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    success, encoded_image = cv2.imencode('.png', thresh)
    if not success:
        raise ValueError("Could not encode the image to PNG format.")

    encoded_png_bytes = encoded_image.tobytes()
    encoded_base64 = base64.b64encode(encoded_png_bytes).decode('utf-8')
    return encoded_base64

async def generate_colored_object_image(img: str) -> str:

    img = base64_to_numpy(img)
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
    blur = cv2.GaussianBlur(hed, (3, 3), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    n_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh, connectivity=4)

    # Create false color image
    colors = np.random.randint(0, 255, size=(n_labels, 3), dtype=np.uint8)
    colors[0] = [0, 0, 0]
    false_colors = colors[labels]

    success, encoded_image = cv2.imencode('.png', false_colors)
    if not success:
        raise ValueError("Could not encode the image to PNG format.")

    encoded_png_bytes = encoded_image.tobytes()
    encoded_base64 = base64.b64encode(encoded_png_bytes).decode('utf-8')
    return encoded_base64

async def generate_colored_filtered_areas_image(img: str) -> str:

    img = base64_to_numpy(img)
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
    blur = cv2.GaussianBlur(hed, (3, 3), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    n_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh, connectivity=4)

    # Create false color image
    colors = np.random.randint(0, 255, size=(n_labels, 3), dtype=np.uint8)
    colors[0] = [0, 0, 0]
    false_colors_area_filtered = colors[labels]
    MIN_AREA = 50
    for i, centroid in enumerate(centroids[1:], start=1):
        area = stats[i, 4]
        if area > MIN_AREA:
            cv2.drawMarker(false_colors_area_filtered, (int(centroid[0]), int(centroid[1])),
                        color=(255, 255, 255), markerType=cv2.MARKER_CROSS)

    success, encoded_image = cv2.imencode('.png', false_colors_area_filtered)
    if not success:
        raise ValueError("Could not encode the image to PNG format.")
    encoded_png_bytes = encoded_image.tobytes()
    encoded_base64 = base64.b64encode(encoded_png_bytes).decode('utf-8')
    return encoded_base64