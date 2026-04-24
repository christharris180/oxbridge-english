/**
 * SmarTranslator - Unified Web & App Logic
 * Includes: Firebase Sync, 5-Mode Quiz, Interactive Tutorial, and Bilingual Dictionary
 */

// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
let isSpanishToEnglish = true;
let isRecording = false;
let debounceTimer = null;
let saveToHistoryTimer = null;
let uiLang = localStorage.getItem('preferredLanguage') || 'en';
let userUid = null;

// Quiz State
let quizState = { 
    score: 0, 
    currentQuestion: 0, 
    maxQuestions: 10, 
    usedWords: [], 
    currentItem: null, 
    isAnswering: false, 
    hasFailedCurrent: false 
};

// Tutorial State
let currentTourStep = 0;
const tourSteps = [
    { target: null, es: "¡Bienvenido al SmarTraductor de Oxbridge English!", en: "Welcome to the Oxbridge English SmarTranslator!" },
    { target: 'login-btn', es: "1. Inicia sesión para activar la copia de seguridad en la nube y guardar tu progreso.", en: "1. Log in to enable cloud backup and save your progress." },
    { target: 'record-btn', es: "2. Pulsa aquí para grabar audio y traducir tu voz.", en: "2. Tap here to record audio and translate your voice." },
    { target: 'output-text', es: "3. ¡Toca cualquier palabra traducida para ver su definición!", en: "3. Tap any translated word to see its definition!" },
    { target: 'tutorial-btn', es: "Si necesitas ayuda, toca este ícono en cualquier momento.", en: "If you need help, tap this icon anytime!" }
];

// ==========================================
// 2. UTILS & UI HELPERS
// ==========================================
const escHtml = (str) => String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    if(!toast) return;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.classList.add('hidden'); }, 400);
    }, 2000);
}

// ==========================================
// 3. CORE TRANSLATOR LOGIC
// ==========================================
async function doTranslation() {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const loadingShimmer = document.getElementById('loading-shimmer');
    
    const text = inputText.value.trim();
    if (!text) return;

    loadingShimmer.classList.remove('hidden');
    outputText.classList.add('hidden');

    try {
        const fromLang = isSpanishToEnglish ? 'es' : 'en';
        const toLang = isSpanishToEnglish ? 'en' : 'es';
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${fromLang}&tl=${toLang}&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        const translation = data[0].map(item => item[0]).join('').trim();
        
        window.currentSelectedTranslation = translation; 
        outputText.innerHTML = `<div style="font-size: 18px; line-height: 1.6; color: #1a1a3e;">${makeTextClickable(translation, toLang)}</div>`;
        outputText.classList.remove('empty');
        
        // Auto-save logic
        saveToHistory(text, translation, isSpanishToEnglish ? 'es-en' : 'en-es');
        
        // Auto-speak if enabled
        if (document.getElementById('auto-speak-toggle')?.checked) {
            speakText(translation, toLang === 'en' ? 'en-US' : 'es-ES');
        }
    } catch (e) {
        outputText.textContent = "Translation Error / Error de traducción";
    } finally {
        loadingShimmer.classList.add('hidden');
        outputText.classList.remove('hidden');
    }
}

function makeTextClickable(text, targetLang) {
    const parts = text.split(/([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*)/);
    return parts.map(part => {
        if (/^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*$/.test(part)) {
            const cleanWord = part.replace(/'/g, "\\'");
            return `<span class="clickable-word" onclick="openWordModal('${cleanWord}', '${targetLang}')">${part}</span>`;
        }
        return escHtml(part);
    }).join('');
}

// ==========================================
// 4. DATABASE & CLOUD SYNC (FIREBASE)
// ==========================================
async function saveToHistory(original, translation, direction) {
    if (original.toLowerCase() === translation.toLowerCase()) return;

    // Save Locally
    let history = JSON.parse(localStorage.getItem('app_history') || '[]');
    const sessionId = Date.now().toString();
    
    const newItem = { 
        original, 
        translation, 
        dir: direction, 
        sessionId, 
        mastery: 0,
        timestamp: Date.now() 
    };

    history.unshift(newItem);
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem('app_history', JSON.stringify(history));

    // Sync to Firebase if logged in
    if (window.cloudDb && userUid) {
        try {
            const docId = `${userUid}_${sessionId}`;
            await window.cloudSetDoc(window.cloudDoc(window.cloudDb, "translations_history", docId), {
                userId: userUid,
                originalText: original,
                translatedText: translation,
                languageDirection: direction,
                sessionId: sessionId,
                timestamp: Date.now(),
                mastery: 0
            }, { merge: true });
        } catch (e) { console.error("Cloud Sync Failed", e); }
    }
}

// ==========================================
// 5. AUDIO & VOICE
// ==========================================
function speakText(text, lang) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
}

function playDictAudio(word, langCode) {
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encodeURIComponent(word)}`;
    const audio = new Audio(audioUrl);
    audio.play().catch(() => showToast("Error playing audio"));
}

// ==========================================
// 6. INTERACTIVE TUTORIAL
// ==========================================
window.startTutorial = function() {
    currentTourStep = 0;
    document.getElementById('tour-backdrop').classList.add('active');
    renderTourStep();
};

function renderTourStep() {
    const step = tourSteps[currentTourStep];
    const bubble = document.getElementById('tour-bubble');
    const textEl = document.getElementById('tour-text');
    
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    
    textEl.textContent = uiLang === 'es' ? step.es : step.en;
    bubble.classList.add('active');

    if (step.target) {
        const targetEl = document.getElementById(step.target);
        if (targetEl) {
            targetEl.classList.add('tour-highlight');
            const rect = targetEl.getBoundingClientRect();
            bubble.style.top = (rect.bottom + 20) + 'px';
            bubble.style.left = '50%';
            bubble.style.transform = 'translateX(-50%)';
        }
    } else {
        bubble.style.top = '40%';
        bubble.style.left = '50%';
        bubble.style.transform = 'translate(-50%, -50%)';
    }
}

window.nextTourStep = function() {
    currentTourStep++;
    if (currentTourStep >= tourSteps.length) {
        window.endTutorial();
    } else {
        renderTourStep();
    }
};

window.endTutorial = function() {
    document.getElementById('tour-backdrop').classList.remove('active');
    document.getElementById('tour-bubble').classList.remove('active');
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    localStorage.setItem('tutorial_done', 'true');
};

// ==========================================
// 7. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Button listeners
    document.getElementById('record-btn')?.addEventListener('click', toggleMic);
    document.getElementById('tutorial-btn')?.addEventListener('click', window.startTutorial);
    document.getElementById('clear-btn')?.addEventListener('click', () => {
        document.getElementById('input-text').value = '';
        doTranslation();
    });

    // Auto-translate on typing
    document.getElementById('input-text')?.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doTranslation, 800);
    });

    // Start tutorial if new user
    if (!localStorage.getItem('tutorial_done')) {
        setTimeout(window.startTutorial, 2000);
    }
});

// Dictionary Modal logic (Global for onclick)
window.openWordModal = async function(word, langCode) {
    const modal = document.getElementById('word-modal');
    const body = document.getElementById('word-modal-body');
    modal.classList.add('active');
    body.innerHTML = '<div class="loading-shimmer">Loading Definition...</div>';

    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();
        // Render dictionary results...
        body.innerHTML = `<h3>${word}</h3><p>${data[0].meanings[0].definitions[0].definition}</p>`;
    } catch (e) {
        body.innerHTML = "Definition not found / No se encontró definición.";
    }
};