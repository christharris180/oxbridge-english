// ==========================================
// TRANSLATOR FUNCTIONALITY
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // ─── DOM Elements ────────────────────────
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const speakBtn = document.getElementById('speak-btn');
    const recordBtn = document.getElementById('record-btn');
    const langRadios = document.querySelectorAll('input[name="lang-dir"]');
    const optionEsEn = document.getElementById('option-es-en');
    const optionEnEs = document.getElementById('option-en-es');
    const charCount = document.getElementById('char-count');
    const loadingShimmer = document.getElementById('loading-shimmer');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // ─── State ──────────────────────────────
    let isSpanishToEnglish = true;
    let isRecording = false;
    let debounceTimer = null;
    let saveToHistoryTimer = null;
    let lastTranslation = { text: '', result: '', direction: '' };

    // ─── UI Strings ─────────────────────────
    const ui = {
        placeholderES: "Escribe o pega tu texto aquí...",
        placeholderEN: "Write or paste your English text here...",
        resultPlaceholder: "La traducción aparecerá aquí...",
        copied: "¡Copiado!",
        listening: "Escuchando...",
        errorTranslation: "Error en la traducción. Intente de nuevo.",
        errorMic: "Error con el micrófono: ",
        errorNoMic: "Tu navegador no soporta reconocimiento de voz.",
        charactersES: "caracteres",
        charactersEN: "characters"
    };
    
    // Get current language
    function getCurrentLanguage() {
        return localStorage.getItem('preferredLanguage') || 'en';
    }

    // ─── Character Count ────────────────────
    inputText.addEventListener('input', () => {
        const len = inputText.value.length;
        const lang = getCurrentLanguage();
        const charText = lang === 'es' ? ui.charactersES : ui.charactersEN;
        charCount.textContent = `${len} ${charText}`;

        clearBtn.classList.toggle('hidden', len === 0);
        autoGrow();

        clearTimeout(debounceTimer);
        if (inputText.value.trim().length > 0) {
            debounceTimer = setTimeout(() => {
                doTranslation();
            }, 600);
        } else {
            outputText.textContent = ui.resultPlaceholder;
            outputText.classList.add('empty');
        }
    });

    // ─── Auto-grow Textarea ─────────────────
    function autoGrow() {
        inputText.style.height = 'auto';
        const maxH = 300;
        inputText.style.height = Math.min(inputText.scrollHeight, maxH) + 'px';
    }

    // ─── Clear Button ───────────────────────
    clearBtn.addEventListener('click', () => {
        // Save current translation before clearing (if exists and timer is active)
        if (saveToHistoryTimer && lastTranslation.text && lastTranslation.result) {
            clearTimeout(saveToHistoryTimer);
            saveToHistory(lastTranslation.text, lastTranslation.result, lastTranslation.direction);
            lastTranslation = { text: '', result: '', direction: '' };
        }
        
        inputText.value = '';
        const lang = getCurrentLanguage();
        const charText = lang === 'es' ? ui.charactersES : ui.charactersEN;
        charCount.textContent = `0 ${charText}`;
        clearBtn.classList.add('hidden');
        outputText.textContent = ui.resultPlaceholder;
        outputText.classList.add('empty');
        inputText.style.height = 'auto';
        inputText.focus();
    });

    // ─── Language Direction ─────────────────
    langRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            isSpanishToEnglish = e.target.value === 'es-en';

            optionEsEn.classList.toggle('active', isSpanishToEnglish);
            optionEnEs.classList.toggle('active', !isSpanishToEnglish);

            inputText.placeholder = isSpanishToEnglish ? ui.placeholderES : ui.placeholderEN;

            if (inputText.value.trim().length > 0) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => doTranslation(), 300);
            }
        });
    });

    // ─── Translation Logic ──────────────────
    async function doTranslation() {
        const text = inputText.value.trim();
        if (!text) {
            outputText.textContent = ui.resultPlaceholder;
            outputText.classList.add('empty');
            return;
        }

        setLoading(true);

        try {
            let result;
            if (isSpanishToEnglish) {
                result = await translateText(text, 'es', 'en');
            } else {
                result = await translateText(text, 'en', 'es');
            }
            outputText.textContent = result;
            outputText.classList.remove('empty');
            
            // Store the translation temporarily
            lastTranslation = {
                text: text,
                result: result,
                direction: isSpanishToEnglish ? 'es-en' : 'en-es'
            };
            
            // Clear any existing save timer
            if (saveToHistoryTimer) {
                clearTimeout(saveToHistoryTimer);
            }
            
            // Schedule save after 10 seconds of no typing
            saveToHistoryTimer = setTimeout(() => {
                if (lastTranslation.text && lastTranslation.result) {
                    saveToHistory(lastTranslation.text, lastTranslation.result, lastTranslation.direction);
                }
            }, 10000); // 10 seconds
            
        } catch (e) {
            console.error(e);
            outputText.textContent = ui.errorTranslation;
            outputText.classList.remove('empty');
        }

        setLoading(false);
    }
    
    // ─── Save Translation to History ────────
    function saveToHistory(original, translation, direction) {
        try {
            const originalTrimmed = original.trim();
            const translationTrimmed = translation.trim();
            
            // Validation 1: Minimum length (at least 2 characters)
            const hasMinLength = originalTrimmed.length >= 2 && translationTrimmed.length >= 2;
            
            // Validation 2: Must contain letters (not just symbols/numbers)
            const hasLetters = /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(originalTrimmed) && /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(translationTrimmed);
            
            // Validation 3: Don't save if translation is identical to original
            if (originalTrimmed.toLowerCase() === translationTrimmed.toLowerCase()) {
                return;
            }
            
            // Validation 4: Check for incomplete phrases (ends with ellipsis, trailing comma, etc.)
            const incompletePatterns = /(\.\.\.|…|,$|;$|\s-$|\s–$)$/;
            if (incompletePatterns.test(originalTrimmed) || incompletePatterns.test(translationTrimmed)) {
                return;
            }
            
            // Validation 5: Reject if too many consecutive dots or strange characters
            const tooManyDots = /\.{2,}/;
            if (tooManyDots.test(originalTrimmed) || tooManyDots.test(translationTrimmed)) {
                return;
            }
            
            // Validation 6: Reject if it's just a single character (unless it's a valid word like "I" or "a")
            const validSingleChars = /^[iIaAyY]$/;
            if (originalTrimmed.length === 1 && !validSingleChars.test(originalTrimmed)) {
                return;
            }
            if (translationTrimmed.length === 1 && !validSingleChars.test(translationTrimmed)) {
                return;
            }
            
            // Validation 7: Reject error messages or incomplete translations
            const errorPatterns = /(error|failed|could not|unable to|translating|loading)/i;
            if (errorPatterns.test(translationTrimmed)) {
                return;
            }
            
            // Don't save if validation fails
            if (!hasMinLength || !hasLetters) {
                return;
            }
            
            let history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
            
            // Check if this exact translation already exists in recent history (last 20)
            const isDuplicate = history.slice(0, 20).some(item => 
                item.original.toLowerCase() === originalTrimmed.toLowerCase() &&
                item.translation.toLowerCase() === translationTrimmed.toLowerCase()
            );
            
            if (isDuplicate) {
                return; // Don't save duplicates
            }
            
            // Add new translation
            history.unshift({
                original: originalTrimmed,
                translation: translationTrimmed,
                direction: direction,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            });
            
            // Keep only last 100 translations
            if (history.length > 100) {
                history = history.slice(0, 100);
            }
            
            localStorage.setItem('translationHistory', JSON.stringify(history));
        } catch (e) {
            console.error('Error saving to history:', e);
        }
    }

    // ─── MyMemory API ───────────────────────
    async function translateText(text, fromLang, toLang) {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.responseData) {
            return data.responseData.translatedText;
        }
        throw new Error("Invalid response from translation API");
    }

    // ─── Loading State ──────────────────────
    function setLoading(isLoading) {
        if (isLoading) {
            loadingShimmer.classList.remove('hidden');
            outputText.classList.add('hidden');
        } else {
            loadingShimmer.classList.add('hidden');
            outputText.classList.remove('hidden');
        }
    }

    // ─── Copy Action ────────────────────────
    copyBtn.addEventListener('click', () => {
        const text = outputText.textContent;
        if (!text || text === ui.resultPlaceholder) return;

        navigator.clipboard.writeText(text).then(() => {
            showToast(ui.copied);
        });
    });

    // ─── Toast ──────────────────────────────
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 400);
        }, 2000);
    }

    // ─── Speak Action (TTS) - AUDIO BUTTON ─────────────────────
    speakBtn.addEventListener('click', () => {
        const text = outputText.textContent;
        if (!text || text === ui.resultPlaceholder) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create utterance with the translated text
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isSpanishToEnglish ? 'en-US' : 'es-ES';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        
        // Speak the translation
        window.speechSynthesis.speak(utterance);
    });

    // ─── Speech Recognition (Voice Input) ───────
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            recordBtn.classList.add('recording');
            inputText.placeholder = ui.listening;
        };

        recognition.onend = () => {
            isRecording = false;
            recordBtn.classList.remove('recording');
            inputText.placeholder = isSpanishToEnglish ? ui.placeholderES : ui.placeholderEN;
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputText.value = transcript;
            charCount.textContent = `${transcript.length} caracteres`;
            clearBtn.classList.remove('hidden');
            autoGrow();

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => doTranslation(), 300);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            isRecording = false;
            recordBtn.classList.remove('recording');
            showToast(ui.errorMic + event.error);
        };
    } else {
        recordBtn.classList.add('hidden');
        console.warn("Speech Recognition not supported in this browser.");
    }

    recordBtn.addEventListener('click', () => {
        if (!recognition) {
            showToast(ui.errorNoMic);
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            recognition.lang = isSpanishToEnglish ? 'es-ES' : 'en-US';
            try {
                recognition.start();
            } catch (err) {
                console.error("Error starting recognition:", err);
            }
        }
    });
    
    // ─── Initialize character count on load ─────
    const lang = getCurrentLanguage();
    const charText = lang === 'es' ? ui.charactersES : ui.charactersEN;
    charCount.textContent = `0 ${charText}`;
    
    // ─── Save on page leave ─────────────────
    window.addEventListener('beforeunload', () => {
        if (saveToHistoryTimer && lastTranslation.text && lastTranslation.result) {
            clearTimeout(saveToHistoryTimer);
            saveToHistory(lastTranslation.text, lastTranslation.result, lastTranslation.direction);
        }
    });
});
