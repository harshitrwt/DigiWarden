from typing import Dict, Any, Optional
import numpy as np
import cv2

def compare_phash(hash1: str, hash2: str) -> float:
    """
    Compares two pHashes and returns a normalized similarity score between 0.0 and 1.0.
    """
    if not hash1 or not hash2 or hash1 == "0"*16 or hash2 == "0"*16:
        return 0.0
    
    # Calculate Hamming distance by converting hex strings to integers and counting bit differences
    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        # XOR to find differing bits, then count set bits (Hamming distance)
        distance = bin(val1 ^ val2).count('1')
        
        # Max distance for a 64-bit hash is 64
        max_distance = 64.0
        score = max(0.0, 1.0 - (distance / max_distance))
        return score
    except Exception as e:
        print(f"pHash Comparison Error: {e}")
        return 0.0

def compare_orb(desc1: Optional[np.ndarray], desc2: Optional[np.ndarray]) -> float:
    """
    Compares two sets of ORB descriptors and returns a ratio of good matches.
    """
    if desc1 is None or desc2 is None or len(desc1) == 0 or len(desc2) == 0:
        return 0.0
        
    try:
        # Use BFMatcher with default params (NORM_HAMMING for ORB)
        bf = cv2.BFMatcher(cv2.NORM_HAMMING)
        
        # We need at least 2 keypoints to perform knnMatch (k=2)
        if len(desc1) < 2 or len(desc2) < 2:
            return 0.0
            
        matches = bf.knnMatch(desc1, desc2, k=2)
        
        # Apply Lowe's ratio test
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)
                
        # Calculate score as the ratio of good matches against the minimum possible matches
        # Capped to 1.0
        min_keypoints = min(len(desc1), len(desc2))
        if min_keypoints == 0:
            return 0.0
            
        score = len(good_matches) / min_keypoints
        return min(1.0, score * 1.5) # Slight boost multiplier since ORB ratio test is strict
    except Exception as e:
        print(f"ORB Comparison Error: {e}")
        return 0.0

def compare_semantic(emb1: Optional[np.ndarray], emb2: Optional[np.ndarray]) -> float:
    """
    Compares two semantic embeddings using Cosine Similarity.
    """
    if emb1 is None or emb2 is None or len(emb1) == 0 or len(emb2) == 0:
        return 0.0
        
    try:
        # Cosine similarity: dot product of normalized vectors
        cos_sim = np.dot(emb1, emb2)
        
        # Normalize to 0.0 - 1.0 (from -1.0 - 1.0)
        # Assuming embeddings are already normalized (from our fingerprint.py)
        # So cos_sim is roughly between 0.0 and 1.0 for image features anyway, but safe clamp:
        return float(np.clip(cos_sim, 0.0, 1.0))
    except Exception as e:
        print(f"Semantic Comparison Error: {e}")
        return 0.0

def compute_similarity(fingerprint1: Dict[str, Any], fingerprint2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes the fused similarity score given two fingerprint dictionaries.
    """
    # 1. Compute individual scores (0.0 to 1.0)
    phash_score = compare_phash(fingerprint1.get('phash', ''), fingerprint2.get('phash', ''))
    orb_score = compare_orb(fingerprint1.get('orb'), fingerprint2.get('orb'))
    semantic_score = compare_semantic(fingerprint1.get('semantic'), fingerprint2.get('semantic'))
    
    # 2. Base weights
    w_phash = 0.25
    w_orb = 0.35
    w_semantic = 0.40
    
    # 3. Dynamic Re-weighting (Fallback if Semantic embedding is missing)
    has_semantic = (fingerprint1.get('semantic') is not None and fingerprint2.get('semantic') is not None)
    
    if not has_semantic:
        # Re-weight to distribute the 40% across pHash and ORB proportionally
        total_remaining_weight = w_phash + w_orb # 0.60
        w_phash = w_phash / total_remaining_weight # ~41.6%
        w_orb = w_orb / total_remaining_weight # ~58.4%
        w_semantic = 0.0
        semantic_score = 0.0
        
    # 4. Compute Fusion Score (0 - 100 scale)
    combined_score = (phash_score * w_phash) + (orb_score * w_orb) + (semantic_score * w_semantic)
    combined_score_100 = round(combined_score * 100.0, 2)
    
    # 5. Apply Classification Thresholds
    if combined_score_100 >= 90:
        label = "Original"
    elif combined_score_100 >= 65:
        label = "Modified"
    elif combined_score_100 >= 40:
        label = "Likely Infringing"
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
