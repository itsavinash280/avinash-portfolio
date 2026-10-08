import { PerspectiveHero } from './src/gl/PerspectiveHero.js';
import { PerspectiveButton } from './src/gl/PerspectiveButton.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- Initialize Perspective 3D WebGL Hero & Buttons ---
    const heroContainer = document.querySelector('.perspective-hero-wrapper');
    if (heroContainer) {
        const heroButtons = [];
        document.querySelectorAll('.perspective-btn').forEach(btn => {
            heroButtons.push(new PerspectiveButton(btn));
        });

        new PerspectiveHero(heroContainer, {
            onStateChange: (isState1) => {
                heroButtons.forEach(btn => btn.setTheme(isState1));
            }
        });
    }



    // --- Custom Emoji Cursor ---
    const cursorEl = document.createElement('div');
    cursorEl.id = 'emoji-cursor';
    cursorEl.textContent = '📷';
    cursorEl.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 32px; height: 32px;
        font-size: 28px;
        line-height: 1;
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%);
        transition: transform 0.08s ease-out;
        user-select: none;
    `;
    document.body.appendChild(cursorEl);
    document.documentElement.style.cursor = 'none';
    document.body.style.cursor = 'none';

    document.addEventListener('mousemove', (e) => {
        cursorEl.style.left = e.clientX + 'px';
        cursorEl.style.top = e.clientY + 'px';
    });

    document.addEventListener('mousedown', () => {
        cursorEl.textContent = '📸';
        cursorEl.style.transform = 'translate(-50%, -50%) scale(1.25)';
    });
    document.addEventListener('mouseup', () => {
        cursorEl.textContent = '📷';
        cursorEl.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fallbackPhotos = {
        event: [
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=85',
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=85',
            'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=85'
        ],
        concert: [
            'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=85',
            'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=85'
        ],
        portrait: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
            'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85'
        ],
        brand: [
            'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85',
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85',
            'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85'
        ]
    };

    const resolveFallbackPhoto = (img, index) => {
        const text = `${img.src} ${img.alt}`.toLowerCase();
        const category = text.includes('concert') ? 'concert'
            : text.includes('portrait') ? 'portrait'
            : text.includes('brand') || text.includes('ethnic') ? 'brand'
            : 'event';
        return fallbackPhotos[category][index % fallbackPhotos[category].length];
    };

    document.querySelectorAll('img').forEach((img, index) => {
        img.addEventListener('error', () => {
            if (img.dataset.fallbackApplied === 'true') return;
            img.dataset.fallbackApplied = 'true';
            img.src = resolveFallbackPhoto(img, index);
        });
    });

    const deskTime = document.getElementById('desk-time');
    const coverTime = document.getElementById('cover-time');
    const scrollBar = document.getElementById('scroll-bar');
    const scrollThumb = document.getElementById('scroll-thumb');
    const scrollPercent = document.getElementById('scroll-percent');

    const updateClock = () => {
        const time = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata'
        }) + ' IST';
        if (deskTime) deskTime.textContent = time;
        if (coverTime) coverTime.textContent = time;
    };

    const updateScrollMeter = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 0;
        if (scrollBar) scrollBar.style.width = `${progress}%`;
        if (scrollThumb) scrollThumb.style.left = `${progress}%`;
        if (scrollPercent) scrollPercent.textContent = `${progress}%`;
    };

    updateClock();
    updateScrollMeter();
    window.addEventListener('scroll', updateScrollMeter, { passive: true });
    window.addEventListener('resize', updateScrollMeter);
    setInterval(updateClock, 30000);

    // ==========================================
    // Navbar Scroll & Section Highlighting
    // ==========================================
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links li');

    window.addEventListener('scroll', () => {
        // Toggle navbar visibility when scrolled past full-screen hero
        if (navbar) {
            if (window.scrollY > window.innerHeight * 0.65) {
                navbar.classList.add('visible');
            } else {
                navbar.classList.remove('visible');
            }
        }

        // Active Link Highlighting on Scroll
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navLinks.forEach(li => {
                li.classList.remove('active');
                const link = li.querySelector('a');
                if (link && link.getAttribute('href').endsWith(`#${currentSectionId}`)) {
                    li.classList.add('active');
                }
            });
        }
    });

    // ==========================================
    // Mobile Navigation Drawer (Hamburger)
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const menuLinks = document.getElementById('nav-links');

    if (hamburger && menuLinks) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('open');
            menuLinks.classList.toggle('open');
            
            if (menuLinks.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });

        const navAnchorTags = menuLinks.querySelectorAll('a');
        navAnchorTags.forEach(anchor => {
            anchor.addEventListener('click', () => {
                hamburger.classList.remove('open');
                menuLinks.classList.remove('open');
                document.body.style.overflow = 'auto';
            });
        });

        document.addEventListener('click', (e) => {
            if (menuLinks.classList.contains('open') && !menuLinks.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('open');
                menuLinks.classList.remove('open');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // ==========================================
    // IntersectionObserver - Scroll Reveal Engine
    // ==========================================
    const reveals = document.querySelectorAll('.reveal');
    
    if (reveals.length > 0 && !prefersReducedMotion) {
        const revealCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        };

        const revealObserver = new IntersectionObserver(revealCallback, {
            root: null,
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        reveals.forEach(el => {
            revealObserver.observe(el);
        });
    } else if (prefersReducedMotion) {
        reveals.forEach(el => el.classList.add('active'));
    }

    // ==========================================
    // Editorial Lightbox System
    // ==========================================
    const rawLightbox = document.getElementById('lightbox');
    
    if (rawLightbox) {
        rawLightbox.innerHTML = `
            <div class="lightbox-wrapper">
                <span class="close-lightbox">&times;</span>
                <div class="lightbox-loader"></div>
                <button class="lightbox-btn lightbox-btn-prev" aria-label="Previous image">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <img class="lightbox-content" id="lightbox-img" src="" alt="Enlarged preview">
                <button class="lightbox-btn lightbox-btn-next" aria-label="Next image">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
                <div class="lightbox-info">
                    <span class="lightbox-caption"></span>
                    <span class="lightbox-counter"></span>
                </div>
            </div>
        `;

        const lightboxImg = document.getElementById('lightbox-img');
        const closeBtn = rawLightbox.querySelector('.close-lightbox');
        const prevBtn = rawLightbox.querySelector('.lightbox-btn-prev');
        const nextBtn = rawLightbox.querySelector('.lightbox-btn-next');
        const captionText = rawLightbox.querySelector('.lightbox-caption');
        const counterText = rawLightbox.querySelector('.lightbox-counter');
        const loader = rawLightbox.querySelector('.lightbox-loader');

        // Gather valid lightbox items (e.g. photos in subpages)
        const imageItems = Array.from(document.querySelectorAll('.print-frame, .hero-image-wrapper'));

        let currentIdx = 0;

        const openLightbox = (index) => {
            currentIdx = index;
            rawLightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                rawLightbox.classList.add('active');
                loadImage(currentIdx);
            }, 20);
        };

        const loadImage = (index) => {
            if (index < 0 || index >= imageItems.length) return;
            
            const targetItem = imageItems[index];
            const img = targetItem.querySelector('img');
            const titleSpan = targetItem.querySelector('.print-title') || targetItem.querySelector('.metadata-label');
            
            loader.style.display = 'block';
            lightboxImg.classList.remove('loaded');
            
            lightboxImg.src = img.src;
            captionText.textContent = '';
            counterText.textContent = `${index + 1} / ${imageItems.length}`;
            
            lightboxImg.onload = () => {
                loader.style.display = 'none';
                lightboxImg.classList.add('loaded');
                preloadAdjacent();
            };
        };

        const nextImage = () => {
            if (imageItems.length > 0) {
                currentIdx = (currentIdx + 1) % imageItems.length;
                loadImage(currentIdx);
            }
        };

        const prevImage = () => {
            if (imageItems.length > 0) {
                currentIdx = (currentIdx - 1 + imageItems.length) % imageItems.length;
                loadImage(currentIdx);
            }
        };

        const preloadAdjacent = () => {
            if (imageItems.length <= 1) return;
            const nextIdx = (currentIdx + 1) % imageItems.length;
            const prevIdx = (currentIdx - 1 + imageItems.length) % imageItems.length;
            
            const nextImgSrc = imageItems[nextIdx].querySelector('img').src;
            const prevImgSrc = imageItems[prevIdx].querySelector('img').src;
            
            const cacheNext = new Image();
            cacheNext.src = nextImgSrc;
            const cachePrev = new Image();
            cachePrev.src = prevImgSrc;
        };

        const closeLightbox = () => {
            rawLightbox.classList.remove('active');
            lightboxImg.classList.remove('loaded');
            setTimeout(() => {
                rawLightbox.style.display = 'none';
                lightboxImg.src = '';
            }, 400); 
            document.body.style.overflow = 'auto';
        };

        imageItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                const img = item.querySelector('img');
                if (img && !img.classList.contains('no-lightbox')) {
                    e.preventDefault();
                    openLightbox(index);
                }
            });
        });

        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

        rawLightbox.addEventListener('click', (e) => {
            if (e.target === rawLightbox || e.target.classList.contains('lightbox-wrapper')) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (rawLightbox.classList.contains('active')) {
                if (e.key === 'ArrowRight') nextImage();
                if (e.key === 'ArrowLeft') prevImage();
                if (e.key === 'Escape') closeLightbox();
            }
        });

        // Mobile swipe support
        let startX = 0;
        let endX = 0;

        rawLightbox.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
        }, { passive: true });

        rawLightbox.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].screenX;
            const threshold = 50;
            if (endX < startX - threshold) {
                nextImage();
            } else if (endX > startX + threshold) {
                prevImage();
            }
        }, { passive: true });
    }
});
