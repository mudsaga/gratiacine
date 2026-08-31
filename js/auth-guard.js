(function(){
  // Auth guard for protected pages. Redirects to /login.html if not authenticated.
  // This file assumes firebase and firebase.auth are available (loaded before this script).

  function redirectToLogin(){
    window.location.href = '/login.html';
  }

  function showAuthDenied(){
    document.body.removeAttribute('data-auth');
    document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f172a;color:#fff;font-family:sans-serif"><div style="max-width:760px;text-align:center;border:1px solid rgba(255,255,255,0.06);padding:28px;border-radius:12px;background:rgba(0,0,0,0.4)"><h2 style="margin-top:0">Acesso restrito</h2><p style="color:#cbd5e1;margin:10px 0 18px">Você precisa estar autenticado para acessar este painel. <a href="/login.html" style="color:#8ea2ff;font-weight:800">Ir para Login</a></p></div></div>';
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
