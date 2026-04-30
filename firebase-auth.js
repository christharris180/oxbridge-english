import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDyaVRdsqozHWlXIZ-zVdlq2VzTNrsuJc4",
    authDomain: "oxbridge-english-a3cc3.firebaseapp.com",
    projectId: "oxbridge-english-a3cc3",
    storageBucket: "oxbridge-english-a3cc3.firebasestorage.app",
    messagingSenderId: "508505970812",
    appId: "1:508505970812:web:51b46ce56f5d96c28091f9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
window.cloudDb = getFirestore(app);
window.cloudAuth = getAuth(app);
window.cloudProvider = new GoogleAuthProvider();

// Attach Firestore functions globally so all individual pages can use them
window.cloudDoc = doc;
window.cloudSetDoc = setDoc;
window.db = window.cloudDb; // Alias used specifically in the history page
window.dbFunctions = { doc, deleteDoc, getDocs, collection, query, where };

// Global Authentication Listener
onAuthStateChanged(window.cloudAuth, (user) => {
    const profileLabel = document.getElementById('profile-label');
    const profileIcon = document.getElementById('profile-icon');
    
    if (user) {
        // Grab the raw Google ID to match the Android App
        const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
        window.userUid = googleProvider ? googleProvider.uid : user.uid;
        
        if(profileLabel) profileLabel.textContent = user.displayName.split(' ')[0];
        if(profileIcon) {
            profileIcon.style.background = '#4caf50';
            profileIcon.style.color = 'white';
            profileIcon.style.borderColor = '#2e7d32';
        }
        
        // Safely trigger Translator page cloud sync if it exists
        if (typeof window.syncCloudHistory === 'function') {
            window.syncCloudHistory();
        }
    } else {
        window.userUid = null;
        if(profileLabel) profileLabel.textContent = "Log In";
        if(profileIcon) {
            profileIcon.style.background = 'rgba(212, 175, 55, 0.15)';
            profileIcon.style.color = '#D4AF37';
            profileIcon.style.borderColor = '#D4AF37';
        }
    }
    
    // Safely trigger History page loading sequence if it exists
    if (typeof window.loadHistory === 'function') {
        window.loadHistory();
    }
});

// Global Login Handler
window.handleLogin = async function() {
    if (window.userUid) {
        const uiLang = window.uiLang || 'en';
        if(confirm(uiLang === 'es' ? '¿Cerrar sesión?' : 'Sign out?')) {
            await signOut(window.cloudAuth);
        }
    } else {
        try {
            await signInWithPopup(window.cloudAuth, window.cloudProvider);
        } catch(e) { 
            console.log("Login failed", e); 
        }
    }
};