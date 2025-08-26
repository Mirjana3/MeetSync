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
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAkqPpwbi2bOpaihRkePggeflQMQGBcXoc",
    authDomain: "meetsync-e6f72.firebaseapp.com",
    projectId: "meetsync-e6f72",
    storageBucket: "meetsync-e6f72.appspot.com",
    messagingSenderId: "1062510540690",
    appId: "1:1062510540690:web:8ec1de0518bc2b6611734b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    // Login logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            if (!email || password.length < 6) {
                alert('Invalid email or password.');
                return;
            }
            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'calendar/page.html'; // Redirect after successful login
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        });
    }

    // Password reset logic
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const passwordResetSection = document.getElementById('passwordResetSection');
    const closeResetSection = document.getElementById('closeResetSection');
    const passwordResetForm = document.getElementById('passwordResetForm');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            passwordResetSection.style.display = 'block';
        });
    }
    if (closeResetSection) {
        closeResetSection.addEventListener('click', () => {
            passwordResetSection.style.display = 'none';
        });
    }
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value.trim();
            if (!email) {
                alert('Please enter your email.');
                return;
            }
            try {
                await sendPasswordResetEmail(auth, email);
                alert('A password reset email has been sent. Please check your inbox.');
                passwordResetSection.style.display = 'none';
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // Set new password logic (if oobCode in URL)
    const setNewPasswordSection = document.getElementById('setNewPasswordSection');
    const closeSetNewPasswordSection = document.getElementById('closeSetNewPasswordSection');
    const newPasswordForm = document.getElementById('newPasswordForm');
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get('oobCode');
    if (oobCode && setNewPasswordSection) {
        setNewPasswordSection.style.display = 'block';
    }
    if (closeSetNewPasswordSection) {
        closeSetNewPasswordSection.addEventListener('click', () => {
            setNewPasswordSection.style.display = 'none';
            window.location.href = 'login.html';
        });
    }
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters.');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                alert('Passwords do not match.');
                return;
            }
            if (!oobCode) {
                alert('Invalid or expired reset link.');
                return;
            }
            try {
                await confirmPasswordReset(auth, oobCode, newPassword);
                alert('Password has been reset. You can now log in.');
                setNewPasswordSection.style.display = 'none';
                window.location.href = 'login.html';
            } catch (error) {
                alert('Error resetting password: ' + error.message);
            }
        });
    }
});
