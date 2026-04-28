/**
 * SmarTranslator - Unified Web Logic
 * Includes: Translation, Voice, Cloud Sync, Session IDs, and Interactive Dictionary Modal
 */

let isSpanishToEnglish = true;
let debounceTimer = null;
let uiLang = localStorage.getItem('preferredLanguage') || 'en';
let currentTranslationSessionId = Date.now().toString();

// ==========================================
// 1. CORE TRANSLATOR LOGIC
// ==========================================

// Helper: Escape HTML to prevent injection
window.escHtml = function(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};

// Helper: Wrap words in clickable spans
window.makeTextClickable = function(text, targetLang) {
    const parts = text.split(/([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*)/);
    let html = '';
    parts.forEach(part => {
        if (/^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+(?:[-'][a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+)*$/.test(part)) {
            const cleanWord = part.replace(/'/g, "\\'");
            html += `<span class="clickable-word" onclick="window.openWordModal('${cleanWord}', '${targetLang}')">${part}</span>`;
        } else {
            html += window.escHtml(part);
        }
    });
    return html;
};

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
        
        // Render as clickable words
        outputText.innerHTML = window.makeTextClickable(translation, to); 
        outputText.classList.remove('empty');
        
        // Save to History
        saveToHistory(text, translation, isSpanishToEnglish ? 'es-en' : 'en-es');
    } catch (e) {
        outputText.textContent = "Error";
    }
}

async function saveToHistory(original, translation, direction) {
    if (original.trim().toLowerCase() === translation.trim().toLowerCase()) return;
    
    let history = JSON.parse(localStorage.getItem('app_history') || '[]');
    
    // Check if we are continuing the exact same typing session
    if (history.length > 0 && history[0].sessionId === currentTranslationSessionId) {
        history[0].original = original;
        history[0].translation = translation;
        history[0].timestamp = Date.now();
    } else {
        // Prevent exact duplicates
        if (history.length > 0 && history[0].original.toLowerCase() === original.toLowerCase()) return;
        
        // Create brand new entry
        const newItem = { original, translation, dir: direction, timestamp: Date.now(), sessionId: currentTranslationSessionId, mastery: 0 };
        history.unshift(newItem);
    }
    
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem('app_history', JSON.stringify(history));

    // Push to Firebase Cloud if Logged In
    if (window.cloudDb && window.userUid) {
        try {
            const docId = `${window.userUid}_${currentTranslationSessionId}`;
            await window.cloudSetDoc(window.cloudDoc(window.cloudDb, "translations_history", docId), {
                userId: window.userUid,
                originalText: original,
                translatedText: translation,
                languageDirection: direction,
                sessionId: currentTranslationSessionId,
                timestamp: Date.now(),
                mastery: history[0].mastery || 0
            }, { merge: true });
        } catch (e) { console.error("Cloud Sync Failed", e); }
    }
}

window.syncCloudHistory = async function() {
    if (!window.userUid || !window.cloudDb) return;

    try {
        console.log("Starting cloud download for user:", window.userUid);
        const q = window.cloudQuery(
            window.cloudCollection(window.cloudDb, "translations_history"),
            window.cloudWhere("userId", "==", window.userUid)
        );

        const querySnapshot = await window.cloudGetDocs(q);
        let cloudData = [];
        
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            
            // Handle Android Timestamps vs Web Numbers safely
            let timeMs = Date.now();
            if (data.timestamp) {
                if (typeof data.timestamp.toMillis === 'function') {
                    timeMs = data.timestamp.toMillis();
                } else if (typeof data.timestamp === 'number') {
                    timeMs = data.timestamp;
                }
            }

            cloudData.push({
                original: data.originalText || "",
                translation: data.translatedText || "",
                dir: data.languageDirection || "es-en",
                sessionId: data.sessionId || doc.id.split('_')[1],
                mastery: data.mastery || 0, 
                timestamp: timeMs
            });
        });

        console.log(`Downloaded ${cloudData.length} records from cloud.`);

        // Sort works properly now that all timestamps are converted to numbers
        cloudData.sort((a, b) => b.timestamp - a.timestamp);
        if (cloudData.length > 100) cloudData = cloudData.slice(0, 100);

        if (cloudData.length > 0) {
            localStorage.setItem('app_history', JSON.stringify(cloudData));
            console.log("History successfully synced and saved locally!");
        }
    } catch (error) {
        console.error("Sync Down Failed", error);
    }
};

// ==========================================
// 2. DICTIONARY MODAL LOGIC
// ==========================================

window.openWordModal = async function(word, langCode) {
    document.activeElement.blur();
    document.getElementById('word-modal-title').textContent = word;
    document.getElementById('word-modal-body').innerHTML = '<div style="text-align:center; padding: 20px;"><div class="loading-dots"><span></span><span></span><span></span></div></div>';
    document.getElementById('word-modal').classList.add('active');

    try {
        const url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=md&dt=ss&sl=" + langCode + "&tl=" + langCode + "&q=" + encodeURIComponent(word);
        const res = await fetch(url);
        const data = await res.json();
        let finalData = window.parseGoogleDict(data, word);
        const sourceLang = isSpanishToEnglish ? 'es' : 'en';
        if (langCode !== sourceLang) finalData = await window.bulkTranslateDefinitions(finalData, langCode, sourceLang);
        window.renderModalDictResults(finalData, langCode, 'word-modal-body');
    } catch(e) {
        document.getElementById('word-modal-body').innerHTML = `<div style='text-align:center; padding:20px; font-size:18px;'>${uiLang === 'es' ? 'No se encontraron definiciones.' : 'No definitions found.'}</div>`;
    }
};

window.closeWordModal = function(e) {
    if (e) e.stopPropagation();
    document.getElementById('word-modal').classList.remove('active');
};

window.parseGoogleDict = function(data, word) {
    const defsArray = data[12];
    if (!defsArray) throw new Error('Not found');
    const meanings = defsArray.map(posGroup => {
        return {
            partOfSpeech: posGroup[0] || 'Definición',
            definitions: (posGroup[1] || []).map(d => ({ definition: d[0] || '', example: (typeof d[2] === 'string' && d[2].includes(' ')) ? d[2] : '' })).filter(d => d.definition)
        };
    });
    return { word: word, meanings: meanings };
};

window.bulkTranslateDefinitions = async function(finalData, fromLang, toLang) {
    let textsToTranslate = [];
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
            const url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + fromLang + "&tl=" + toLang + "&q=" + encodeURIComponent(joinedText);
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
        } catch (e) {}
    }
    return finalData;
};

window.renderModalDictResults = function(data, langCode, targetId) {
    let html = `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(26,26,62,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                  <h2 style="color:#1a1a3e; font-size:26px; text-transform:capitalize; margin:0;">${window.escHtml(data.word)}</h2>
                  <button style="background:none; border:none; font-size:28px; cursor:pointer; color:#D4AF37;" onclick="window.playDictAudio('${window.escHtml(data.word).replace(/'/g, "\\'")}', '${langCode}')">🔊</button>
                </div>`;

    data.meanings.forEach(m => {
        html += `<h4 style="color:#9e7a0e; font-size:16px; margin:10px 0 5px; font-style:italic;">${window.escHtml(m.partOfSpeech)} ${m.partOfSpeechTranslated ? `<span style="color:#666; font-size:14px;">(${window.escHtml(m.partOfSpeechTranslated)})</span>` : ''}</h4>`;
        m.definitions.slice(0,2).forEach(d => {
            html += `<div style="margin-bottom:12px;">
                        <p style="color:#1a1a3e; font-size:16px; margin-bottom:2px;"><strong>-</strong> ${window.escHtml(d.definition)}</p>`;
            if (d.definitionTranslated) html += `<p style="color:#4a4a6a; font-size:14px; margin-bottom:4px; padding-left:10px;"><em>${window.escHtml(d.definitionTranslated)}</em></p>`;
            if (d.example) html += `<p style="color:rgba(26,26,62,0.7); font-size:14px; font-style:italic; margin-bottom:2px; border-left:2px solid #C9A227; padding-left:8px; margin-left:10px;">"${window.escHtml(d.example)}"</p>`;
            if (d.exampleTranslated) html += `<p style="color:rgba(26,26,62,0.5); font-size:13px; font-style:italic; margin-bottom:8px; border-left:2px solid rgba(201,162,39,0.5); padding-left:8px; margin-left:10px;">"${window.escHtml(d.exampleTranslated)}"</p>`;
            html += `</div>`;
        });
    });
    document.getElementById(targetId).innerHTML = html;
};

window.playDictAudio = function(word, langCode) {
    const audioUrl = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" + langCode + "&q=" + encodeURIComponent(word);
    const player = document.getElementById('tts-player');
    if(player) {
        player.pause();
        player.src = audioUrl;
        player.load();
        player.play().catch(e => { console.log("Audio play prevented", e); });
    }
};

// ==========================================
// 3. VOICE INPUT (MIC)
// ==========================================
async function toggleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Mic not supported in this browser mode.");
        return;
    }

    const recognition = new SpeechRecognition();
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
        if(recordBtn) recordBtn.innerHTML = '<i class="fas fa-microphone"></i> ' + (uiLang === 'es' ? 'Voz' : 'Voice');
    };

    recognition.start();
}

// ==========================================
// 4. COPY & CLEAR
// ==========================================
function copyTranslation() {
    const text = document.getElementById('output-text').textContent;
    if(text.includes("...")) return;
    navigator.clipboard.writeText(text).then(() => alert(uiLang === 'es' ? "¡Copiado!" : "Copied!"));
}

function clearInput() {
    document.getElementById('input-text').value = '';
    document.getElementById('output-text').textContent = uiLang === 'es' ? "La traducción aparecerá aquí..." : "Translation will appear here...";
    currentTranslationSessionId = Date.now().toString(); // Reset Session ID on clear
}

// ==========================================
// 5. TUTORIAL LOGIC
// ==========================================
let currentTourStep = 0;
const tourSteps = [
    { target: null, es: "¡Bienvenido al SmarTraductor de Oxbridge English!", en: "Welcome to the Oxbridge English SmarTranslator!" },
    { target: 'lang-dir-selector', es: "1. Elige la dirección de la traducción aquí.", en: "1. Choose the translation direction here." },
    { target: 'input-text', es: "2. Escribe aquí el texto que deseas traducir.", en: "2. Write the text you want to translate here." },
    { target: 'record-btn', es: "3. O pulsa aquí para grabar audio.", en: "3. Or tap here to record audio." },
    { target: 'output-text', es: "4. Lee tu traducción aquí. (¡Toca cualquier palabra para ver el diccionario interactivo!)", en: "4. Read your translation here. (Tap any word for an interactive dictionary!)" },
    { target: 'speak-btn', es: "5. Escucha la pronunciación de la traducción.", en: "5. Listen to the translation." },
    { target: 'nav-profile', es: "6. ¡Inicia sesión aquí para guardar tus traducciones en la nube y no perderlas nunca!", en: "6. Log in here to save your translations to the cloud and never lose them!" },
    { target: 'nav-history', es: "7. Revisa todas tus traducciones. Puedes escucharlas de nuevo o eliminar las que ya no necesites.", en: "7. Review all your translations. You can listen to them again or delete the ones you no longer need." },
    { target: 'nav-quiz', es: "8. ¡La joya de la corona! Un motor de aprendizaje de 5 modos que usa tus propias traducciones. Practica lectura, escucha, pronunciación, gramática y memoria.", en: "8. The crown jewel! A 5-mode learning engine using your own translations. Practice reading, listening, pronunciation, grammar, and memory." },
    { target: 'nav-dictionary', es: "9. Busca definiciones detalladas, ejemplos de uso y escucha la pronunciación de cualquier palabra en el Diccionario.", en: "9. Search for detailed definitions, usage examples, and listen to the pronunciation of any word in the Dictionary." },
    { target: 'promo-banner', es: "10. ¡Haz clic aquí para obtener información sobre nuestros cursos!", en: "10. Click here for information about our courses!" },
    { target: 'nav-help', es: "Si necesitas ver este tutorial de nuevo, ¡toca este ícono en cualquier momento!", en: "If you need to see this tutorial again, tap this icon anytime!" }
];

window.startTutorial = function() {
    currentTourStep = 0;
    document.getElementById('tour-backdrop').classList.add('active');
    document.getElementById('tour-bubble').classList.add('active');
    renderTourStep();
};

window.endTutorial = function() {
    document.getElementById('tour-backdrop').classList.remove('active');
    document.getElementById('tour-bubble').classList.remove('active');
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    localStorage.setItem('tutorial_done', 'true');
};

window.nextTourStep = function() {
    currentTourStep++;
    if (currentTourStep >= tourSteps.length) {
        window.endTutorial();
    } else {
        renderTourStep();
    }
};

window.renderTourStep = function() {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    const step = tourSteps[currentTourStep];
    const bubble = document.getElementById('tour-bubble');

    document.getElementById('tour-text').textContent = uiLang === 'es' ? step.es : step.en;
    
    const nextBtnText = currentTourStep === tourSteps.length - 1 
        ? (uiLang === 'es' ? 'Terminar' : 'Finish') 
        : (uiLang === 'es' ? 'Siguiente' : 'Next');
    document.getElementById('tour-next-btn').textContent = nextBtnText;
    document.getElementById('tour-skip-btn').textContent = uiLang === 'es' ? 'Omitir' : 'Skip';

    if (step.target) {
        const targetEl = document.getElementById(step.target);
        if (targetEl) {
            targetEl.classList.add('tour-highlight');
            const rect = targetEl.getBoundingClientRect();
            
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            
            if (rect.top > window.innerHeight / 2) {
                bubble.style.top = (rect.top + scrollTop - 160) + 'px';
            } else {
                bubble.style.top = (rect.bottom + scrollTop + 20) + 'px';
            }
            
            bubble.style.left = '50%';
            bubble.style.transform = 'translateX(-50%)';
        }
    } else {
        bubble.style.top = '40%';
        bubble.style.left = '50%';
        bubble.style.transform = 'translate(-50%, -50%)';
    }
};

// ==========================================
// 6. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const recordBtn = document.getElementById('record-btn');
    const speakBtn = document.getElementById('speak-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const langRadios = document.getElementsByName('lang-dir');

    if(recordBtn) recordBtn.onclick = toggleMic;
    if(copyBtn) copyBtn.onclick = copyTranslation;
    if(clearBtn) clearBtn.onclick = clearInput;
    
    if(speakBtn) speakBtn.onclick = () => {
        const text = document.getElementById('output-text').textContent;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = isSpanishToEnglish ? 'en-US' : 'es-ES';
        window.speechSynthesis.speak(utter);
    };

    if(inputText) {
        inputText.oninput = () => {
            if (inputText.value.trim() === '') {
                currentTranslationSessionId = Date.now().toString(); // Reset on empty
            }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doTranslation, 800);
        };
    }

    langRadios.forEach(radio => {
        radio.onclick = (e) => {
            isSpanishToEnglish = (e.target.value === 'es-en');
            inputText.placeholder = isSpanishToEnglish ? "Escribe aquí..." : "Type here...";
            doTranslation();
        };
    });

    if (!localStorage.getItem('tutorial_done')) {
        setTimeout(window.startTutorial, 1500);
    }
});