import os
import re

files_to_update = ['events.html', 'concerts.html', 'portraits.html', 'brands.html']
base_dir = r"c:\Users\avina\Downloads\deploy-6a2b2022856d6b59b87eb836"

template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Avinash Photography</title>
    <meta name="description" content="{desc}">
    <link rel="stylesheet" href="styles.css">
    <script defer src="script.js"></script>
</head>
<body>
    <!-- Noise Texture Overlay -->
    <div class="noise-overlay"></div>

    <!-- Navigation -->
    <nav class="navbar" id="navbar">
        <a href="index.html" class="logo">Avinash.</a>
        <ul class="nav-links" id="nav-links">
            <li><a href="index.html#home">Home</a></li>
            <li><a href="index.html#about">About</a></li>
            <li><a href="index.html#portfolio">Work</a></li>
            <li><a href="index.html#contact">Contact</a></li>
        </ul>
        <a href="index.html#contact" class="nav-cta">Let's Connect</a>
        <div class="hamburger" aria-label="Toggle menu" role="button">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
        </div>
    </nav>

    <!-- Portfolio Section -->
    <section class="section" style="padding-top: 10rem;">
        <div class="container">
            <div class="section-header reveal">
                <h2 class="heading-md">{title}</h2>
                <p style="font-size: 1.25rem; color: var(--text-secondary); font-family: 'Playfair Display', serif; font-style: italic;">{desc}</p>
            </div>
            
            <div class="editorial-masonry" id="gallery">
{gallery_items}
            </div>
            
            <div style="text-align: center; margin-top: 5rem;" class="reveal">
                <a href="index.html#portfolio" class="explore-cta">Back to Main Portfolio</a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container footer-content">
            <div style="font-family: 'Playfair Display', serif; font-size: 1.25rem;">Avinash Photography</div>
            <div style="font-family: 'Inter', sans-serif; font-size: 0.85rem; color: var(--text-muted);">&copy; 2026 &mdash; Capturing moments, telling stories.</div>
            <div class="social-links">
                <a href="https://www.instagram.com/avanish.heic/" target="_blank" rel="noopener noreferrer">Instagram</a>
                <a href="https://www.linkedin.com/in/avinashcreates/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
            <div class="handwritten" style="margin-top: 1rem;">Thanks for looking.</div>
        </div>
    </footer>
    
    <!-- Lightbox Modal -->
    <div id="lightbox" class="lightbox"></div>
</body>
</html>
"""

for filename in files_to_update:
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract Title and Desc
    title_match = re.search(r'<title>(.*?)</title>', content)
    title = title_match.group(1).split('|')[0].strip() if title_match else "Gallery"
    
    desc_match = re.search(r'<meta name="description" content="(.*?)">', content)
    desc = desc_match.group(1) if desc_match else "Photography Collection"
    
    # Extract images
    # <img src="assets/event_1.jpg" alt="Keynote Session at Build with AI Lucknow" class="gallery-img">
    img_matches = re.finditer(r'<img\s+src="(.*?)"\s+alt="(.*?)"', content)
    
    gallery_items = []
    delay = 0.1
    for match in img_matches:
        src = match.group(1)
        alt = match.group(2)
        
        item = f"""                <div class="masonry-item reveal" style="transition-delay: {delay}s;">
                    <div class="print-frame">
                        <img src="{src}" alt="{alt}" class="print-img">
                        <div class="print-caption">
                            <span class="print-title">{alt}</span>
                            <span class="print-date">2026</span>
                        </div>
                    </div>
                </div>"""
        gallery_items.append(item)
        delay = 0.1 if delay >= 0.4 else delay + 0.1
        
    new_html = template.format(
        title=title,
        desc=desc,
        gallery_items="\n".join(gallery_items)
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)
        
    print(f"Updated {filename} with {len(gallery_items)} items.")
