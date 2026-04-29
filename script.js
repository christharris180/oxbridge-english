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
                element.textContent = translation;
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
});