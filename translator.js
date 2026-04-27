/**
 * SmarTranslator - Unified Web & App Logic (Fixed Direction & Mic)
 */

let isSpanishToEnglish = true;
let debounceTimer = null;
let uiLang = localStorage.getItem('preferredLanguage') || 'en';

// ==========================================
// 1. CORE TRANSLATOR LOGIC
// ==========================================
async function doTranslation() {
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    if (!inputText || !outputText) return;

    const text = inputText.value.trim();
    if (!text) {
        outputText.textContent = uiLang === 'es' ? "La traducción aparecerá aquí..." : "Translation will appear here...";
        return;
    }

    try {
        const from = isSpanishToEnglish ? 'es' : 'en';
        const to = isSpanishToEnglish ? 'en' : 'es';
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${from}&tl=${to}&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        const translation = data[0].map(item => item[0]).join('').trim();
        
        // Render translation
        outputText.innerHTML = translation; 
        outputText.classList.remove('empty');
    } catch (e) {
        outputText.textContent = "Error";
    }
}

// ==========================================
// 2. VOICE INPUT (MIC)
// ==========================================
async function toggleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Mic not supported in this browser mode.");
        return;
    }

    const recognition = new SpeechRecognition();
    // CRITICAL: Match mic language to selection
    recognition.lang = isSpanishToEnglish ? 'es-ES' : 'en-US';
    const recordBtn = document.getElementById('record-btn');

    recognition.onstart = () => {
        if(recordBtn) recordBtn.innerHTML = '<i class="fas fa-circle" style="color:red"></i> ...';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('input-text').value = transcript;
        doTranslation();
    };

    recognition.onend = () => {
        if(recordBtn) recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
    };

    recognition.onerror = (e) => {
        if(e.error === 'network') {
            alert("Brave/Vivaldi blocked the Google Mic. Please enable 'Google Speech Services' in browser settings.");
        }
    };

    recognition.start();
}

// ==========================================
// 3. NEW FEATURE ACTIONS (COPY/CLEAR)
// ==========================================
function copyTranslation() {
    const text = document.getElementById('output-text').textContent;
    if(text.includes("...")) return;
    navigator.clipboard.writeText(text).then(() => alert("Copiado / Copied"));
}

function clearInput() {
    document.getElementById('input-text').value = '';
    document.getElementById('output-text').textContent = "La traducción aparecerá aquí...";
}

// ==========================================
// 4. INITIALIZATION (The "English to Espanol" Fix)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const recordBtn = document.getElementById('record-btn');
    const speakBtn = document.getElementById('speak-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    // FIX: Direction Radios
    const langRadios = document.getElementsByName('lang-dir');

    if(recordBtn) recordBtn.onclick = toggleMic;
    if(speakBtn) speakBtn.onclick = () => {
        const text = document.getElementById('output-text').textContent;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = isSpanishToEnglish ? 'en-US' : 'es-ES';
        window.speechSynthesis.speak(utter);
    };

    if(copyBtn) copyBtn.onclick = copyTranslation;
    if(clearBtn) clearBtn.onclick = clearInput;

    if(inputText) {
        inputText.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doTranslation, 800);
        };
    }

    // FIX FOR DIRECTION BUTTONS
    langRadios.forEach(radio => {
        radio.onclick = (e) => {
            isSpanishToEnglish = (e.target.value === 'es-en');
            // Update placeholder to show it changed
            inputText.placeholder = isSpanishToEnglish ? "Escribe aquí..." : "Type here...";
            doTranslation();
        };
    });
});