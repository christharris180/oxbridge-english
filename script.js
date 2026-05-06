// ==========================================
// COOKIE CONSENT BANNER (For AdSense/GDPR)
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Create the banner if consent hasn't been given yet
    if (!localStorage.getItem('cookieConsent')) {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; background: rgba(13, 13, 36, 0.98); border-top: 2px solid #D4AF37; padding: 20px; z-index: 9999; display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 20px; backdrop-filter: blur(10px); box-shadow: 0 -5px 20px rgba(0,0,0,0.4);';
        
        banner.innerHTML = `
            <div style="flex: 1; max-width: 800px; min-width: 250px;">
                <p style="color: rgba(255,255,255,0.9); margin: 0 0 5px 0; font-size: 14px; line-height: 1.5; font-family: 'Roboto', sans-serif;" 
                   data-en="We use cookies to personalize content, serve targeted ads, and analyze our traffic. By continuing to use our site, you consent to our use of cookies." 
                   data-es="Usamos cookies para personalizar el contenido, mostrar anuncios relevantes y analizar nuestro tráfico. Al continuar usando nuestro sitio, acepta nuestro uso de cookies.">
                   We use cookies to personalize content, serve targeted ads, and analyze our traffic. By continuing to use our site, you consent to our use of cookies.
                </p>
                <a href="privacy.html" style="color: #D4AF37; font-size: 13px; text-decoration: none; font-family: 'Roboto', sans-serif; font-weight: 500;" 
                   data-en="Read our Privacy Policy" 
                   data-es="Leer nuestra Política de Privacidad">
                   Read our Privacy Policy
                </a>
            </div>
            <button id="accept-cookies" style="background: linear-gradient(180deg, #D4AF37 0%, #C9A227 60%, #9e7a0e 100%); color: #1a1a3e; border: none; padding: 12px 30px; border-radius: 30px; font-weight: 700; cursor: pointer; font-size: 15px; font-family: 'Roboto', sans-serif; white-space: nowrap; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" 
                    data-en="Got it!" 
                    data-es="¡Entendido!">
                Got it!
            </button>
        `;
        
        document.body.appendChild(banner);
        
        // Add click event to dismiss and save consent
        document.getElementById('accept-cookies').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.style.display = 'none';
        });
    }

    // ==========================================
    // LANGUAGE SWITCHER (TWO FLAGS)
    // ==========================================
    
    const langOptions = document.querySelectorAll('.lang-toggle .lang-option');
    
    // Get saved language or default to English
    let currentLang = localStorage.getItem('preferredLanguage') || 'en';
    
    // Apply saved language on page load (this also translates the new cookie banner!)
    setLanguage(currentLang);
    
    // Language option click handlers
    langOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
            localStorage.setItem('preferredLanguage', lang);
        });
    });
    
    function setLanguage(lang) {
        currentLang = lang;
        window.uiLang = lang; // Set globally so other scripts can read it instantly
        
        // Update active state on flag buttons
        langOptions.forEach(option => {
            if (option.getAttribute('data-lang') === lang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        // Update all translatable elements - QUERY FRESH EVERY TIME
        document.querySelectorAll('[data-en][data-es]').forEach(element => {
            const translation = element.getAttribute(`data-${lang}`);
            if (translation) {
                element.innerHTML = translation;
            }
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Fire a custom event so specific page scripts know to update their dynamic text
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
    
    // ==========================================
    // MOBILE MENU TOGGLE
    // ==========================================
    
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-container')) {
                navLinks.classList.remove('active');
            }
        });
    }
    
    // ==========================================
    // SMOOTH SCROLLING FOR ANCHOR LINKS
    // ==========================================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // ==========================================
    // ACTIVE NAV LINK HIGHLIGHTING
    // ==========================================
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinksAll = document.querySelectorAll('.nav-links a');
    
    navLinksAll.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // ==========================================
    // HERO CAROUSEL LOGIC
    // ==========================================
    
    const track = document.getElementById('heroCarouselTrack');
            
    if (track) {
        let currentSlideIndex = 0;
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        const totalOriginalSlides = slides.length;
        let carouselTimer;
        let isTransitioning = false;

        // Clone the first slide and append it to the end for the seamless infinite loop
        const firstSlideClone = slides[0].cloneNode(true);
        track.appendChild(firstSlideClone);

        function updateCarousel(instant = false) {
            if (instant) {
                // Instant snap (used invisibly behind the scenes)
                track.style.transition = 'none';
            } else {
                // Slower, smoother 1.2-second slide
                track.style.transition = 'transform 1.2s ease-in-out';
            }
            
            track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
            
            // Manage active dot state (accounting for the clone)
            let activeDotIndex = currentSlideIndex === totalOriginalSlides ? 0 : currentSlideIndex;
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[activeDotIndex]) {
                dots[activeDotIndex].classList.add('active');
            }
        }

        window.goToSlide = function(index) {
            // Prevent clicking dots during the fake loop transition
            if (isTransitioning) return;
            
            currentSlideIndex = index;
            updateCarousel();
            resetTimer();
        };

        function nextSlide() {
            if (isTransitioning) return;
            
            currentSlideIndex++;
            updateCarousel();
            
            // If we just slid to the cloned slide, we need to snap back to the start invisibly
            if (currentSlideIndex === totalOriginalSlides) {
                isTransitioning = true;
                
                // Wait exactly the length of the CSS transition (1.2s = 1200ms)
                setTimeout(() => {
                    currentSlideIndex = 0;
                    updateCarousel(true); // true = instant snap without animation
                    
                    // Force browser reflow to register the instant snap before animating again
                    track.offsetHeight; 
                    isTransitioning = false;
                }, 1200); 
            }
        }

        function resetTimer() {
            clearInterval(carouselTimer);
            // Changed timing to 8 seconds (8000 milliseconds)
            carouselTimer = setInterval(nextSlide, 8000); 
        }

        resetTimer();
    }
});

// ==========================================
// PWA SMART INSTALLATION LOGIC
// ==========================================
window.deferredPrompt = null;

// Catch the native install prompt (Android/Chrome/Edge) and hold it
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
});

window.handlePwaInstall = function() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const uiLang = localStorage.getItem('preferredLanguage') || 'en';

    if (window.deferredPrompt) {
        // Trigger the official native install popup
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
            window.deferredPrompt = null;
        });
    } else if (isIOS) {
        // Apple blocks native prompts. Show instructions instead.
        alert(uiLang === 'es' ? 
            'Para instalar en iPhone/iPad:\n\n1. Toca el botón de Compartir (el cuadrado con la flecha hacia arriba) en la parte inferior de Safari.\n2. Desliza hacia abajo y selecciona "Añadir a inicio".' : 
            'To install on iPhone/iPad:\n\n1. Tap the Share button (square with an upward arrow) at the bottom of Safari.\n2. Scroll down and select "Add to Home Screen".'
        );
    } else {
        // Fallback for browsers that don't support the button
        alert(uiLang === 'es' ? 
            'Para instalar esta app, usa la opción "Añadir a la pantalla de inicio" en el menú de tu navegador (los tres puntos en la esquina superior).' : 
            'To install this app, use the "Add to Home screen" option in your browser menu (the three dots in the top corner).'
        );
    }
};

// Register a Service Worker to satisfy Chrome's PWA requirements
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
}