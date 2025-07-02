// Generate random numbers in the background
function generateRandomNumbers() {
    const body = document.body;
    const totalNumbers = 50;
    for (let i = 0; i < totalNumbers; i++) {
        const num = document.createElement('div');
        num.style.position = 'absolute';
        num.style.top = Math.random() * 100 + '%';
        num.style.left = Math.random() * 100 + '%';
        num.style.fontSize = Math.random() * 30 + 15 + 'px';
        num.style.color = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.6)`;
        num.textContent = Math.floor(Math.random() * 100);
        body.appendChild(num);
    }
}
generateRandomNumbers();

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAkqPpwbi2bOpaihRkePggeflQMQGBcXoc",
    authDomain: "meetsync-e6f72.firebaseapp.com",
    projectId: "meetsync-e6f72",
    storageBucket: "meetsync-e6f72.appspot.com",
    messagingSenderId: "1062510540690",
    appId: "1:1062510540690:web:8ec1de0518bc2b6611734b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signinForm');
    const loginForm = document.querySelector('form[action="login.html"]');

    // Sign-up logic
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Validacija e-maila
            if (!emailPattern.test(email)) {
                alert('Unesite ispravnu email adresu.');
                return;
            }

            // Validacija lozinke
            if (password.length < 6) {
                alert('Lozinka mora imati barem 6 znakova.');
                return;
            }

            // Provjera podudaranja lozinki
            if (password !== confirmPassword) {
                alert('Lozinke se ne podudaraju!');
                return;
            }

            try {
                await createUserWithEmailAndPassword(auth, email, password);
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'calendar/page.html';
            } catch (error) {
                handleAuthError(error);
            }
        });
    }

    // Login logic
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {
                alert('Unesite ispravnu email adresu.');
                return;
            }

            if (password.length < 6) {
                alert('Lozinka mora imati barem 6 znakova.');
                return;
            }

            try {

                // Ako email postoji, pokušaj login
                await signInWithEmailAndPassword(auth, email, password);
                alert('Prijava uspješna!');
                window.location.href = 'calendar/page.html';
            } catch (error) {
                // Sad možemo biti sigurni da je problem u lozinki
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    alert('Unesena lozinka nije točna.');
                } else {
                    handleAuthError(error); // ostale greške
                }
            }
        });
    }

    function handleAuthError(error) {
        console.log("Firebase error:", error.code); // Debug

        switch (error.code) {
            case 'auth/invalid-email':
                alert('Email adresa nije ispravna.');
                break;
            case 'auth/user-not-found':
                alert('Korisnički račun s ovom email adresom ne postoji.');
                break;
            case 'auth/wrong-password':
                alert('Unesena lozinka nije točna.');
                break;
            case 'auth/invalid-credential':
                alert('Email adresa ili lozinka nije točna.'); // ← Dodaj ovu liniju
                break;
            case 'auth/email-already-in-use':
                alert('Ova email adresa je već registrirana.');
                break;
            case 'auth/weak-password':
                alert('Lozinka mora imati najmanje 6 znakova.');
                break;
            case 'auth/missing-password':
                alert('Lozinka nije unesena.');
                break;
            default:
                alert('Greška: ' + error.message);
                break;
        }
    }


    // Monitor authentication state
    onAuthStateChanged(auth, (user) => {
        const userNameElement = document.getElementById('userName');
        const changeNameSection = document.getElementById('changeNameSection');

        // Provjera je li korisnik prijavljen
        if (user) {
            // Ako je korisnik prijavljen, preusmjeri ga na stranicu ako nije na loginu ili signupu
            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signin.html')) {
                window.location.href = 'calendar/page.html'; // Preusmjeri na glavnu stranicu ako je korisnik prijavljen
            }

            // Display user info
            userNameElement.textContent = user.displayName || 'Random User';

            // Display name change option
            changeNameSection.style.display = 'block';

            // Handle name change
            const nameChangeForm = document.getElementById('nameChangeForm');
            nameChangeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newName = document.getElementById('newName').value;
                if (newName) {
                    try {
                        await updateProfile(user, { displayName: newName });
                        userNameElement.textContent = newName;
                        alert('Name updated successfully!');
                    } catch (error) {
                        alert('Failed to update name: ' + error.message);
                    }
                }
            });

            // Handle log out
            const logoutButton = document.getElementById('logoutButton');
            logoutButton.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    window.location.href = 'login.html'; // Redirect to login page after logging out
                } catch (error) {
                    alert('Error logging out: ' + error.message);
                }
            });
        } else {
            // Ako nije prijavljen, ostaje na login.html
            if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signin.html')) {
                window.location.href = 'login.html'; // Redirect to login page if not logged in
            }
        }
    });

});