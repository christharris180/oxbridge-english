// The Master Bank of 40 Questions (10 per level)
const questionBank = {
    level1: [
        { q: "I ___ a student.", options: ["am", "is", "are", "be", "being"], answer: 0 },
        { q: "She ___ to music every day.", options: ["listen", "listens", "listening", "to listen", "is listen"], answer: 1 },
        { q: "___ you like coffee?", options: ["Are", "Does", "Do", "Is", "Have"], answer: 2 },
        { q: "They ___ from Spain.", options: ["is", "am", "are", "be", "been"], answer: 2 },
        { q: "What ___ your name?", options: ["are", "am", "be", "is", "does"], answer: 3 },
        { q: "My mother ___ a teacher.", options: ["are", "is", "am", "be", "does"], answer: 1 },
        { q: "We ___ happy.", options: ["is", "am", "are", "do", "be"], answer: 2 },
        { q: "___ he play tennis?", options: ["Do", "Does", "Is", "Are", "Has"], answer: 1 },
        { q: "I ___ not like apples.", options: ["am", "is", "do", "does", "are"], answer: 2 },
        { q: "Where ___ she live?", options: ["do", "does", "is", "are", "has"], answer: 1 }
    ],
    level2: [
        { q: "My brother ___ a new car.", options: ["has got", "have got", "getting", "is got", "has get"], answer: 0 },
        { q: "I ___ go to the cinema. I don't like movies.", options: ["always", "often", "usually", "never", "sometimes"], answer: 3 },
        { q: "The keys are ___ the table.", options: ["in", "on", "at", "under of", "next"], answer: 1 },
        { q: "How ___ apples are in the basket?", options: ["much", "many", "more", "any", "some"], answer: 1 },
        { q: "We ___ lunch at 2:00 PM.", options: ["usually have", "have usually", "usually has", "are usually having", "usually having"], answer: 0 },
        { q: "She ___ two sisters.", options: ["have got", "has got", "got", "is having", "gets"], answer: 1 },
        { q: "I always wake up ___ 7 o'clock.", options: ["in", "on", "at", "to", "by"], answer: 2 },
        { q: "Is there ___ milk in the fridge?", options: ["some", "any", "many", "a", "few"], answer: 1 },
        { q: "They play football ___ Sundays.", options: ["in", "at", "on", "to", "for"], answer: 2 },
        { q: "How ___ money do you have?", options: ["many", "much", "any", "some", "a lot"], answer: 1 }
    ],
    level3: [
        { q: "Look! It ___ outside.", options: ["rains", "raining", "is raining", "rained", "does rain"], answer: 2 },
        { q: "I ___ go to work yesterday because I was sick.", options: ["don't", "didn't", "wasn't", "haven't", "hasn't"], answer: 1 },
        { q: "You ___ wear a uniform at this school. It's the rule.", options: ["can", "might", "have to", "has to", "would"], answer: 2 },
        { q: "What ___ you doing right now?", options: ["do", "are", "is", "have", "be"], answer: 1 },
        { q: "Where ___ you go last weekend?", options: ["do", "were", "did", "are", "had"], answer: 2 },
        { q: "She ___ a great movie last night.", options: ["sees", "see", "saw", "is seeing", "seen"], answer: 2 },
        { q: "Listen! The baby ___.", options: ["cries", "cry", "is crying", "cried", "crying"], answer: 2 },
        { q: "I ___ swim when I was five years old.", options: ["can", "could", "might", "should", "am able"], answer: 1 },
        { q: "You ___ smoke in the hospital.", options: ["don't have to", "mustn't", "couldn't", "haven't", "aren't"], answer: 1 },
        { q: "They ___ pizza for dinner yesterday.", options: ["eat", "eating", "ate", "eated", "eaten"], answer: 2 }
    ],
    level4: [
        { q: "I think it ___ rain tomorrow.", options: ["is going", "will", "going to", "shall", "is"], answer: 1 },
        { q: "What ___ doing on the weekends?", options: ["are you like", "do you like", "you like", "would you like", "like you"], answer: 1 },
        { q: "We ___ to Spain next summer. We have already bought the tickets.", options: ["are going", "will go", "go", "going", "gone"], answer: 0 },
        { q: "___ you like some tea?", options: ["Do", "Are", "Will", "Would", "Have"], answer: 3 },
        { q: "I promise I ___ help you with your homework.", options: ["will", "am going to", "help", "would", "am helping"], answer: 0 },
        { q: "Look at those dark clouds! It ___ rain.", options: ["will", "is going to", "going to", "would", "shall"], answer: 1 },
        { q: "I've made up my mind. I ___ study medicine.", options: ["will", "am going to", "would", "shall", "am"], answer: 1 },
        { q: "What ___ you like to do tonight?", options: ["do", "would", "will", "are", "have"], answer: 1 },
        { q: "The phone is ringing! I ___ answer it.", options: ["will", "am going to", "am answering", "answer", "would"], answer: 0 },
        { q: "They ___ a party next Friday. Everyone is invited.", options: ["will have", "are going to have", "have", "going to have", "having"], answer: 1 }
    ]
};

let currentTestQuestions = [];
let currentQ = 0;
let userScore = 0;
let temporarySelection = null;

// --- BULLETPROOF LANGUAGE LISTENER ---
// Instantly changes the result text when the user clicks a flag
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            if (document.getElementById('result-screen').style.display === 'block') {
                renderResultText(lang);
            }
        });
    });
});

function shuffleArray(array) {
    return array.slice().sort(() => 0.5 - Math.random());
}

function startTest() {
    currentTestQuestions = [
        ...shuffleArray(questionBank.level1).slice(0, 5),
        ...shuffleArray(questionBank.level2).slice(0, 5),
        ...shuffleArray(questionBank.level3).slice(0, 5),
        ...shuffleArray(questionBank.level4).slice(0, 5)
    ];

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    currentQ = 0;
    userScore = 0;
    loadQuestion();
}

function loadQuestion() {
    temporarySelection = null;
    document.getElementById('confidence-panel').style.display = 'none'; 

    const progress = (currentQ / currentTestQuestions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;

    const qData = currentTestQuestions[currentQ];
    document.getElementById('question-text').textContent = `${currentQ + 1}. ${qData.q}`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; 

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => selectOption(btn, index);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(btnElement, selectedIndex) {
    temporarySelection = selectedIndex;
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    document.getElementById('confidence-panel').style.display = 'block';
}

function submitAnswer(confidenceLevel) {
    const isCorrect = (temporarySelection === currentTestQuestions[currentQ].answer);
    
    if (isCorrect) {
        userScore += confidenceLevel;
    }
    
    currentQ++;
    
    if (currentQ < currentTestQuestions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('progress').style.width = '100%';

    // Check which language the user has active right now
    const currentLang = document.querySelector('.lang-option.active')?.getAttribute('data-lang') || 'en';
    renderResultText(currentLang);
}

// Dedicated function to render English OR Spanish results perfectly
function renderResultText(lang) {
    const scoreText = document.getElementById('score-text');
    const recommendedCourse = document.getElementById('recommended-course');
    const courseReason = document.getElementById('course-reason');
    
    if (!scoreText || !recommendedCourse || !courseReason) return; // Prevent crashes

    const percentage = (userScore / 60) * 100;

    let enScore = `You scored ${userScore} out of 60 possible points.`;
    let esScore = `Obtuviste ${userScore} de 60 puntos posibles.`;
    scoreText.textContent = lang === 'es' ? esScore : enScore;
    
    // Add translation attributes so your old script.js doesn't accidentally overwrite it
    scoreText.setAttribute('data-en', enScore);
    scoreText.setAttribute('data-es', esScore);

    let enRec = "";
    let esRec = "";
    let enReason = "";
    let esReason = "";

    if (percentage <= 20) {
        enRec = "Your CEFR Level: A0 (Absolute Beginner)";
        esRec = "Tu Nivel CEFR: A0 (Principiante Absoluto)";
        enReason = "We highly recommend starting with Course 1. This course will give you the foundational building blocks to form sentences correctly from scratch.";
        esReason = "Recomendamos encarecidamente que comiences por el Curso 1. Este curso te dará las bases fundamentales para formar oraciones correctamente desde cero.";
    } else if (percentage <= 40) {
        enRec = "Your CEFR Level: Basic A1";
        esRec = "Tu Nivel CEFR: A1 Básico";
        enReason = "You have some knowledge, but we recommend starting with Course 1 to consolidate your understanding and advance with total confidence.";
        esReason = "Tienes algunas nociones, pero te recomendamos empezar por el Curso 1 para consolidar tus conocimientos y avanzar con total seguridad.";
    } else if (percentage <= 60) {
        enRec = "Your CEFR Level: Solid A1";
        esRec = "Tu Nivel CEFR: A1 Sólido";
        enReason = "You know the basics well! You are ready to jump to Course 3, where you will learn continuous tenses, the past tense, and modals.";
        esReason = "¡Conoces bien las bases! Estás listo para saltar al Curso 3, donde aprenderás los tiempos continuos, el pasado y los verbos modales.";
    } else if (percentage <= 80) {
        enRec = "Your CEFR Level: Early A2";
        esRec = "Tu Nivel CEFR: A2 Inicial";
        enReason = "You have a great level, but there was some hesitation with past structures. We recommend starting at Course 3 to consolidate and advance quickly.";
        esReason = "Tienes muy buen nivel, pero hubo dudas en estructuras pasadas. Te recomendamos empezar por el Curso 3 para consolidar y avanzar rápidamente.";
    } else {
        enRec = "Your CEFR Level: Solid A2 / B1";
        esRec = "Tu Nivel CEFR: A2 Sólido / B1";
        enReason = "Excellent work! We recommend taking Courses 3 and 4 as a quick refresher to reinforce your knowledge. Stay tuned for our Advanced Test (coming soon) to map your exact B1 level!";
        esReason = "¡Excelente trabajo! Recomendamos tomar los Cursos 3 y 4 para un repaso rápido y reforzar conocimientos. ¡Pronto lanzaremos nuestra Prueba Avanzada para medir tu nivel exacto de B1!";
    }

    recommendedCourse.textContent = lang === 'es' ? esRec : enRec;
    recommendedCourse.setAttribute('data-en', enRec);
    recommendedCourse.setAttribute('data-es', esRec);

    courseReason.textContent = lang === 'es' ? esReason : enReason;
    courseReason.setAttribute('data-en', enReason);
    courseReason.setAttribute('data-es', esReason);
}