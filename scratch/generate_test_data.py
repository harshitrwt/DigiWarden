from PIL import Image, ImageDraw

def generate_test_images():
    # 1. Create original image with more features
    original = Image.new('RGB', (500, 500), color=(73, 109, 137))
    d = ImageDraw.Draw(original)
    
    # Add some shapes and patterns
    for i in range(0, 500, 50):
        d.line([(i, 0), (500-i, 500)], fill=(200, 200, 200), width=2)
        d.rectangle([i, i, i+30, i+30], fill=(255, 0, 0))
        d.ellipse([500-i, i, 530-i, i+30], fill=(0, 255, 0))
        
    d.text((10,10), "ContentGenome Original Provenance Tracking", fill=(255,255,0))
    original.save('tests/fixtures/original.png')
    
    # 2. Create modified version (crop and compression)
    modified = original.crop((100, 100, 400, 400))
    modified.save('tests/fixtures/modified.png', "JPEG", quality=40)
    
    print("Test images generated in tests/fixtures/")

if __name__ == "__main__":
    generate_test_images()
