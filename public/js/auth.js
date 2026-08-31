// Frontend minimal com Firebase (compat) — substitua firebaseConfig abaixo pelo seu config web
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  // demais campos...
};

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
