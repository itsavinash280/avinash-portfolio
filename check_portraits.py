import re
import os
import hashlib
from PIL import Image
import numpy as np

with open('portraits.html', 'r', encoding='utf-8') as f:
    html = f.read()

imgs = re.findall(r'<img\s+[^>]*src=["\']([^"\']+)["\']', html)
print(f'Total images in portraits.html: {len(imgs)}')

seen = {}
duplicates = []
blacks = []

for idx, src in enumerate(imgs):
    clean_src = src.replace('/', os.sep)
    if os.path.exists(clean_src):
        with open(clean_src, 'rb') as fp:
            file_bytes = fp.read()
            h = hashlib.md5(file_bytes).hexdigest()
        
        with Image.open(clean_src) as im:
            arr = np.array(im.convert('RGB'))
            mean_b = arr.mean()
            thumb = im.convert('RGB').resize((16, 16), Image.Resampling.LANCZOS)
            thumb_h = hashlib.md5(np.array(thumb).tobytes()).hexdigest()
        
        print(f'{idx+1}. {src}: size={len(file_bytes)}B, dim={im.size}, mean_bright={mean_b:.2f}, hash={h[:8]}, thumb_hash={thumb_h[:8]}')
        
        if h in seen:
            duplicates.append((idx+1, src, seen[h]))
        else:
            seen[h] = (idx+1, src)
            
        if mean_b < 5.0:
            blacks.append((idx+1, src, mean_b))
    else:
        print(f'{idx+1}. {src}: FILE NOT FOUND')

print('\n--- DUPLICATES ---')
for d in duplicates:
    print(f'Item #{d[0]}: {d[1]} is duplicate of Item #{d[2][0]}: {d[2][1]}')

print('\n--- BLACK PHOTOS ---')
for b in blacks:
    print(f'Item #{b[0]}: {b[1]}')
