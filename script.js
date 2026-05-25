// ==========================================
// GLOBAL PAGE FADE TRANSITION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Add a tiny 50ms delay before fading in. 
    // This forces the browser to register the black screen FIRST,
    // ensuring it calculates the 0 to 1 opacity transition smoothly without snapping.
    setTimeout(() => {
        document.body.classList.add('fade-in');
    }, 50);

    // 2. Intercept link click commands for black transition effect
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip checks for target blanks, script loops, anchor scrolls, or foreign cross-domains
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || this.hostname !== window.location.hostname || this.getAttribute('target') === '_blank') {
                return;
            }
            
            e.preventDefault();
            const targetUrl = this.href;
            
            // Trigger absolute opacity reset to hide elements before canvas changes pages
            document.body.classList.remove('fade-in');
            
            // Wait 450ms (50ms longer than the 400ms CSS transition) 
            // to ensure the fade is 100% complete before changing the URL
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 450); 
        });
    });
});

// ==========================================
// COOKIE CONSENT BANNER (For AdSense/GDPR)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
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
        
        document.getElementById('accept-cookies').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.style.display = 'none';
        });
    }

    // ==========================================
    // LANGUAGE SWITCHER (TWO FLAGS)
    // ==========================================
    
    const langOptions = document.querySelectorAll('.lang-toggle .lang-option');
    let currentLang = localStorage.getItem('preferredLanguage') || 'en';
    setLanguage(currentLang);
    
    langOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
            localStorage.setItem('preferredLanguage', lang);
        });
    });
    
    function setLanguage(lang) {
        currentLang = lang;
        window.uiLang = lang; 
        
        langOptions.forEach(option => {
            if (option.getAttribute('data-lang') === lang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        document.querySelectorAll('[data-en][data-es]').forEach(element => {
            const translation = element.getAttribute(`data-${lang}`);
            if (translation) {
                element.innerHTML = translation;
            }
        });
        
        document.documentElement.lang = lang;
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
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
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

        const firstSlideClone = slides[0].cloneNode(true);
        track.appendChild(firstSlideClone);

        function syncNavWithCarousel(slideIndex) {
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('nav-carousel-highlight');
            });

            const slideLinks = {
                0: 'courses.html',
                1: 'placement-test.html',
                2: 'translator.html',
                3: 'blog.html'
            };

            const targetHref = slideLinks[slideIndex];
            if (targetHref) {
                const activeLink = document.querySelector(`.nav-links a[href="${targetHref}"]`);
                if (activeLink) {
                    activeLink.classList.add('nav-carousel-highlight');
                }
            }
        }

        function updateCarousel(instant = false) {
            if (instant) {
                track.style.transition = 'none';
            } else {
                track.style.transition = 'transform 1.2s ease-in-out';
            }
            
            track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
            
            let activeDotIndex = currentSlideIndex === totalOriginalSlides ? 0 : currentSlideIndex;
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[activeDotIndex]) {
                dots[activeDotIndex].classList.add('active');
            }
            
            syncNavWithCarousel(activeDotIndex);
        }

        window.goToSlide = function(index) {
            if (isTransitioning) return;
            currentSlideIndex = index;
            updateCarousel();
            resetTimer();
        };

        function nextSlide() {
            if (isTransitioning) return;
            currentSlideIndex++;
            updateCarousel();
            
            if (currentSlideIndex === totalOriginalSlides) {
                isTransitioning = true;
                setTimeout(() => {
                    currentSlideIndex = 0;
                    updateCarousel(true);
                    track.offsetHeight; 
                    isTransitioning = false;
                }, 1200); 
            }
        }

        function resetTimer() {
            clearInterval(carouselTimer);
            carouselTimer = setInterval(nextSlide, 8000); 
        }

        syncNavWithCarousel(0);
        resetTimer();
    }
});

// ==========================================
// PWA SMART INSTALLATION LOGIC
// ==========================================
window.deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
});

window.handlePwaInstall = function() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const uiLang = localStorage.getItem('preferredLanguage') || 'en';

    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
            window.deferredPrompt = null;
        });
    } else if (isIOS) {
        alert(uiLang === 'es' ? 
            'Para instalar en iPhone/iPad:\n\n1. Toca el botón de Compartir (el cuadrado con la flecha hacia arriba) en la parte inferior de Safari.\n2. Desliza hacia abajo y selecciona "Añadir a inicio".' : 
            'To install on iPhone/iPad:\n\n1. Tap the Share button (square with an upward arrow) at the bottom of Safari.\n2. Scroll down and select "Add to Home Screen".'
        );
    } else {
        alert(uiLang === 'es' ? 
            'Para instalar esta app, usa la opción "Añadir a la pantalla de inicio" en el menú de tu navegador (los tres puntos en la esquina superior).' : 
            'To install this app, use the "Add to Home screen" option in your browser menu (the three dots in the top corner).'
        );
    }
};

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
}