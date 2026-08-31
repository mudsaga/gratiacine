// Client-side Firebase helpers (full implementation)
// This uses Firebase compat CDN. The page should call FirebaseClient.init(firebaseConfig)

(function(){
  const FirebaseClient = {
    configured: false,
    firebaseApp: null,
    auth: null,
    db: null,
    storage: null,

    loadScripts: function(){
      return new Promise((resolve, reject) => {
        if(window.firebase && window.firebase.apps) return resolve();
        const urls = [
          'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
          'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js',
          'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js',
          'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js'
        ];
        let loaded = 0;
        urls.forEach(u => {
          const s = document.createElement('script');
          s.src = u; s.async = false;
          s.onload = () => { loaded++; if(loaded===urls.length) resolve(); };
          s.onerror = (e) => reject(e);
          document.head.appendChild(s);
        });
      });
    },

    init: async function(firebaseConfig){
      if(!firebaseConfig) {
        console.warn('FirebaseClient.init: firebaseConfig missing');
        return;
      }
      await this.loadScripts();
      this.firebaseApp = firebase.initializeApp(firebaseConfig);
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      this.storage = firebase.storage();
      this.configured = true;

      // Setup simple auth UI in #authPanel
      this.renderAuthPanel();

      // auth state observer
      this.auth.onAuthStateChanged(user => {
        this.renderAuthPanel();
        // custom event for app
        window.dispatchEvent(new CustomEvent('firebase-auth-changed', { detail: { user } }));
      });

      return this;
    },

    renderAuthPanel: function(){
      const panel = document.getElementById('authPanel');
      if(!panel) return;
      panel.innerHTML = '';
      if(!this.configured) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm'; btn.textContent = 'Configurar Firebase';
        btn.onclick = () => alert('Firebase não configurado. Forneça firebaseConfig e chame FirebaseClient.init(config)');
        panel.appendChild(btn);
        return;
      }

      const user = this.auth.currentUser;
      if(user) {
        const img = document.createElement('img');
        img.src = user.photoURL || `https://via.placeholder.com/34/334155/fff?text=${(user.displayName||'U').charAt(0).toUpperCase()}`;
        img.style.width='34px'; img.style.height='34px'; img.style.borderRadius='50%'; img.style.objectFit='cover'; img.style.border='2px solid var(--primary)';
        panel.appendChild(img);

        const span = document.createElement('span'); span.style.fontWeight='800'; span.style.marginLeft='6px'; span.textContent = user.displayName || user.email || user.uid;
        panel.appendChild(span);

        const btnOut = document.createElement('button'); btnOut.className='btn btn-sm'; btnOut.style.marginLeft='8px'; btnOut.textContent='Sair';
        btnOut.onclick = () => this.signOut();
        panel.appendChild(btnOut);

        const btnEdit = document.createElement('button'); btnEdit.className='btn btn-sm'; btnEdit.style.marginLeft='8px'; btnEdit.textContent='Editar Perfil';
        btnEdit.onclick = () => this.openProfileEditor(user);
        panel.appendChild(btnEdit);
      } else {
        const btnSignIn = document.createElement('button'); btnSignIn.className='btn btn-sm'; btnSignIn.textContent='Entrar';
        btnSignIn.onclick = () => this.openSignInModal();
        panel.appendChild(btnSignIn);

        const btnSignUp = document.createElement('button'); btnSignUp.className='btn btn-sm'; btnSignUp.style.marginLeft='6px'; btnSignUp.textContent='Registrar';
        btnSignUp.onclick = () => this.openSignUpModal();
        panel.appendChild(btnSignUp);
      }
    },

    openSignInModal: function(){
      const email = prompt('Email:');
      if(!email) return;
      const pass = prompt('Senha:');
      if(!pass) return;
      this.signIn(email, pass).catch(err => alert('Erro: ' + err.message));
    },

    openSignUpModal: function(){
      const email = prompt('Email para registro:');
      if(!email) return;
      const pass = prompt('Senha (min 6):');
      if(!pass) return;
      const name = prompt('Nome (opcional):') || '';
      this.signUp(email, pass, name).catch(err => alert('Erro: ' + err.message));
    },

    signUp: async function(email, password, displayName){
      if(!this.configured) throw new Error('Firebase não inicializado');
      const userCred = await this.auth.createUserWithEmailAndPassword(email, password);
      if(displayName) await userCred.user.updateProfile({ displayName });
      // create user doc
      await this.db.collection('users').doc(userCred.user.uid).set({ email, displayName, createdAt: new Date().toISOString() }, { merge: true });
      return userCred.user;
    },

    signIn: async function(email, password){
      if(!this.configured) throw new Error('Firebase não inicializado');
      const userCred = await this.auth.signInWithEmailAndPassword(email, password);
      return userCred.user;
    },

    signOut: async function(){
      if(!this.configured) throw new Error('Firebase não inicializado');
      await this.auth.signOut();
    },

    openProfileEditor: async function(user){
      if(!user) return alert('Usuário não autenticado');
      const newName = prompt('Nome:', user.displayName || '');
      if(newName !== null) {
        await user.updateProfile({ displayName: newName });
        await this.db.collection('users').doc(user.uid).set({ displayName: newName }, { merge: true });
      }
      const wantAvatar = confirm('Deseja enviar uma nova foto de perfil?');
      if(wantAvatar) {
        const input = document.createElement('input'); input.type='file'; input.accept='image/*';
        input.onchange = async (e) => {
          const f = e.target.files[0];
          if(!f) return;
          const url = await this.uploadAvatar(user.uid, f);
          await user.updateProfile({ photoURL: url });
          await this.db.collection('users').doc(user.uid).set({ photoURL: url }, { merge: true });
          alert('Avatar atualizado');
          this.renderAuthPanel();
        };
        input.click();
      }
    },

    uploadAvatar: async function(userId, fileBlob){
      if(!this.configured) throw new Error('Firebase não inicializado');
      const ref = this.storage.ref().child(`avatars/${userId}/avatar.jpg`);
      const snap = await ref.put(fileBlob);
      const url = await snap.ref.getDownloadURL();
      await this.db.collection('users').doc(userId).set({ photoURL: url, updatedAt: new Date().toISOString() }, { merge: true });
      return url;
    },

    getUserProfile: async function(userId){
      if(!this.configured) throw new Error('Firebase não inicializado');
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? doc.data() : null;
    }
  };

  window.FirebaseClient = FirebaseClient;
})();
