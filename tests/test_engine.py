import unittest
import os
import sys
import numpy as np

# Add the project root to sys.path to import engine
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from engine.fingerprint import generate_phash, generate_orb_descriptors, extract_all_fingerprints
from engine.similarity import compare_phash, compare_orb, compute_similarity

class TestFingerprintEngine(unittest.TestCase):
    def setUp(self):
        self.original_path = 'tests/fixtures/original.png'
        self.modified_path = 'tests/fixtures/modified.png'
        
        if not os.path.exists(self.original_path) or not os.path.exists(self.modified_path):
            self.skipTest("Test fixtures not found. Run scratch/generate_test_data.py first.")

    def test_phash_extraction(self):
        hash_orig = generate_phash(self.original_path)
        hash_mod = generate_phash(self.modified_path)
        
        self.assertIsInstance(hash_orig, str)
        self.assertNotEqual(hash_orig, "0" * 16)
        print(f"Original pHash: {hash_orig}")
        print(f"Modified pHash: {hash_mod}")

    def test_orb_extraction(self):
        desc_orig = generate_orb_descriptors(self.original_path)
        desc_mod = generate_orb_descriptors(self.modified_path)
        
        self.assertIsNotNone(desc_orig)
        self.assertIsInstance(desc_orig, np.ndarray)
        self.assertGreater(len(desc_orig), 0)
        print(f"Original ORB descriptors: {len(desc_orig)}")
        print(f"Modified ORB descriptors: {len(desc_mod) if desc_mod is not None else 0}")

    def test_similarity_engine(self):
        # 1. Extract all fingerprints
        fp_orig = extract_all_fingerprints(self.original_path)
        fp_mod = extract_all_fingerprints(self.modified_path)
        
        # 2. Compute similarity
        result = compute_similarity(fp_orig, fp_mod)
        
        self.assertIn('combined_score', result)
        self.assertIn('authenticity_label', result)
        self.assertIn('breakdown', result)
        
        score = result['combined_score']
        label = result['authenticity_label']
        
        print("\n--- Similarity Engine Result ---")
        print(f"Combined Score: {score}")
        print(f"Label: {label}")
        print(f"Breakdown: {result['breakdown']}")
        
        # We expect a score > 40 because it's a direct crop of the original
        self.assertGreater(score, 40.0)

if __name__ == '__main__':
    unittest.main()
