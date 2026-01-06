import numpy as np
from PIL import Image, ImageChops

def trim(im):
    bg = Image.new(im.mode, im.size, (255, 255, 255, 0))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def remove_white(image, tolerance=30):
    img = image.convert("RGBA")
    data = np.array(img)
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    mask = (r > (255-tolerance)) & (g > (255-tolerance)) & (b > (255-tolerance))
    data[mask] = [0, 0, 0, 0]
    return Image.fromarray(data)

def get_large_blobs(image_path, min_area=2000):
    # Load
    print(f"Processing {image_path}...")
    try:
        pil_img = Image.open(image_path).convert("RGBA")
    except:
        return []

    # Remove BG
    transparent = remove_white(pil_img, tolerance=30)
    
    # Simple projection segmentation
    # 1. Project to X
    alpha = np.array(transparent)[:, :, 3]
    binary = alpha > 0
    x_proj = np.any(binary, axis=0)
    
    starts, ends = [], []
    in_blob = False
    for i, val in enumerate(x_proj):
        if val and not in_blob:
            in_blob = True
            starts.append(i)
        elif not val and in_blob:
            in_blob = False
            ends.append(i)
    if in_blob: ends.append(len(x_proj))
    
    blobs = []
    
    for s, e in zip(starts, ends):
        if (e - s) < 10: continue
        
        # Determine Y bounds for this strip
        strip = binary[:, s:e]
        y_proj = np.any(strip, axis=1)
        ys, ye = 0, len(y_proj)
        
        # Find top/bottom
        y_indices = np.where(y_proj)[0]
        if len(y_indices) > 0:
            ys, ye = y_indices[0], y_indices[-1] + 1
            
        width = e - s
        height = ye - ys
        area = width * height
        
        # FILTER SMALL BLOBS (TEXT LABELS)
        # Characters are usually > 50x50 = 2500 px area
        if area > min_area and height > 50:
            blob = transparent.crop((s, ys, e, ye))
            blobs.append((s, blob)) # Store X for sorting
            
    # Sort by X
    blobs.sort(key=lambda x: x[0])
    return [b[1] for b in blobs]

def main():
    root = "c:/Users/zhsks/Desktop/앱인 토스/pony-game/public/"
    
    # 1. GET BLOBS
    # concept_preview.png -> Pawn, Knight, Rook, King (4)
    # The image usually has text labels below. Are they separate blobs?
    # If they touch the character, they merge. If separate, filtering removes them.
    # Assuming text is small.
    
    blobs1 = get_large_blobs(root + "concept_preview.png", min_area=5000) 
    # Try higher threshold? Characters are big. Labels are small.
    # concept_preview.png found 11 blobs last time. 4 chars + 4 labels + noise?
    
    blobs2 = get_large_blobs(root + "full_concept_preview.png", min_area=5000)
    blobs3 = get_large_blobs(root + "imperial_fusion_preview.png", min_area=5000)
    
    print(f"Blobs Found: B1={len(blobs1)}, B2={len(blobs2)}, B3={len(blobs3)}")
    
    # 2. MAPPING (Manual Safeguard)
    # Blobs1: [Pawn, Knight, Rook, King]
    # If we find > 4, maybe prompt added extra? Just take first 4 distinct large ones.
    
    pawn = blobs1[0] if len(blobs1) > 0 else Image.new("RGBA", (1,1))
    knight = blobs1[1] if len(blobs1) > 1 else Image.new("RGBA", (1,1))
    rook = blobs1[2] if len(blobs1) > 2 else Image.new("RGBA", (1,1))
    king = blobs1[3] if len(blobs1) > 3 else Image.new("RGBA", (1,1))
    
    # Blobs2: [Bishop, Queen, (RobotKing)]
    # Bishop (Left), Queen (Right). Robot is usually bottom or last.
    # Sort order is X. So Bishop, Queen.
    bishop = blobs2[0] if len(blobs2) > 0 else Image.new("RGBA", (1,1))
    queen = blobs2[1] if len(blobs2) > 1 else Image.new("RGBA", (1,1))
    
    # Blobs3: [Imperial King]
    imperial = blobs3[0] if len(blobs3) > 0 else Image.new("RGBA", (1,1))
    
    # 3. USER ORDER: Pawn -> Knight -> Bishop -> Rook -> Queen -> King -> Imperial King
    final_lineup = [pawn, knight, bishop, rook, queen, king, imperial]
    
    # 4. Filter duds
    final_lineup = [img for img in final_lineup if img.width > 10]
    
    # 5. Stitch
    target_h = 250
    resized = []
    
    for img in final_lineup:
        r = target_h / img.height
        new_w = int(img.width * r)
        resized.append(img.resize((new_w, target_h), Image.Resampling.LANCZOS))
        
    w_total = sum(i.width for i in resized) + (len(resized)-1)*30
    out = Image.new("RGBA", (w_total + 60, target_h + 60), (0,0,0,0))
    
    x = 30
    for img in resized:
        y_off = (target_h - img.height) // 2
        # Align bottom?
        # Let's align center-bottom.
        # But images include whitespace.
        out.paste(img, (x, 30), img)
        x += img.width + 30
        
    out.save(root + "final_lineup_no_bg.png")
    print("Saved final_lineup_no_bg.png")

if __name__ == "__main__":
    main()
