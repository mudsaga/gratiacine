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

// Helpers de UI
function showMessage(text) {
  const m = document.getElementById('message');
  if (m) m.textContent = text;
}
function clearMessage() { showMessage(''); }

// Verifica se o firebaseConfig foi substituído
const isConfigPlaceholder = !firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === 'REPLACE_ME';
if (isConfigPlaceholder) {
  const msg = 'Firebase config não foi preenchido. Edite js/auth.js e substitua os valores em firebaseConfig com o config do seu Web App do Firebase. Veja AUTH_README.md para instruções.';
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

  // trims helpers
  function getEmail() { return (document.getElementById('email')?.value || '').trim(); }
  function getPassword() { return (document.getElementById('password')?.value || ''); }

  // Login form (login.html)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessage();
      const email = getEmail();
      const password = getPassword();
      if (!email || !password) { showMessage('Preencha email e senha.'); return; }
      try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('Login efetuado');
        window.location.href = 'profile.html';
      } catch (err) {
        console.error(err);
        const code = err.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials') {
          showMessage('Usuário não encontrado. Você pode criar uma conta clicando em "Criar conta".');
        } else if (code === 'auth/wrong-password') {
          showMessage('Senha incorreta. Use "Esqueci minha senha" para redefinir.');
        } else if (code === 'auth/invalid-email') {
          showMessage('Email inválido.');
        } else {
          showMessage(err.message || 'Erro ao fazer login');
        }
      }
    });
  }

  // Criar conta (signup) — usa os valores do formulário
  const signupBtn = document.getElementById('signupBtn');
  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      clearMessage();
      const email = getEmail();
      const password = getPassword();
      if (!email || !password) { showMessage('Preencha email e senha para criar a conta.'); return; }
      try {
        const res = await auth.createUserWithEmailAndPassword(email, password);
        showMessage('Conta criada com sucesso. Você já está logado.');
        console.log('Conta criada', res.user && res.user.uid);
        window.location.href = 'profile.html';
      } catch (err) {
        console.error(err);
        showMessage(err.message || 'Erro ao criar conta');
      }
    });
  }

  // Redefinição de senha
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      clearMessage();
      const email = getEmail();
      if (!email) { showMessage('Digite seu email para enviar o link de redefinição.'); return; }
      try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Email de redefinição enviado. Verifique sua caixa de entrada.');
      } catch (err) {
        console.error(err);
        showMessage(err.message || 'Erro ao enviar email de redefinição');
      }
    });
  }

  // Perfil (profile.html)
  const profileDiv = document.getElementById('profile');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshBtn = document.getElementById('refreshClaimsBtn');
  const profileMsg = document.getElementById('profile-msg');

  async function renderUser(user) {
    if (!user) return;
    // força refresh do token para obter claims atualizadas
    const token = await user.getIdTokenResult();
    if (profileDiv) {
      profileDiv.innerHTML = `
        <p><strong>Nome:</strong> ${user.displayName || '(sem nome)'}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>UID:</strong> ${user.uid}</p>
        <p><strong>Admin:</strong> ${token.claims && token.claims.admin ? 'Sim' : 'Não'}</p>
      `;
    }
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      if (window.location.pathname.endsWith('profile.html')) {
        window.location.href = 'login.html';
      }
      return;
    }
    await renderUser(user);
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'login.html';
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      clearMessage();
      const user = auth.currentUser;
      if (!user) { if (profileMsg) profileMsg.textContent = 'Nenhum usuário logado.'; return; }
      try {
        await user.getIdToken(true); // força refresh
        await renderUser(user);
        if (profileMsg) profileMsg.textContent = 'Claims atualizadas.';
      } catch (err) {
        console.error(err);
        if (profileMsg) profileMsg.textContent = 'Erro ao atualizar claims: ' + (err.message || err.code);
      }
    });
  }
}
