document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const imageWrappers = document.querySelectorAll('.image-wrapper');
    const searchBar = document.getElementById('search-bar');
    const galleryContainer = document.querySelector('.gallery-container');
    const notificationContainer = document.getElementById('notification-container');

    // Initial setup: all images are visible for filtering
    imageWrappers.forEach(wrapper => wrapper.classList.add('visible'));

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            const radius = diameter / 2;
            ripple.style.width = ripple.style.height = `${diameter}px`;
            ripple.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
            ripple.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
            button.appendChild(ripple);
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            filterImages(filter);
            updateGalleryImages(); // Update gallery images after filtering
        });
    });

    searchBar.addEventListener('input', () => {
        filterImages(document.querySelector('.filter-btn.active').dataset.filter);
        updateGalleryImages(); // Update gallery images after searching
    });

    function filterImages(categoryFilter) {
        const searchTerm = searchBar.value.toLowerCase();

        imageWrappers.forEach(wrapper => {
            const imageCategory = wrapper.dataset.category;
            const altText = wrapper.querySelector('img').alt.toLowerCase();

            const matchesCategory = (categoryFilter === 'all' || imageCategory === categoryFilter);
            const matchesSearch = altText.includes(searchTerm);

            if (matchesCategory && matchesSearch) {
                wrapper.classList.remove('hidden');
                wrapper.classList.add('visible');
            } else {
                wrapper.classList.remove('visible');
                wrapper.classList.add('hidden');
            }
        });
    }

    // Stagger-fade in animation and Skeleton loading logic
    let delay = 0;
    const imageLoadPromises = [];

    imageWrappers.forEach((wrapper, index) => {
        const img = wrapper.querySelector('img');
        const skeleton = wrapper.querySelector('.skeleton-loader');
        const favoriteIcon = wrapper.querySelector('.favorite-icon');

        // Apply staggered delay for animation
        wrapper.style.transitionDelay = `${delay}ms`;
        delay += 75; // Stagger delay

        // Simulate network delay and load image
        const imgLoadPromise = new Promise(resolve => {
            // Load image immediately for debugging
            console.log('Attempting to load:', img.dataset.src);
            img.src = img.dataset.src;

            img.onload = () => {
                console.log('Image loaded successfully:', img.src);
                // Remove skeleton after image is fully loaded and visible
                setTimeout(() => {
                    skeleton.remove();
                    wrapper.classList.add('animate-in'); // Trigger stagger-fade in animation
                }, 500); // Small delay to allow transition
                resolve();
            };
            img.onerror = () => {
                console.error('Failed to load image:', img.dataset.src);
                skeleton.remove(); // Remove skeleton even if image fails to load
                resolve(); // Resolve to not block Promise.all
            };
        });
        imageLoadPromises.push(imgLoadPromise);

        // Favorite icon click handler
        favoriteIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent lightbox from opening
            favoriteIcon.classList.toggle('saved');
            if (favoriteIcon.classList.contains('saved')) {
                showNotification('Saved to Favorites!');
            }
        });
    });

    Promise.all(imageLoadPromises).then(() => {
        // All images have been processed, now update gallery for lightbox
        updateGalleryImages();
    });

    function showNotification(message) {
        notificationContainer.textContent = message;
        notificationContainer.classList.add('show');
        setTimeout(() => {
            notificationContainer.classList.remove('show');
        }, 3000); // Notification disappears after 3 seconds
    }

    // Lightbox functionality
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeBtn = document.getElementById('close-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const downloadBtn = document.getElementById('download-btn');
    const zoomToggleBtn = document.getElementById('zoom-toggle-btn');

    let currentIndex = 0;
    let galleryImages = []; // To store currently visible images for lightbox navigation
    let slideshowInterval;
    let isPlaying = false;
    let isZoomed = false;

    // Function to update galleryImages based on currently visible images
    function updateGalleryImages() {
        galleryImages = Array.from(document.querySelectorAll('.image-wrapper.visible img'));
    }

    // Open Lightbox
    imageWrappers.forEach((wrapper) => { // Removed index as it's not directly used here
        wrapper.addEventListener('click', () => {
            if (!wrapper.classList.contains('animate-in')) return; // Prevent opening lightbox if image not animated in
            updateGalleryImages(); // Update visible images before opening lightbox
            const clickedImage = wrapper.querySelector('img');
            currentIndex = galleryImages.findIndex(img => img === clickedImage);
            openLightbox(clickedImage.src, clickedImage.alt);
        });
    });

    function openLightbox(src, alt) {
        lightboxImage.src = src;
        lightboxImage.alt = alt;
        downloadBtn.href = src;
        lightboxOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    }

    // Close Lightbox
    closeBtn.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === lightboxOverlay) {
            closeLightbox();
        }
    });

    function closeLightbox() {
        lightboxOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        stopSlideshow();
        resetZoom();
    }

    // Navigation
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));

    function navigateLightbox(direction) {
        currentIndex = (currentIndex + direction + galleryImages.length) % galleryImages.length;
        const newImage = galleryImages[currentIndex];
        lightboxImage.src = newImage.src;
        lightboxImage.alt = newImage.alt;
        downloadBtn.href = newImage.src;
        resetZoom();
    }

    // Slideshow
    playPauseBtn.addEventListener('click', toggleSlideshow);

    function toggleSlideshow() {
        if (isPlaying) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    }

    function startSlideshow() {
        isPlaying = true;
        playPauseBtn.textContent = 'Pause';
        slideshowInterval = setInterval(() => {
            navigateLightbox(1);
        }, 3000); // Change image every 3 seconds
    }

    function stopSlideshow() {
        isPlaying = false;
        playPauseBtn.textContent = 'Play';
        clearInterval(slideshowInterval);
    }

    // Zoom Toggle
    zoomToggleBtn.addEventListener('click', toggleZoom);

    function toggleZoom() {
        isZoomed = !isZoomed;
        lightboxImage.classList.toggle('zoomed', isZoomed);
        zoomToggleBtn.textContent = isZoomed ? 'Unzoom' : 'Zoom';

        // Reset position on zoom toggle
        lightboxImage.style.transform = 'translate(0, 0)';
    }

    function resetZoom() {
        isZoomed = false;
        lightboxImage.classList.remove('zoomed');
        zoomToggleBtn.textContent = 'Zoom';
        lightboxImage.style.transform = 'translate(0, 0)';
    }

    // Drag functionality for zoomed image
    let isDragging = false;
    let startX, startY, imgX, imgY;

    lightboxImage.addEventListener('mousedown', (e) => {
        if (isZoomed) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const transformMatrix = window.getComputedStyle(lightboxImage).transform;
            if (transformMatrix !== 'none') {
                const matrix = transformMatrix.match(/matrix\((.*)\)/)[1].split(', ').map(Number);
                imgX = matrix[4];
                imgY = matrix[5];
            } else {
                imgX = 0;
                imgY = 0;
            }
            lightboxImage.style.cursor = 'grabbing';
        }
    });

    lightboxImage.addEventListener('mousemove', (e) => {
        if (!isDragging || !isZoomed) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        lightboxImage.style.transform = `translate(${imgX + dx}px, ${imgY + dy}px)`;
    });

    lightboxImage.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            lightboxImage.style.cursor = 'grab';
        }
    });

    lightboxImage.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            lightboxImage.style.cursor = 'grab';
        }
    });

    // Touch Swiping for Lightbox (Mobile Optimization)
    let touchStartX = 0;
    let touchEndX = 0;

    lightboxImage.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    lightboxImage.addEventListener('touchmove', (e) => {
        // Prevent image dragging if not zoomed, to allow natural scrolling
        if (!isZoomed) {
            e.preventDefault();
        }
    });

    lightboxImage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        if (touchEndX < touchStartX - 50) { // Swiped left
            navigateLightbox(1);
        } else if (touchEndX > touchStartX + 50) { // Swiped right
            navigateLightbox(-1);
        }
    });

    // Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // Keyboard Accessibility
    document.addEventListener('keydown', (e) => {
        if (lightboxOverlay.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            }
        }
    });

    // Re-filter images when search or category changes to update galleryImages array
    searchBar.addEventListener('input', () => {
        filterImages(document.querySelector('.filter-btn.active').dataset.filter);
        updateGalleryImages();
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.dataset.filter;
            filterImages(filter);
            updateGalleryImages();
        });
    });

});