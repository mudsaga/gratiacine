// Auth guard for protected pages. Redirects to /login.html if not authenticated.
// This file assumes firebase and firebase.auth are available (loaded before this script).

(function(){
  function redirectToLogin(){
    window.location.href = '/login.html';
  }

  function showAuthDenied(){
    document.body.removeAttribute('data-auth');
    document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f172a;color:#fff;font-family:sans-serif"><div style="max-width:720px;text-align:center"><h2>A autenticação não foi carregada</h2><p>Por favor verifique a conexão com a CDN do Firebase e tente novamente.</p></div></div>';
  }

  function waitForFirebase(maxMs){
    var start = Date.now();
    (function check(){
      if (window.firebase && firebase.auth) {
        initGuard();
      } else if (Date.now() - start < maxMs) {
        setTimeout(check, 100);
      } else {
        // firebase not available: show a friendly message
        showAuthDenied();
      }
    })();
  }

  function initGuard(){
    try {
      firebase.auth().onAuthStateChanged(function(user){
        if (!user) {
          redirectToLogin();
          return;
        }
        // authenticated: reveal body
        document.body.removeAttribute('data-auth');
      });
    } catch (e) {
      console.error('Auth guard error', e);
      showAuthDenied();
    }
  }

  // Start waiting for firebase (timeout 5s)
  waitForFirebase(5000);
})();
