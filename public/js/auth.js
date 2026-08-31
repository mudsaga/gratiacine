// Frontend minimal com Firebase (compat) — substitua firebaseConfig abaixo pelo seu config web
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvDSjwIB676OYpwarisxm-Dt8TZHdLTtQ",
  authDomain: "gratia-e180a.firebaseapp.com",
  projectId: "gratia-e180a",
  storageBucket: "gratia-e180a.firebasestorage.app",
  messagingSenderId: "613805854975",
  appId: "1:613805854975:web:7c7512466416e4a8397cca",
  measurementId: "G-35ST11M8BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// Login form (login.html)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      alert('Login efetuado');
      window.location.href = 'profile.html';
    } catch (err) {
      console.error(err);
      alert('Erro: ' + err.message);
    }
  });
}

// Perfil (profile.html)
const profileDiv = document.getElementById('profile');
const logoutBtn = document.getElementById('logoutBtn');
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    // não autenticado → redireciona para login
    if (window.location.pathname.endsWith('profile.html')) {
      window.location.href = 'login.html';
    }
    return;
  }
  if (profileDiv) {
    const token = await user.getIdTokenResult();
    profileDiv.innerHTML = `
      <p><strong>Nome:</strong> ${user.displayName || '(sem nome)'}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>UID:</strong> ${user.uid}</p>
      <p><strong>Admin:</strong> ${token.claims && token.claims.admin ? 'Sim' : 'Não'}</p>
    `;
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => auth.signOut().then(() => window.location.href = 'login.html'));
}
