// User Profile Management System

class UserProfile {
  constructor() {
    this.currentUser = localStorage.getItem('gratia_current_user') || null;
    this.isGuest = localStorage.getItem('gratia_is_guest') === 'true';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser && !this.isGuest;
  }

  getUserProfile() {
    if (!this.currentUser || this.isGuest) return null;
    
    const profiles = JSON.parse(localStorage.getItem('gratia_user_profiles') || '{}');
    return profiles[this.currentUser] || this.getDefaultProfile();
  }

  getDefaultProfile() {
    return {
      name: this.currentUser || 'Visitante',
      avatar: '',
      banner: '',
      bio: '',
      letterboxdLink: '',
      favoriteMovie: '',
      joinDate: new Date().toISOString()
    };
  }

  updateProfile(updates) {
    if (!this.currentUser || this.isGuest) return false;
    
    const profiles = JSON.parse(localStorage.getItem('gratia_user_profiles') || '{}');
    const current = profiles[this.currentUser] || this.getDefaultProfile();
    
    profiles[this.currentUser] = { ...current, ...updates };
    localStorage.setItem('gratia_user_profiles', JSON.stringify(profiles));
    return true;
  }

  uploadAvatar(base64Data) {
    if (!this.currentUser || this.isGuest) return false;
    return this.updateProfile({ avatar: base64Data });
  }

  uploadBanner(base64Data) {
    if (!this.currentUser || this.isGuest) return false;
    return this.updateProfile({ banner: base64Data });
  }

  updateBio(bio) {
    return this.updateProfile({ bio: bio.substring(0, 200) }); // Max 200 chars
  }

  updateLetterboxdLink(link) {
    return this.updateProfile({ letterboxdLink: link });
  }

  updateFavoriteMovie(movie) {
    return this.updateProfile({ favoriteMovie: movie });
  }

  updateName(name) {
    return this.updateProfile({ name: name });
  }

  logout() {
    localStorage.removeItem('gratia_current_user');
    localStorage.removeItem('gratia_is_guest');
    window.location.href = 'login.html';
  }

  getAllProfiles() {
    return JSON.parse(localStorage.getItem('gratia_user_profiles') || '{}');
  }

  getProfileByUsername(username) {
    const profiles = this.getAllProfiles();
    return profiles[username] || null;
  }
}

// Create global instance
const userProfile = new UserProfile();

// Check if user is logged in on page load
function checkUserSession() {
  const currentUser = localStorage.getItem('gratia_current_user');
  const isGuest = localStorage.getItem('gratia_is_guest') === 'true';
  
  if (!currentUser) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Get display name for current user
function getCurrentUserDisplayName() {
  if (!userProfile.isLoggedIn()) {
    return 'Visitante';
  }
  const profile = userProfile.getUserProfile();
  return profile?.name || userProfile.getCurrentUser();
}

// Get avatar for current user
function getCurrentUserAvatar() {
  if (!userProfile.isLoggedIn()) {
    return 'https://via.placeholder.com/90/334155/fff?text=Guest';
  }
  const profile = userProfile.getUserProfile();
  return profile?.avatar || 'https://via.placeholder.com/90/334155/fff?text=' + userProfile.getCurrentUser().charAt(0).toUpperCase();
}

// Format profile for display in member cards
function getFormattedUserProfile(username) {
  const profiles = userProfile.getAllProfiles();
  const profile = profiles[username];
  
  if (!profile) {
    return {
      name: username,
      avatar: 'https://via.placeholder.com/90/334155/fff?text=' + username.charAt(0).toUpperCase(),
      banner: '',
      bio: 'Sem bio',
      letterboxdLink: '',
      favoriteMovie: 'Não definido'
    };
  }
  
  return {
    name: profile.name || username,
    avatar: profile.avatar || 'https://via.placeholder.com/90/334155/fff?text=' + username.charAt(0).toUpperCase(),
    banner: profile.banner || '',
    bio: profile.bio || 'Sem bio',
    letterboxdLink: profile.letterboxdLink || '',
    favoriteMovie: profile.favoriteMovie || 'Não definido'
  };
}
