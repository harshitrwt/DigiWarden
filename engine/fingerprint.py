import cv2
import imagehash
from PIL import Image
import numpy as np
import os
from typing import Dict, Any, Optional

try:
    import onnxruntime as ort
    HAS_ORT = True
except ImportError:
    HAS_ORT = False

MODEL_PATH = os.path.join(os.path.dirname(__file__), "mobilenet_v2.onnx")


def generate_phash(image_path: str) -> str:
    try:
        with Image.open(image_path) as img:
            hash_val = imagehash.phash(img)
            return str(hash_val)
    except Exception as e:
        print(f"pHash Error: {e}")
        return "0" * 16


def generate_orb_descriptors(image_path: str) -> Optional[np.ndarray]:
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            print(f"ORB Error: Could not read image at {image_path}")
            return None

        orb = cv2.ORB_create(nfeatures=500)
        kp, des = orb.detectAndCompute(img, None)
        if des is None:
            print(f"ORB Warning: No keypoints found in {image_path}")
        return des
    except Exception as e:
        print(f"ORB Error: {e}")
        return None


def generate_semantic_embedding(image_path: str) -> Optional[np.ndarray]:
    if not HAS_ORT or not os.path.exists(MODEL_PATH):
        return None

    try:
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))

        img = img.astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img = (img - mean) / std

        img = np.transpose(img, (2, 0, 1))
        img = np.expand_dims(img, axis=0)

        session = ort.InferenceSession(MODEL_PATH)
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        embedding = session.run([output_name], {input_name: img})[0]

        embedding = embedding.flatten()
        norm = np.linalg.norm(embedding)
        return embedding / norm if norm > 0 else embedding

    except Exception as e:
        print(f"Semantic Error: {e}")
        return None


def extract_all_fingerprints(image_path: str) -> Dict[str, Any]:
    return {
        "phash": generate_phash(image_path),
        "orb": generate_orb_descriptors(image_path),
        "semantic": generate_semantic_embedding(image_path)
    }
