// ==========================================
// TRANSLATOR FUNCTIONALITY
// ==========================================

function escHtml(str) { 
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}

document.addEventListener('DOMContentLoaded', function() {
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

    let isSpanishToEnglish = true;
    let isRecording = false;
    let debounceTimer = null;
    let saveToHistoryTimer = null;
    let lastTranslation = { text: '', result: '', direction: '' };
    window.currentSelectedTranslation = ''; 

    // ─── Inject Modal UI & Styles ───────────
    const style = document.createElement('style');
    style.innerHTML = `
        .clickable-word { cursor: pointer; border-bottom: 1px dashed rgba(212, 175, 55, 0.6); transition: background 0.2s, color 0.2s; border-radius: 3px; padding: 0 2px; }
        .clickable-word:hover { background: rgba(212, 175, 55, 0.15); color: #b48c0a; }
        .word-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(13,13,36,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; backdrop-filter: blur(4px); }
        .word-modal-overlay.active { opacity: 1; pointer-events: all; }
        .word-modal-content { background: #cdc89e; width: 90%; max-width: 400px; max-height: 80vh; overflow-y: auto; border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: translateY(20px); transition: transform 0.3s; }
        .word-modal-overlay.active .word-modal-content { transform: translateY(0); }
        .word-modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(26,26,62,0.1); padding-bottom: 10px; margin-bottom: 15px; }
        .word-modal-title { color: #1a1a3e; font-size: 24px; font-weight: 700; margin: 0; text-transform: capitalize; font-family: 'Work Sans', sans-serif; }
        .word-modal-close { background: none; border: none; font-size: 28px; color: #1a1a3e; cursor: pointer; line-height: 1; padding: 0; }
    `;
    document.head.appendChild(style);

    const modalHtml = `
        <div id="word-modal" class="word-modal-overlay" onclick="window.closeWordModal(event)">
            <div class="word-modal-content" onclick="event.stopPropagation()">
                <div class="word-modal-header">
                    <h3 id="word-modal-title" class="word-modal-title">Word</h3>
                    <button class="word-modal-close" onclick="window.closeWordModal(event)">&times;</button>
                </div>
                <div id="word-modal-body">Loading...</div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

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
    
    function getCurrentLanguage() { return localStorage.getItem('preferredLanguage') || 'en'; }

    inputText.addEventListener('input', () => {
        const len = inputText.value.length;
        const lang = getCurrentLanguage();
        charCount.textContent = `${len} ${lang === 'es' ? ui.charactersES : ui.charactersEN}`;
        clearBtn.classList.toggle('hidden', len === 0);
        
        inputText.style.height = 'auto';
        inputText.style.height = Math.min(inputText.scrollHeight, 300) + 'px';

        clearTimeout(debounceTimer);
        if (inputText.value.trim().length > 0) {
            debounceTimer = setTimeout(() => { doTranslation(); }, 600);
        } else {
            outputText.textContent = ui.resultPlaceholder;
            outputText.classList.add('empty');
        }
    });

    clearBtn.addEventListener('click', () => {
        if (saveToHistoryTimer && lastTranslation.text && lastTranslation.result) {
            clearTimeout(saveToHistoryTimer);
            saveToHistory(lastTranslation.text, lastTranslation.result, lastTranslation.direction);
            lastTranslation = { text: '', result: '', direction: '' };
        }
        inputText.value = '';
        charCount.textContent = `0 ${getCurrentLanguage() === 'es' ? ui.charactersES : ui.charactersEN}`;
        clearBtn.classList.add('hidden');
        outputText.textContent = ui.resultPlaceholder;
        outputText.classList.add('empty');
        inputText.style.height = 'auto';
        inputText.focus();
    });

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

    function makeTextClickable(text, targetLang) {
        const parts = text.split(/([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*)/);
        let html = '';
        parts.forEach(part => {
            if (/^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*$/.test(part)) {
                const cleanWord = part.replace(/'/g, "\\'");
                html += `<span class="clickable-word" onclick="window.openWordModal('${cleanWord}', '${targetLang}')">${part}</span>`;
            } else {
                html += escHtml(part);
            }
        });
        return html;
    }

    async function doTranslation() {
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
            if (!data || !data[0]) throw new Error("Invalid response");
            
            const translation = data[0].map(item => item[0]).join('').trim();
            window.currentSelectedTranslation = translation; 
            
            const clickableHtml = makeTextClickable(translation, toLang);
            outputText.innerHTML = `<div style="font-size: 16px; line-height: 1.6; color: #1a1a3e;">${clickableHtml}</div>`;
            outputText.classList.remove('empty');
            
            lastTranslation = { text: text, result: translation, direction: isSpanishToEnglish ? 'es-en' : 'en-es' };
            if (saveToHistoryTimer) clearTimeout(saveToHistoryTimer);
            saveToHistoryTimer = setTimeout(() => {
                if (lastTranslation.text && lastTranslation.result) saveToHistory(lastTranslation.text, lastTranslation.result, lastTranslation.direction);
            }, 10000); 
            
        } catch (e) {
            outputText.textContent = ui.errorTranslation;
            outputText.classList.remove('empty');
        }
        loadingShimmer.classList.add('hidden');
        outputText.classList.remove('hidden');
    }
    
    function saveToHistory(original, translation, direction) {
        try {
            const originalTrimmed = original.trim();
            const translationTrimmed = translation.trim();
            if (originalTrimmed.length < 2 || translationTrimmed.length < 2) return;
            if (!/[a-zA-Záéíóúñ]/.test(originalTrimmed) || !/[a-zA-Z]/.test(translationTrimmed)) return;
            if (originalTrimmed.toLowerCase() === translationTrimmed.toLowerCase()) return;
            if (/(\.\.\.|…|,$|;$|\s-$|\s–$)$/.test(originalTrimmed)) return;
            
            let history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
            if (history.slice(0, 20).some(item => item.original.toLowerCase() === originalTrimmed.toLowerCase())) return; 
            
            history.unshift({
                original: originalTrimmed, translation: translationTrimmed, direction: direction,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            });
            if (history.length > 100) history = history.slice(0, 100);
            localStorage.setItem('translationHistory', JSON.stringify(history));
        } catch (e) {}
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toast.classList.add('hidden'); }, 400);
        }, 2000);
    }

    copyBtn.addEventListener('click', () => {
        const text = window.currentSelectedTranslation || outputText.textContent;
        if (!text || text === ui.resultPlaceholder) return;
        navigator.clipboard.writeText(text).then(() => { showToast(ui.copied); });
    });

    speakBtn.addEventListener('click', () => {
        const text = window.currentSelectedTranslation || outputText.textContent;
        if (!text || text === ui.resultPlaceholder) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isSpanishToEnglish ? 'en-US' : 'es-ES';
        utterance.rate = 0.9; 
        window.speechSynthesis.speak(utterance);
    });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => { isRecording = true; recordBtn.classList.add('recording'); inputText.placeholder = ui.listening; };
        recognition.onend = () => { isRecording = false; recordBtn.classList.remove('recording'); inputText.placeholder = isSpanishToEnglish ? ui.placeholderES : ui.placeholderEN; };
        recognition.onresult = (event) => {
            inputText.value = event.results[0][0].transcript;
            charCount.textContent = `${inputText.value.length} caracteres`;
            clearBtn.classList.remove('hidden');
            inputText.style.height = 'auto';
            inputText.style.height = Math.min(inputText.scrollHeight, 300) + 'px';
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => doTranslation(), 300);
        };
        recognition.onerror = (event) => { isRecording = false; recordBtn.classList.remove('recording'); showToast(ui.errorMic + event.error); };
    } else {
        recordBtn.classList.add('hidden');
    }

    recordBtn.addEventListener('click', () => {
        if (!recognition) { showToast(ui.errorNoMic); return; }
        if (isRecording) { recognition.stop(); } 
        else {
            recognition.lang = isSpanishToEnglish ? 'es-ES' : 'en-US';
            try { recognition.start(); } catch (err) {}
        }
    });
    
    charCount.textContent = `0 ${getCurrentLanguage() === 'es' ? ui.charactersES : ui.charactersEN}`;
    
    window.addEventListener('beforeunload', () => {
        if (saveToHistoryTimer && lastTranslation.text && lastTranslation.result) {
            clearTimeout(saveToHistoryTimer);
            saveToHistory(lastTranslation.text, lastTranslation.result, lastTranslation.direction);
        }
    });

    // ─── Modal Bilingual Dictionary Engine ────────────────
    window.openWordModal = async function(word, langCode) {
        const modal = document.getElementById('word-modal');
        const title = document.getElementById('word-modal-title');
        const body = document.getElementById('word-modal-body');
        const uiLang = getCurrentLanguage();

        title.textContent = word;
        body.innerHTML = '<div style="text-align:center; padding: 20px;"><div class="loading-dots" style="display:inline-flex; gap:5px;"><span style="width:7px; height:7px; background:#D4AF37; border-radius:50%; animation:bounce 1s infinite;"></span><span style="width:7px; height:7px; background:#D4AF37; border-radius:50%; animation:bounce 1s infinite 0.15s;"></span><span style="width:7px; height:7px; background:#D4AF37; border-radius:50%; animation:bounce 1s infinite 0.3s;"></span></div></div>';
        modal.classList.add('active');

        try {
            let finalData = null;
            if (langCode === 'en') {
                try {
                    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
                    if (!res.ok) throw new Error('Not found');
                    finalData = (await res.json())[0];
                } catch (e) {
                    finalData = await fetchGoogleDictionary(word, 'en');
                }
            } else {
                finalData = await fetchGoogleDictionary(word, 'es');
            }

            // BILINGUAL BULK TRANSLATOR INJECTION
            if (langCode !== uiLang) {
                let textsToTranslate = [];
                // Strip native newlines so our \n separator works perfectly
                finalData.meanings.forEach(m => {
                    textsToTranslate.push((m.partOfSpeech || '').replace(/\n/g, ' '));
                    m.definitions.slice(0, 2).forEach(d => {
                        textsToTranslate.push((d.definition || '').replace(/\n/g, ' '));
                        if (d.example) textsToTranslate.push(d.example.replace(/\n/g, ' '));
                    });
                });

                if (textsToTranslate.length > 0) {
                    try {
                        const joinedText = textsToTranslate.join('\n');
                        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${langCode}&tl=${uiLang}&q=${encodeURIComponent(joinedText)}`;
                        const res = await fetch(url);
                        const tData = await res.json();
                        const translatedString = tData[0].map(item => item[0]).join('');
                        const translatedArray = translatedString.split('\n').map(t => t.trim());

                        let tIndex = 0;
                        finalData.meanings.forEach(m => {
                            m.partOfSpeechTranslated = translatedArray[tIndex++] || '';
                            m.definitions.slice(0, 2).forEach(d => {
                                d.definitionTranslated = translatedArray[tIndex++] || '';
                                if (d.example) d.exampleTranslated = translatedArray[tIndex++] || '';
                            });
                        });
                    } catch (e) { console.error("Bilingual translation failed", e); }
                }
            }

            renderModalDictResults(finalData, langCode);
        } catch (err) {
            body.innerHTML = `<div style="text-align:center; padding: 20px; color: #ff6060;">Definition not found.</div>`;
        }
    };

    window.closeWordModal = function(e) {
        if (e) e.stopPropagation();
        document.getElementById('word-modal').classList.remove('active');
    };

    function renderModalDictResults(data, langCode) {
        const body = document.getElementById('word-modal-body');
        let audioUrl = '';
        if(data.phonetics) {
            const p = data.phonetics.find(x => x.audio);
            if(p) audioUrl = p.audio;
        }

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(26,26,62,0.1); padding-bottom: 10px; margin-bottom: 10px;">
                <h2 style="color: #1a1a3e; font-size: 22px; margin: 0; text-transform: capitalize; font-family: 'Work Sans', sans-serif;">${escHtml(data.word)}</h2>
                <button style="background: none; border: none; font-size: 20px; cursor: pointer; color: #D4AF37;" onclick="window.playDictAudio('${audioUrl}', '${escHtml(data.word).replace(/'/g, "\\'")}', '${langCode}')">🔊</button>
            </div>
        `;

        data.meanings.forEach(m => {
            html += `<h4 style="color: #9e7a0e; font-size: 14px; margin: 10px 0 5px; font-style: italic; text-transform: lowercase;">
                        ${escHtml(m.partOfSpeech)} ${m.partOfSpeechTranslated ? `<span style="color:#666; font-size:12px;">(${escHtml(m.partOfSpeechTranslated)})</span>` : ''}
                     </h4>`;
            
            m.definitions.slice(0, 2).forEach((def, i) => {
                html += `<div style="margin-bottom: 12px;">
                            <p style="color: #1a1a3e; font-size: 14px; margin-bottom: 2px; line-height: 1.3;"><strong>${i+1}.</strong> ${escHtml(def.definition)}</p>`;
                
                if (def.definitionTranslated) {
                    html += `<p style="color: #4a4a6a; font-size: 13px; margin-bottom: 4px; line-height: 1.3; padding-left: 14px;"><em>${escHtml(def.definitionTranslated)}</em></p>`;
                }
                
                if (def.example) {
                    html += `<p style="color: rgba(26,26,62,0.7); font-size: 13px; font-style: italic; margin-bottom: 2px; border-left: 2px solid #C9A227; padding-left: 8px; margin-left: 14px;">"${escHtml(def.example)}"</p>`;
                }
                
                if (def.exampleTranslated) {
                    html += `<p style="color: rgba(26,26,62,0.5); font-size: 12px; font-style: italic; margin-bottom: 8px; border-left: 2px solid rgba(201,162,39,0.5); padding-left: 8px; margin-left: 14px;">"${escHtml(def.exampleTranslated)}"</p>`;
                }
                html += `</div>`;
            });
        });
        body.innerHTML = html;
    }

    async function fetchGoogleDictionary(word, lang) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=md&dt=ss&sl=${lang}&tl=${lang}&q=${encodeURIComponent(word)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        const defsArray = data[12];
        if (!defsArray) throw new Error('Not found');
        
        const meanings = defsArray.map(posGroup => {
            const partOfSpeech = posGroup[0] || 'Definición';
            const defs = (posGroup[1] || []).map(d => {
                let defStr = d[0] || '';
                let exStr = '';
                if (typeof d[2] === 'string' && d[2].includes(' ')) exStr = d[2];
                else if (typeof d[1] === 'string' && d[1].includes(' ')) exStr = d[1];
                return { definition: defStr, example: exStr };
            }).filter(d => d.definition);
            return { partOfSpeech, definitions: defs, synonyms: [] };
        });
        return { word: (defsArray[0] && defsArray[0][2]) ? defsArray[0][2] : word, phonetics: [], meanings: meanings };
    }

    window.playDictAudio = function(url, word, langCode) {
        if (url) { new Audio(url).play(); } 
        else {
            try {
                const utter = new SpeechSynthesisUtterance(word);
                utter.lang = langCode === 'es' ? 'es-ES' : 'en-GB';
                window.speechSynthesis.speak(utter);
            } catch(e) {}
        }
    }
});