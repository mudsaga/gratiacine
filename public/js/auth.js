// Frontend minimal com Firebase (compat)
// Substitua firebaseConfig abaixo pelo seu config web
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  // demais campos...
};

function showMissingConfigWarning(message) {
  console.error(message);
  // Cria um aviso visível na página para facilitar o debug
  let warn = document.getElementById('firebase-config-warning');
  if (!warn) {
    warn = document.createElement('div');
    warn.id = 'firebase-config-warning';
    warn.style.cssText = 'background:#fee;border:1px solid #f88;color:#700;padding:12px;margin:12px 0;font-family:sans-serif';
    document.body.insertBefore(warn, document.body.firstChild);
  }
  warn.innerText = message;
}

// Verifica se o firebaseConfig foi substituído
const isConfigPlaceholder = !firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === 'REPLACE_ME';
if (isConfigPlaceholder) {
  const msg = 'Firebase config não foi preenchido. Edite public/js/auth.js e substitua os valores em firebaseConfig com o config do seu Web App do Firebase. Veja AUTH_README.md para instruções.';
  // Aguarda DOM pronto para inserir a mensagem
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => showMissingConfigWarning(msg));
  } else {
    showMissingConfigWarning(msg);
  }
} else {
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
}
