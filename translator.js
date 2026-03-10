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

    // ─── UI Strings ─────────────────────────
    const ui = {
        placeholderES: "Escribe o pega tu texto aquí...",
        placeholderEN: "Write or paste your English text here...",
        resultPlaceholder: "La traducción aparecerá aquí...",
        copied: "¡Copiado!",
        listening: "Escuchando...",
        errorTranslation: "Error en la traducción. Intente de nuevo.",
        errorMic: "Error con el micrófono: ",
        errorNoMic: "Tu navegador no soporta reconocimiento de voz."
    };

    // ─── Character Count ────────────────────
    inputText.addEventListener('input', () => {
        const len = inputText.value.length;
        charCount.textContent = `${len} caracteres`;

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
        inputText.value = '';
        charCount.textContent = '0 caracteres';
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
        } catch (e) {
            console.error(e);
            outputText.textContent = ui.errorTranslation;
            outputText.classList.remove('empty');
        }

        setLoading(false);
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
});
