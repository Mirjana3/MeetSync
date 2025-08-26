import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

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
    const form = document.getElementById('newPasswordForm');
    form.addEventListener('submit', async (e) => {
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
        // Get oobCode from URL
        const params = new URLSearchParams(window.location.search);
        const oobCode = params.get('oobCode');
        if (!oobCode) {
            alert('Invalid or expired reset link.');
            return;
        }
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            alert('Password has been reset. You can now log in.');
            window.location.href = 'login.html';
        } catch (error) {
            alert('Error resetting password: ' + error.message);
        }
    });
});
