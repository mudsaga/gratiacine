// Client-side Firebase helpers (placeholder)
// Replace the FIREBASE_CONFIG placeholder with your Firebase config object

// Load Firebase via compat CDN in index.html or import the modular SDK as preferred.

(function(){
  // Placeholder to avoid breaking the page if Firebase isn't configured yet
  window.FirebaseClient = {
    configured: false,
    config: null,
    init: function(firebaseConfig) {
      // firebaseConfig must be the normal Firebase config object
      if(!firebaseConfig) return console.warn('Firebase config missing');
      this.config = firebaseConfig;
      this.configured = true;
      console.log('Firebase client initialized (placeholder). Please implement firebase initialization in firebase-client.js to enable auth/storage.');
    },
    // stubbed helpers
    signIn: async function(email, password) { throw new Error('Not implemented: signIn'); },
    uploadAvatar: async function(userId, fileBlob) { throw new Error('Not implemented: uploadAvatar'); },
    getUserProfile: async function(userId) { throw new Error('Not implemented: getUserProfile'); }
  };
})();
