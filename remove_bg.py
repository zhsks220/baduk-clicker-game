from PIL import Image
import sys

def remove_background(input_path, output_path):
    print(f"Opening {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    datas = img.getdata()
    newData = []
    
    # Heuristic:
    # 1. White background usually (255, 255, 255)
    # 2. Fake transparent checkerboard often (255,255,255) and light gray (around 204, 204, 204 or 238, 238, 238)
    
    # We will pick a tolerance.
    # Let's check the corners to guess background.
    width, height = img.size
    
    # Sample corners
    corners = [
        img.getpixel((0,0)),
        img.getpixel((width-1, 0)),
        img.getpixel((0, height-1)),
        img.getpixel((width-1, height-1))
    ]
    
    print(f"Sampled corners: {corners}")
    
    for item in datas:
        r, g, b, a = item
        
        # Check for White-ish
        is_white = r > 240 and g > 240 and b > 240
        
        # Check for Gray-ish (Checkerboard dark squares)
        # Usually they are neutral gray r~=g~=b
        # and in range 150-230
        is_gray = (abs(r-g) < 10 and abs(g-b) < 10 and abs(r-b) < 10) and (150 < r < 235)

        # Basic removal: If white or gray, make transparent
        # Note: This might remove white parts of the character (eyes, etc).
        # To be safer, we should simple flood fill from corners, but start with color keying for simplicity in this restricted env.
        # Chess pieces: White/Black/Pink/Blue/Yellow/Purple
        # Characters have WHITE eyes/shine. This is risky.
        
        # REVISED STRATEGY: 
        # The user image is likely a sticker style with outlines.
        # The background is likely distinct from the character interior.
        # If we use floodfill from (0,0), we avoid deleting internal white pixels.
        
        pixel = (r, g, b, 255) # keep opaque for now
        newData.append(pixel)

    img.putdata(newData)
    
    # Flood fill transparent from (0,0) with a tolerance
    # Since Image.floodfill isn't standard in old PIL, we use a library trick or custom BFS.
    # Let's try ImageDraw.floodfill if available (PIL > 8.x), otherwise custom.
    
    try:
        from PIL import ImageDraw
        # Create a mask image
        # We fill background with (0,0,0,0) starting from corners
        # But wait, floodfill changes color.
        
        # Let's proceed with a simpler approach for this task:
        # We assume the background is white/checkerboard and the outline is BLACK.
        # Anything outside the black outline should be removed.
        # But the characters are close together in a sprite sheet. Flood fill on whole image might invade if gaps are large?
        # Actually, sprite sheet usually has gaps.
        
        print("Attempting flood fill transparency...")
        # Add a 1px border to ensure connectivity
        
        # BFS separate implementation to be safe
        # (Too slow in pure python for large images? Image is likely small ~1000px)
        
        # Use simpler approach: Turn matching background pixels transparent.
        # RISK: Eye whites.
        # Characters usually have black outlines.
        # Unless the background color is EXACTLY white, and eye white is EXACTLY white.
        # Often BG is slightly different or eye is slightly off-white.
        
        # Check for White-ish
        is_white = r > 230 and g > 230 and b > 230

        # Check for Gray-ish (Checkerboard light)
        is_light_gray = (abs(r-g) < 15 and abs(g-b) < 15) and (180 < r < 225)

        # Check for Dark Background (based on corner samples ~30)
        is_dark_bg = r < 60 and g < 60 and b < 60

        if is_white or is_light_gray or is_dark_bg:
             finalData.append((r, g, b, 0)) # Transparent
        
        img.putdata(finalData)
        
    except Exception as e:
        print(f"Error during processing: {e}")

    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    remove_background("c:/Users/zhsks/Desktop/앱인 토스/pony-game/public/chess_sprites.jpg", "c:/Users/zhsks/Desktop/앱인 토스/pony-game/public/chess_sprites_transparent.png")
