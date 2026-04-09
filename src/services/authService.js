import { storageService } from './storageService';

export const authService = {
  getCurrentUser: () => {
    try {
      const db = storageService.getDb();
      if (!db.session?.user_id) {
        return authService.autoLogin();
      }
      const user = db.users.find(u => u.id === db.session.user_id);
      if (!user) {
        return authService.autoLogin();
      }
      return user;
    } catch (e) {
      console.error('[authService Error]', e);
      return null;
    }
  },

  autoLogin: () => {
    try {
      const db = storageService.getDb();
      const defaultUser = db.users[0];
      if (defaultUser) {
        db.session = { user_id: defaultUser.id };
        storageService.setDb(db);
        return defaultUser;
      }
      return null;
    } catch (e) {
      console.error('[authService Error autoLogin]', e);
      return null;
    }
  },

  login: (email) => {
    try {
      const db = storageService.getDb();
      let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        user = {
          id: storageService.generateId('user'),
          email: email.toLowerCase(),
          role: 'user',
          vault_id: storageService.generateId('vault')
        };
        db.users.push(user);
      }
      
      db.session = { user_id: user.id };
      storageService.setDb(db);
      return user;
    } catch (e) {
      console.error('[authService Error login]', e);
      return null;
    }
  },

  logout: () => {
    try {
      const db = storageService.getDb();
      db.session = { user_id: null };
      storageService.setDb(db);
      return true;
    } catch (e) {
      console.error('[authService Error logout]', e);
      return false;
    }
  },

  updateUser: (updates) => {
      try {
          const db = storageService.getDb();
          const userId = db.session?.user_id;
          if (!userId) return null;
          
          const userIndex = db.users.findIndex(u => u.id === userId);
          if (userIndex === -1) return null;

          db.users[userIndex] = { ...db.users[userIndex], ...updates };
          storageService.setDb(db);
          return db.users[userIndex];
      } catch (e) {
          console.error('[authService Error updateUser]', e);
          return null;
      }
  }
};
