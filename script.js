// ==========================================
// LANGUAGE SWITCHER (DROPDOWN)
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const langToggle = document.querySelector('.lang-toggle');
    const langTrigger = document.querySelector('.lang-dropdown-trigger');
    const langOptions = document.querySelectorAll('.lang-option');
    const currentFlag = document.querySelector('.current-flag');
    const elementsToTranslate = document.querySelectorAll('[data-en][data-es]');
    
    // Get saved language or default to English
    let currentLang = localStorage.getItem('preferredLanguage') || 'en';
    
    // Apply saved language on page load
    setLanguage(currentLang);
    
    // Toggle dropdown
    if (langTrigger) {
        langTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            langToggle.classList.toggle('open');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (langToggle && !langToggle.contains(e.target)) {
            langToggle.classList.remove('open');
        }
    });
    
    // Language option click handlers
    langOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
            localStorage.setItem('preferredLanguage', lang);
            langToggle.classList.remove('open');
        });
    });
    
    function setLanguage(lang) {
        currentLang = lang;
        
        // Update current flag in trigger
        const flagEmoji = lang === 'en' ? '🇬🇧' : '🇪🇸';
        if (currentFlag) {
            currentFlag.textContent = flagEmoji;
        }
        
        // Update active state on options
        langOptions.forEach(option => {
            if (option.getAttribute('data-lang') === lang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        // Update all translatable elements
        elementsToTranslate.forEach(element => {
            const translation = element.getAttribute(`data-${lang}`);
            if (translation) {
                element.textContent = translation;
            }
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
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
