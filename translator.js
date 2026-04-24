/**
 * SmarTranslator - Unified Web & App Logic
 * Includes: Firebase Sync, Voice Recognition, Interactive Tutorial, and Bilingual Dictionary
 */

// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
let isSpanishToEnglish = true;
let isRecording = false;
let debounceTimer = null;
let uiLang = localStorage.getItem('preferredLanguage') || 'en';
let userUid = null;

// Tutorial State
let currentTourStep = 0;
const tourSteps = [
    { target: null, es: "¡Bienvenido al SmarTraductor de Oxbridge English!", en: "Welcome to the Oxbridge English SmarTranslator!" },
    { target: 'record-btn', es: "1. Pulsa aquí para grabar audio y traducir tu voz.", en: "1. Tap here to record audio and translate your voice." },
    { target: 'input-text', es: "2. Escribe aquí el texto que desees traducir.", en: "2. Write the text you want to translate here." },
    { target: 'output-text', es: "3. ¡Toca cualquier palabra traducida para ver su definición!", en: "3. Tap any translated word to see its definition!" },
    { target: 'speak-btn', es: "4. Escucha la pronunciación de la traducción.", en: "4. Listen to the translation." }
];

// ==========================================
// 2. UTILS & UI HELPERS
// ==========================================
const escHtml = (str) => String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        // Create toast if it doesn't exist to prevent errors
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.style = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:10px 20px; border-radius:30px; z-index:10000; display:none;";
        document.body.appendChild(newToast);
    }
    const t = document.getElementById('toast');
    t.textContent = message;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 2500);
}

// ==========================================
// 3. CORE TRANSLATOR LOGIC
// ==========================================
async function doTranslation() {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const loadingShimmer = document.getElementById('loading-shimmer');
    
    const text = inputText.value.trim();
    if (!text) {
        outputText.textContent = uiLang === 'es' ? "La traducción aparecerá aquí..." : "Translation will appear here...";
        return;
    }

    if(loadingShimmer) loadingShimmer.classList.remove('hidden');
    
    try {
        const fromLang = isSpanishToEnglish ? 'es' : 'en';
        const toLang = isSpanishToEnglish ? 'en' : 'es';
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${fromLang}&tl=${toLang}&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        const translation = data[0].map(item => item[0]).join('').trim();
        
        window.currentSelectedTranslation = translation; 
        outputText.innerHTML = makeTextClickable(translation, toLang);
        outputText.classList.remove('empty');
        
        saveToHistory(text, translation, isSpanishToEnglish ? 'es-en' : 'en-es');
        
    } catch (e) {
        outputText.textContent = "Error de conexión / Connection Error";
    } finally {
        if(loadingShimmer) loadingShimmer.classList.add('hidden');
    }
}

function makeTextClickable(text, targetLang) {
    const parts = text.split(/([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*)/);
    return parts.map(part => {
        if (/^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*$/.test(part)) {
            const cleanWord = part.replace(/'/g, "\\'");
            return `<span class="clickable-word" style="cursor:pointer; border-bottom:1px dashed #D4AF37;" onclick="openWordModal('${cleanWord}', '${targetLang}')">${part}</span>`;
        }
        return escHtml(part);
    }).join('');
}

// ==========================================
// 4. VOICE INPUT (TOGGLE MIC)
// ==========================================
async function toggleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Speech recognition not supported / Voz no soportada");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isSpanishToEnglish ? 'es-ES' : 'en-US';
    const recordBtn = document.getElementById('record-btn');

    recognition.onstart = () => {
        isRecording = true;
        if(recordBtn) recordBtn.style.background = "#cc2020";
        showToast(uiLang === 'es' ? "Escuchando..." : "Listening...");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('input-text').value = transcript;
        doTranslation();
    };

    recognition.onend = () => {
        isRecording = false;
        if(recordBtn) recordBtn.style.background = "";
    };

    recognition.onerror = (e) => {
        showToast("Mic Error: " + e.error);
    };

    recognition.start();
}

// ==========================================
// 5. DATABASE & HISTORY
// ==========================================
function saveToHistory(original, translation, direction) {
    if (original.toLowerCase() === translation.toLowerCase()) return;
    let history = JSON.parse(localStorage.getItem('app_history') || '[]');
    const newItem = { original, translation, dir: direction, timestamp: Date.now(), sessionId: Date.now().toString() };
    
    // Avoid duplicates
    if (history.length > 0 && history[0].original === original) return;
    
    history.unshift(newItem);
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem('app_history', JSON.stringify(history));
}

// ==========================================
// 6. TUTORIAL LOGIC
// ==========================================
window.startTutorial = function() {
    currentTourStep = 0;
    const backdrop = document.getElementById('tour-backdrop');
    if(backdrop) backdrop.style.display = 'block';
    renderTourStep();
};

function renderTourStep() {
    const step = tourSteps[currentTourStep];
    const bubble = document.getElementById('tour-bubble');
    if(!bubble) return;

    bubble.style.display = 'block';
    bubble.innerHTML = `
        <p style="margin-bottom:15px; font-weight:500;">${uiLang === 'es' ? step.es : step.en}</p>
        <button onclick="nextTourStep()" style="background:#D4AF37; border:none; padding:8px 15px; border-radius:20px; cursor:pointer;">
            ${uiLang === 'es' ? 'Siguiente' : 'Next'}
        </button>
    `;
    
    if (step.target) {
        const targetEl = document.getElementById(step.target);
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            bubble.style.top = (rect.bottom + window.scrollY + 15) + 'px';
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
        document.getElementById('tour-bubble').style.display = 'none';
        document.getElementById('tour-backdrop').style.display = 'none';
        localStorage.setItem('tutorial_done', 'true');
    } else {
        renderTourStep();
    }
};

// ==========================================
// 7. DICTIONARY & LISTEN
// ==========================================
window.openWordModal = function(word, langCode) {
    // Basic redirect to dictionary page or handle modal
    window.location.href = `dictionary.html?word=${encodeURIComponent(word)}&lang=${langCode}`;
};

function speakOutput() {
    const text = document.getElementById('output-text').textContent;
    if (!text || text.includes("...")) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = isSpanishToEnglish ? 'en-US' : 'es-ES';
    window.speechSynthesis.speak(utter);
}

// ==========================================
// 8. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const recordBtn = document.getElementById('record-btn');
    const speakBtn = document.getElementById('speak-btn');
    const langRadios = document.querySelectorAll('input[name="lang-dir"]');

    if(recordBtn) recordBtn.addEventListener('click', toggleMic);
    if(speakBtn) speakBtn.addEventListener('click', speakOutput);

    if(inputText) {
        inputText.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doTranslation, 800);
        });
    }

    if(langRadios) {
        langRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                isSpanishToEnglish = e.target.value === 'es-en';
                doTranslation();
            });
        });
    }
    
    // Auto-start tutorial for new users
    if (!localStorage.getItem('tutorial_done')) {
        setTimeout(window.startTutorial, 2000);
    }
});