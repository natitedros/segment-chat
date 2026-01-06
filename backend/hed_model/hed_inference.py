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

def generate_threshold_image(img: np.ndarray) -> np.ndarray:
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
    blur = cv2.GaussianBlur(hed, (3, 3), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    return thresh

def generate_colored_object_image(img: np.ndarray) -> np.ndarray:
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
    blur = cv2.GaussianBlur(hed, (3, 3), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    n_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh, connectivity=4)

    # Create false color image
    colors = np.random.randint(0, 255, size=(n_labels, 3), dtype=np.uint8)
    colors[0] = [0, 0, 0]
    false_colors = colors[labels]

    return false_colors

def generate_colored_filtered_areas_image(img: np.ndarray) -> np.ndarray:
    
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

    return false_colors_area_filtered