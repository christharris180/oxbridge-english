// Quiz state
let quizData = [];
let currentQuestion = 0;
let score = 0;
let userAnswers = [];

// Initialize quiz on page load
document.addEventListener('DOMContentLoaded', function() {
    checkHistory();
});

function checkHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
        const countElem = document.getElementById('history-count');
        
        if (history.length < 10) {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('no-history-screen').style.display = 'block';
            if (countElem) {
                countElem.textContent = `You have ${history.length} translation${history.length !== 1 ? 's' : ''}. Need at least 10.`;
            }
        } else {
            if (countElem) {
                countElem.textContent = `${history.length} translations available in your history.`;
            }
        }
    } catch (e) {
        console.error('Error checking history:', e);
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('no-history-screen').style.display = 'block';
    }
}

function startQuiz() {
    try {
        const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
        
        if (history.length < 10) {
            alert('You need at least 10 translations to take the quiz!');
            return;
        }
        
        // Generate 10 random questions from history
        quizData = generateQuestions(history);
        currentQuestion = 0;
        score = 0;
        userAnswers = [];
        
        // Show quiz screen
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('no-history-screen').style.display = 'none';
        document.getElementById('results-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';
        
        displayQuestion();
    } catch (e) {
        console.error('Error starting quiz:', e);
        alert('Error starting quiz. Please try again.');
    }
}

function generateQuestions(history) {
    const questions = [];
    const usedIndices = new Set();
    
    // Shuffle history
    const shuffled = [...history].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(10, shuffled.length); i++) {
        const item = shuffled[i];
        const questionType = Math.random() > 0.5 ? 'translate' : 'vocabulary';
        
        if (questionType === 'translate') {
            // Translation question - ask in the source language
            const askOriginal = Math.random() > 0.5;
            const isSpanishToEnglish = item.direction === 'es-en';
            
            let questionText, correctAnswer, optionsField;
            
            if (askOriginal) {
                // Ask to translate the original text
                if (isSpanishToEnglish) {
                    questionText = `Traduce al inglés: "${item.original}"`; // Spanish prompt
                } else {
                    questionText = `Translate to Spanish: "${item.original}"`; // English prompt
                }
                correctAnswer = item.translation;
                optionsField = 'translation';
            } else {
                // Ask to translate the translation back
                if (isSpanishToEnglish) {
                    questionText = `Translate to Spanish: "${item.translation}"`; // English prompt
                } else {
                    questionText = `Traduce al inglés: "${item.translation}"`; // Spanish prompt
                }
                correctAnswer = item.original;
                optionsField = 'original';
            }
            
            questions.push({
                question: questionText,
                correctAnswer: correctAnswer,
                options: generateOptions(correctAnswer, history, optionsField),
                type: 'translate'
            });
        } else {
            // Vocabulary/context question - pick a word and find similar sentences
            const isSpanishToEnglish = item.direction === 'es-en';
            
            // Use the original text for context questions (source language)
            const words = item.original.split(' ').filter(w => w.length > 3);
            
            if (words.length > 0) {
                const randomWord = words[Math.floor(Math.random() * words.length)].replace(/[.,!?;:"']/g, '');
                
                // Find sentences that contain this word
                const sentencesWithWord = history
                    .map(h => h.original)
                    .filter(text => {
                        const cleanText = text.toLowerCase();
                        const cleanWord = randomWord.toLowerCase();
                        return cleanText.includes(cleanWord) && text !== item.original;
                    });
                
                // Only create context question if we have at least 3 other sentences with the same word
                if (sentencesWithWord.length >= 3) {
                    const questionText = isSpanishToEnglish 
                        ? `¿Qué frase usa "${randomWord}" correctamente?`
                        : `Which sentence uses "${randomWord}" correctly?`;
                    
                    questions.push({
                        question: questionText,
                        correctAnswer: item.original,
                        options: generateContextOptions(item.original, randomWord, history),
                        type: 'context'
                    });
                } else {
                    // Fallback to translation question if not enough context
                    const questionText = isSpanishToEnglish
                        ? `Traduce al inglés: "${item.original}"`
                        : `Translate to Spanish: "${item.original}"`;
                    
                    questions.push({
                        question: questionText,
                        correctAnswer: item.translation,
                        options: generateOptions(item.translation, history, 'translation'),
                        type: 'translate'
                    });
                }
            } else {
                // Fallback to translation if no suitable words
                const questionText = isSpanishToEnglish
                    ? `Traduce al inglés: "${item.original}"`
                    : `Translate to Spanish: "${item.original}"`;
                
                questions.push({
                    question: questionText,
                    correctAnswer: item.translation,
                    options: generateOptions(item.translation, history, 'translation'),
                    type: 'translate'
                });
            }
        }
    }
    
    return questions;
}

function generateOptions(correctAnswer, history, field) {
    const options = [correctAnswer];
    const usedOptions = new Set([correctAnswer.toLowerCase()]);
    
    // Get similar items from history
    const candidates = history
        .map(h => field === 'translation' ? h.translation : h.original)
        .filter(text => text.toLowerCase() !== correctAnswer.toLowerCase());
    
    // Shuffle candidates
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    
    // Add 3 more unique options
    for (let i = 0; i < shuffled.length && options.length < 4; i++) {
        if (!usedOptions.has(shuffled[i].toLowerCase())) {
            options.push(shuffled[i]);
            usedOptions.add(shuffled[i].toLowerCase());
        }
    }
    
    // If we don't have enough options, generate variations
    while (options.length < 4) {
        const variation = generateVariation(correctAnswer);
        if (!usedOptions.has(variation.toLowerCase())) {
            options.push(variation);
            usedOptions.add(variation.toLowerCase());
        }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
}

function generateContextOptions(correctAnswer, targetWord, history) {
    const options = [correctAnswer];
    const usedOptions = new Set([correctAnswer.toLowerCase()]);
    const cleanTargetWord = targetWord.toLowerCase().replace(/[.,!?;:"']/g, '');
    
    // Get sentences from history that contain the target word
    const candidatesWithWord = history
        .map(h => h.original)
        .filter(text => {
            const cleanText = text.toLowerCase();
            return cleanText.includes(cleanTargetWord) && 
                   text.toLowerCase() !== correctAnswer.toLowerCase();
        });
    
    // Shuffle candidates
    const shuffled = candidatesWithWord.sort(() => Math.random() - 0.5);
    
    // Add up to 3 more options that contain the target word
    for (let i = 0; i < shuffled.length && options.length < 4; i++) {
        if (!usedOptions.has(shuffled[i].toLowerCase())) {
            options.push(shuffled[i]);
            usedOptions.add(shuffled[i].toLowerCase());
        }
    }
    
    // If we don't have enough options with the target word, get similar length sentences
    if (options.length < 4) {
        const similarLength = history
            .map(h => h.original)
            .filter(text => {
                const lengthDiff = Math.abs(text.split(' ').length - correctAnswer.split(' ').length);
                return lengthDiff <= 2 && 
                       text.toLowerCase() !== correctAnswer.toLowerCase() &&
                       !usedOptions.has(text.toLowerCase());
            })
            .sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < similarLength.length && options.length < 4; i++) {
            // Modify to include the target word if it doesn't have it
            let modifiedOption = similarLength[i];
            if (!modifiedOption.toLowerCase().includes(cleanTargetWord)) {
                // Try to naturally insert the word
                const words = modifiedOption.split(' ');
                const insertPos = Math.floor(Math.random() * (words.length + 1));
                words.splice(insertPos, 0, targetWord);
                modifiedOption = words.join(' ');
            }
            
            if (!usedOptions.has(modifiedOption.toLowerCase())) {
                options.push(modifiedOption);
                usedOptions.add(modifiedOption.toLowerCase());
            }
        }
    }
    
    // Final fallback: create plausible variations
    while (options.length < 4) {
        const variation = createVariationWithWord(correctAnswer, targetWord);
        if (!usedOptions.has(variation.toLowerCase())) {
            options.push(variation);
            usedOptions.add(variation.toLowerCase());
        }
    }
    
    return options.sort(() => Math.random() - 0.5);
}

function createVariationWithWord(sentence, targetWord) {
    const variations = [
        `${targetWord} es importante`,
        `Necesito ${targetWord} ahora`,
        `${targetWord} está bien`,
        `I need ${targetWord} here`,
        `${targetWord} is important`,
        `We use ${targetWord} often`
    ];
    return variations[Math.floor(Math.random() * variations.length)];
}

function generateVariation(text) {
    const variations = [
        text + ' today',
        text + ' yesterday',
        'I think ' + text.toLowerCase(),
        'Maybe ' + text.toLowerCase(),
        text.split(' ').reverse().join(' ')
    ];
    return variations[Math.floor(Math.random() * variations.length)];
}

function displayQuestion() {
    if (currentQuestion >= quizData.length) {
        showResults();
        return;
    }
    
    const q = quizData[currentQuestion];
    
    document.getElementById('question-number').textContent = currentQuestion + 1;
    document.getElementById('score').textContent = score;
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('next-btn').style.display = 'none';
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.onclick = () => selectAnswer(option, q.correctAnswer);
        btn.style.cssText = `
            background: white;
            border: 2px solid #ddd;
            padding: 15px 20px;
            border-radius: 10px;
            cursor: pointer;
            text-align: left;
            font-size: 16px;
            color: #1a1a3e;
            transition: all 0.3s ease;
        `;
        btn.onmouseover = function() {
            if (!this.classList.contains('selected')) {
                this.style.borderColor = '#D4AF37';
                this.style.background = '#fafafa';
            }
        };
        btn.onmouseout = function() {
            if (!this.classList.contains('selected')) {
                this.style.borderColor = '#ddd';
                this.style.background = 'white';
            }
        };
        optionsContainer.appendChild(btn);
    });
}

function selectAnswer(selected, correct) {
    const options = document.querySelectorAll('.quiz-option');
    const feedback = document.getElementById('feedback');
    const isCorrect = selected === correct;
    
    // Disable all options
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        
        if (opt.textContent === correct) {
            opt.style.background = '#90EE90';
            opt.style.borderColor = '#28a745';
            opt.style.color = '#1a1a3e';
        }
        
        if (opt.textContent === selected && !isCorrect) {
            opt.style.background = '#FFB6C1';
            opt.style.borderColor = '#dc3545';
        }
    });
    
    // Update score
    if (isCorrect) {
        score++;
        feedback.style.background = '#d4edda';
        feedback.style.color = '#155724';
        feedback.style.border = '1px solid #c3e6cb';
        feedback.innerHTML = '<i class="fas fa-check-circle"></i> <strong>Correct!</strong>';
    } else {
        feedback.style.background = '#f8d7da';
        feedback.style.color = '#721c24';
        feedback.style.border = '1px solid #f5c6cb';
        feedback.innerHTML = `<i class="fas fa-times-circle"></i> <strong>Incorrect.</strong> The correct answer is: "${correct}"`;
    }
    
    feedback.style.display = 'block';
    document.getElementById('score').textContent = score;
    document.getElementById('next-btn').style.display = 'block';
    
    userAnswers.push({
        question: quizData[currentQuestion].question,
        selected: selected,
        correct: correct,
        isCorrect: isCorrect
    });
}

function nextQuestion() {
    currentQuestion++;
    displayQuestion();
}

function showResults() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';
    
    const percentage = Math.round((score / quizData.length) * 100);
    
    document.getElementById('final-score').textContent = `${score}/${quizData.length}`;
    document.getElementById('percentage').textContent = `${percentage}%`;
    
    let message = '';
    if (percentage === 100) {
        message = '🌟 Perfect score! You\'re a translation master!';
    } else if (percentage >= 80) {
        message = '🎉 Excellent work! You know your translations well!';
    } else if (percentage >= 60) {
        message = '👍 Good job! Keep practicing to improve!';
    } else if (percentage >= 40) {
        message = '📚 Not bad! Review your translations and try again!';
    } else {
        message = '💪 Keep studying! Practice makes perfect!';
    }
    
    document.getElementById('message').textContent = message;
}
