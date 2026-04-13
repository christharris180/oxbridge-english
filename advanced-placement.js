// Bank of 40 Questions divided by CEFR Level - NOW WITH 5 OPTIONS EACH
const questionPool = {
    B1: [
        { q: "I _____ to London three times this year.", options: ["have been", "went", "was going", "had been", "am going"], answer: 0 },
        { q: "If it rains tomorrow, we _____ at home.", options: ["would stay", "will stay", "stayed", "are staying", "will be stay"], answer: 1 },
        { q: "He _____ TV when the phone rang.", options: ["watched", "has watched", "was watching", "watches", "is watching"], answer: 2 },
        { q: "You _____ smoke in the hospital.", options: ["don't have to", "must not", "needn't", "might not", "shouldn't"], answer: 1 },
        { q: "This is the book _____ I told you about.", options: ["who", "where", "which", "whose", "what"], answer: 2 },
        { q: "I am not _____ to drive a car yet.", options: ["old enough", "enough old", "too old", "very old", "older"], answer: 0 },
        { q: "She asked me where _____.", options: ["did I live", "I lived", "do I live", "I live", "was I living"], answer: 1 },
        { q: "I have been learning English _____ three years.", options: ["since", "from", "for", "during", "in"], answer: 2 },
        { q: "The office _____ cleaned every evening.", options: ["is", "has", "does", "was", "be"], answer: 0 },
        { q: "I look forward to _____ you next week.", options: ["see", "seeing", "saw", "be seeing", "to see"], answer: 1 }
    ],
    B2: [
        { q: "If I had known you were coming, I _____ a cake.", options: ["would bake", "baked", "would have baked", "will bake", "had baked"], answer: 2 },
        { q: "By this time next year, I _____ my university degree.", options: ["will finish", "am finishing", "will have finished", "finish", "would finish"], answer: 2 },
        { q: "He is believed _____ the country under a false name.", options: ["to have left", "leaving", "that he left", "to leave", "having left"], answer: 0 },
        { q: "I'm not used to _____ up so early in the morning.", options: ["wake", "waking", "woke", "have woken", "be waking"], answer: 1 },
        { q: "Hardly _____ outside when it started to pour with rain.", options: ["we had stepped", "stepped we", "had we stepped", "we stepped", "did we step"], answer: 2 },
        { q: "I wish I _____ more time to study for this exam.", options: ["have", "had", "would have", "will have", "had had"], answer: 1 },
        { q: "Despite _____ ill, she managed to pass the final exam.", options: ["she was", "of being", "being", "to be", "she being"], answer: 2 },
        { q: "You had better _____ a doctor about that cough.", options: ["to see", "seeing", "see", "saw", "have seen"], answer: 2 },
        { q: "The thief _____ have had a key; the door wasn't forced.", options: ["must", "can", "should", "would", "could"], answer: 0 },
        { q: "She suggested _____ for a walk along the river.", options: ["to go", "we to go", "going", "go", "gone"], answer: 2 }
    ],
    C1: [
        { q: "Not only _____ the exam, but she also got the highest mark.", options: ["did she pass", "she passed", "she did pass", "passed she", "has she passed"], answer: 0 },
        { q: "It's high time you _____ looking for a stable job.", options: ["start", "started", "will start", "have started", "are starting"], answer: 1 },
        { q: "But for his invaluable help, I _____ the project.", options: ["would fail", "had failed", "would have failed", "failed", "will fail"], answer: 2 },
        { q: "I'd rather you _____ me the truth yesterday.", options: ["told", "had told", "tell", "have told", "were telling"], answer: 1 },
        { q: "No sooner _____ down than the fire alarm went off.", options: ["he had sat", "sat he", "had he sat", "did he sit", "was he sitting"], answer: 2 },
        { q: "She has a real _____ for learning foreign languages.", options: ["flair", "skill", "intuition", "know-how", "genius"], answer: 0 },
        { q: "The new regulations are _____ to cause controversy.", options: ["bound", "due", "about", "possible", "likely"], answer: 0 },
        { q: "He eventually confessed _____ the money from the safe.", options: ["to steal", "steal", "to having stolen", "stolen", "having stolen"], answer: 2 },
        { q: "It was _____ a fascinating book that I read it twice.", options: ["so", "such", "very", "too", "quite"], answer: 1 },
        { q: "_____ as I respect his work, I cannot agree with his methods.", options: ["Much", "Even", "Although", "Despite", "However"], answer: 0 }
    ],
    C2: [
        { q: "He was entirely _____ by the unexpected news of his promotion.", options: ["taken over", "taken aback", "taken down", "taken out", "taken off"], answer: 1 },
        { q: "The new company policies are completely at _____ with our core values.", options: ["odds", "dispute", "conflict", "variance", "disagreement"], answer: 0 },
        { q: "It is absolutely imperative that she _____ present at the hearing.", options: ["is", "be", "will be", "would be", "being"], answer: 1 },
        { q: "_____ to popular belief, the Sahara is not the largest desert in the world.", options: ["Opposite", "Contrary", "Unlike", "Contrasting", "Against"], answer: 1 },
        { q: "I take great _____ to the insinuations made in that article.", options: ["exception", "offense", "resentment", "issue", "umbrage"], answer: 0 },
        { q: "Following the scandal, the corporation is on the _____ of total collapse.", options: ["edge", "point", "brink", "border", "fringe"], answer: 2 },
        { q: "She won the debate _____; no one else even came close.", options: ["hands down", "by a long shot", "out of hand", "on the spot", "in the bag"], answer: 0 },
        { q: "Upon hearing the tragic news, he was beside _____ with grief.", options: ["himself", "his mind", "his soul", "his heart", "his wits"], answer: 0 },
        { q: "They didn't plan the trip; they just bought the tickets on a _____.", options: ["whim", "chance", "fluke", "notion", "spur"], answer: 0 },
        { q: "His reckless actions on the night in question were tantamount _____ treason.", options: ["with", "for", "to", "of", "as"], answer: 2 }
    ]
};

let currentTestQuestions = [];
let currentQ = 0;
let userScore = 0;
let temporarySelectionIsCorrect = false;

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
        ...shuffleArray(questionPool.B1).slice(0, 5),
        ...shuffleArray(questionPool.B2).slice(0, 5),
        ...shuffleArray(questionPool.C1).slice(0, 5),
        ...shuffleArray(questionPool.C2).slice(0, 5)
    ];

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    currentQ = 0;
    userScore = 0;
    loadQuestion();
}

function loadQuestion() {
    temporarySelectionIsCorrect = false;
    document.getElementById('confidence-panel').style.display = 'none'; 

    const progress = (currentQ / currentTestQuestions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;

    const qData = currentTestQuestions[currentQ];
    document.getElementById('question-text').textContent = `${currentQ + 1}. ${qData.q}`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; 

    // Map options to objects before shuffling
    let mappedOptions = qData.options.map((opt, index) => ({
        text: opt,
        isCorrect: index === qData.answer
    }));

    // Randomize the order of the 5 options
    mappedOptions = shuffleArray(mappedOptions);

    mappedOptions.forEach((optObj) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = optObj.text;
        btn.onclick = () => selectOption(btn, optObj.isCorrect);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(btnElement, isCorrect) {
    temporarySelectionIsCorrect = isCorrect;
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    document.getElementById('confidence-panel').style.display = 'block';
}

function submitAnswer(confidenceLevel) {
    if (temporarySelectionIsCorrect) {
        userScore += confidenceLevel;
    }
    
    currentQ++;
    if (currentQ < currentTestQuestions.length) loadQuestion();
    else showResults();
}

function showResults() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('progress').style.width = '100%';

    const currentLang = document.querySelector('.lang-option.active')?.getAttribute('data-lang') || 'en';
    renderResultText(currentLang);
}

function renderResultText(lang) {
    const scoreText = document.getElementById('score-text');
    const recommendedCourse = document.getElementById('recommended-course');
    const courseReason = document.getElementById('course-reason');
    const recTitle = document.getElementById('recommendation-title');
    const contactBtn = document.getElementById('contact-btn');
    const basicRedirectBtn = document.getElementById('basic-redirect-btn');
    
    if (!scoreText || !recommendedCourse || !courseReason) return;

    if (contactBtn) contactBtn.style.display = 'inline-block';
    if (basicRedirectBtn) basicRedirectBtn.style.display = 'none';

    const percentage = (userScore / 60) * 100;
    
    // Save this test's score to the browser session for anti-loop logic
    sessionStorage.setItem('advPercentage', percentage);

    let enScore = `You scored ${userScore} out of 60 possible points.`;
    let esScore = `Obtuviste ${userScore} de 60 puntos posibles.`;
    scoreText.textContent = lang === 'es' ? esScore : enScore;
    
    scoreText.setAttribute('data-en', enScore);
    scoreText.setAttribute('data-es', esScore);

    let enRec = "";
    let esRec = "";
    let enReason = "";
    let esReason = "";

    // Low Score Handling
    if (userScore <= 15) {
        const basicPercentage = sessionStorage.getItem('basicPercentage');

        // LOOP BREAKER: If they already aced the basic test, they are "A2 Complete"
        if (basicPercentage !== null && parseFloat(basicPercentage) > 80) {
            enRec = "CEFR Level: A2 Complete";
            esRec = "Nivel CEFR: A2 Completo";
            enReason = "You have a perfect grasp of the basics! While these advanced concepts are currently out of reach, you are at the exact threshold to start intermediate learning. We highly recommend booking 1-to-1 classes with Christopher Harris to bridge this gap.";
            esReason = "¡Tienes un dominio perfecto de las bases! Aunque estos conceptos avanzados están fuera de alcance por ahora, estás en el umbral exacto para el aprendizaje intermedio. Recomendamos clases 1 a 1 con Christopher Harris para cerrar esta brecha.";
            
            if (recTitle) {
                recTitle.setAttribute('data-en', "Ready to Master English?");
                recTitle.setAttribute('data-es', "¿Listo para Dominar el Inglés?");
                recTitle.textContent = lang === 'es' ? "¿Listo para Dominar el Inglés?" : "Ready to Master English?";
            }
            if (contactBtn) contactBtn.style.display = 'inline-block';
            if (basicRedirectBtn) basicRedirectBtn.style.display = 'none';

        } else {
            // Standard Flow: Failed advanced, needs to take basic
            enRec = "Basic Evaluation Required";
            esRec = "Se Requiere Evaluación Básica";
            enReason = "It looks like these advanced concepts were a bit too tricky to accurately pinpoint your level! Please take our Basic Placement Test to get your official CEFR result.";
            esReason = "¡Parece que estos conceptos avanzados fueron un poco difíciles para determinar tu nivel con precisión! Por favor, toma nuestra Prueba de Nivel Básica para obtener tu resultado CEFR oficial.";
            
            if (recTitle) {
                recTitle.setAttribute('data-en', "Let's Check Your Basics");
                recTitle.setAttribute('data-es', "Revisemos tus Bases");
                recTitle.textContent = lang === 'es' ? "Revisemos tus Bases" : "Let's Check Your Basics";
            }
            if (contactBtn) contactBtn.style.display = 'none';
            if (basicRedirectBtn) {
                basicRedirectBtn.style.display = 'inline-block';
                basicRedirectBtn.textContent = lang === 'es' ? basicRedirectBtn.getAttribute('data-es') : basicRedirectBtn.getAttribute('data-en');
            }
        }
    } else {
        // Standard advanced routing (Passing Scores)
        if (recTitle) {
            recTitle.setAttribute('data-en', "Ready to Master English?");
            recTitle.setAttribute('data-es', "¿Listo para Dominar el Inglés?");
            recTitle.textContent = lang === 'es' ? "¿Listo para Dominar el Inglés?" : "Ready to Master English?";
        }

        enReason = "To truly elevate your skills and unlock your full potential, we highly recommend booking 1-to-1 classes with our expert teacher, Christopher Harris. These personalized sessions are tailored strictly to your current level and future goals.";
        esReason = "Para elevar verdaderamente tus habilidades y desbloquear tu máximo potencial, recomendamos reservar clases 1 a 1 con nuestro profesor experto, Christopher Harris. Estas sesiones personalizadas se adaptan estrictamente a tu nivel actual y objetivos futuros.";

        if (userScore <= 30) {
            enRec = "CEFR Level: B2 (Upper-Intermediate)";
            esRec = "Nivel CEFR: B2 (Intermedio Alto)";
        } else if (userScore <= 45) {
            enRec = "CEFR Level: C1 (Advanced)";
            esRec = "Nivel CEFR: C1 (Avanzado)";
        } else {
            enRec = "CEFR Level: C2 (Proficient)";
            esRec = "Nivel CEFR: C2 (Nativo/Bilingüe)";
        }
        
        if (contactBtn) {
            contactBtn.textContent = lang === 'es' ? contactBtn.getAttribute('data-es') : contactBtn.getAttribute('data-en');
        }
    }

    recommendedCourse.textContent = lang === 'es' ? esRec : enRec;
    recommendedCourse.setAttribute('data-en', enRec);
    recommendedCourse.setAttribute('data-es', esRec);

    courseReason.textContent = lang === 'es' ? esReason : enReason;
    courseReason.setAttribute('data-en', enReason);
    courseReason.setAttribute('data-es', esReason);
}