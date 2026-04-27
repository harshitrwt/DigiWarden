from typing import Dict, Any, Optional
import numpy as np
import cv2


def compare_phash(hash1: str, hash2: str) -> float:
    if not hash1 or not hash2 or hash1 == "0"*16 or hash2 == "0"*16:
        return 0.0

    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        distance = bin(val1 ^ val2).count('1')
        return max(0.0, 1.0 - (distance / 64.0))
    except Exception as e:
        print(f"pHash Comparison Error: {e}")
        return 0.0


def compare_orb(desc1: Optional[np.ndarray], desc2: Optional[np.ndarray]) -> float:
    if desc1 is None or desc2 is None or len(desc1) == 0 or len(desc2) == 0:
        return 0.0

    try:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING)

        if len(desc1) < 2 or len(desc2) < 2:
            return 0.0

        matches = bf.knnMatch(desc1, desc2, k=2)

        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

        min_keypoints = min(len(desc1), len(desc2))
        if min_keypoints == 0:
            return 0.0

        score = len(good_matches) / min_keypoints
        return min(1.0, score * 1.5)
    except Exception as e:
        print(f"ORB Comparison Error: {e}")
        return 0.0


def compare_semantic(emb1: Optional[np.ndarray], emb2: Optional[np.ndarray]) -> float:
    if emb1 is None or emb2 is None or len(emb1) == 0 or len(emb2) == 0:
        return 0.0

    try:
        cos_sim = np.dot(emb1, emb2)
        return float(np.clip(cos_sim, 0.0, 1.0))
    except Exception as e:
        print(f"Semantic Comparison Error: {e}")
        return 0.0


def compute_similarity(fingerprint1: Dict[str, Any], fingerprint2: Dict[str, Any]) -> Dict[str, Any]:
    phash_score = compare_phash(fingerprint1.get('phash', ''), fingerprint2.get('phash', ''))
    orb_score = compare_orb(fingerprint1.get('orb'), fingerprint2.get('orb'))
    semantic_score = compare_semantic(fingerprint1.get('semantic'), fingerprint2.get('semantic'))

    w_phash = 0.25
    w_orb = 0.35
    w_semantic = 0.40

    has_semantic = (fingerprint1.get('semantic') is not None and fingerprint2.get('semantic') is not None)

    if not has_semantic:
        total = w_phash + w_orb
        w_phash = w_phash / total
        w_orb = w_orb / total
        w_semantic = 0.0
        semantic_score = 0.0

    combined_score = (phash_score * w_phash) + (orb_score * w_orb) + (semantic_score * w_semantic)
    combined_score_100 = round(combined_score * 100.0, 2)

    if combined_score_100 >= 85:
        label = "Likely Infringing"
    elif combined_score_100 >= 50:
        label = "Modified"
    else:
        label = "No Match"

    return {
        "combined_score": combined_score_100,
        "authenticity_label": label,
        "breakdown": {
            "phash_score": round(phash_score * 100.0, 2),
            "orb_score": round(orb_score * 100.0, 2),
            "semantic_score": round(semantic_score * 100.0, 2) if has_semantic else None
        }
    }
