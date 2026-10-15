(() => {
  const jsonRequest = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = { success: false, message: 'Respons server ANTARA tidak valid.' };
    }

    if (!response.ok) {
      const error = new Error(payload.message || `Request gagal (${response.status}).`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  };

  const guestWasActive = () => {
    try {
      if (window.ANTARAGuestData?.isActive) return window.ANTARAGuestData.isActive();
      return localStorage.getItem('antara-guest-session-v1') === 'active';
    } catch {
      return false;
    }
  };

  const finishGuestAccountSwitch = wasGuest => {
    if (!wasGuest) return;
    if (window.ANTARAGuestData?.completeAccountSwitch) {
      window.ANTARAGuestData.completeAccountSwitch();
      return;
    }
    try { localStorage.removeItem('antara-guest-session-v1'); } catch {}
  };

  const auth = {
    currentUser: null,
    userStateVersion: 0,

    setCurrentUser(user, source = 'local', extra = {}) {
      this.userStateVersion += 1;
      this.currentUser = user ?? null;
      window.dispatchEvent(new CustomEvent('antara:auth-change', {
        detail: { user: this.currentUser, source, confirmed: true, ...extra }
      }));
      return this.currentUser;
    },

    async getCurrentUser() {
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const stateVersionAtStart = this.userStateVersion;
        try {
          const payload = await jsonRequest('api/auth/me.php');
          // A profile/login/logout mutation may have completed while this
          // session check was in flight. Never let that older snapshot
          // overwrite the newer local identity.
          if (this.userStateVersion !== stateVersionAtStart) {
            return this.currentUser;
          }
          return this.setCurrentUser(
            payload.authenticated ? payload.user : null,
            'session-check'
          );
        } catch (error) {
          lastError = error;
          if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 180 * (attempt + 1)));
        }
      }

      // A temporary network/database problem is not proof that the user logged
      // out. Keep the last confirmed identity in memory and do not emit a fake
      // logout event. A later refresh/check can recover via the server token.
      console.warn('[ANTARA Auth] Sesi belum bisa diverifikasi:', lastError?.message || 'unknown error');
      return this.currentUser;
    },

    async register(data) {
      const wasGuest = guestWasActive();
      const payload = await jsonRequest('api/auth/register.php', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const user = payload.user ?? null;
      this.setCurrentUser(user, 'register', { notifications: payload.notifications || [] });
      if (this.currentUser) finishGuestAccountSwitch(wasGuest);
      return payload;
    },

    async login(identifier, password) {
      const wasGuest = guestWasActive();
      const payload = await jsonRequest('api/auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });
      const user = payload.user ?? null;
      this.setCurrentUser(user, 'login', { notifications: payload.notifications || [] });
      if (this.currentUser) finishGuestAccountSwitch(wasGuest);
      return payload;
    },

    async logout() {
      const payload = await jsonRequest('api/auth/logout.php', { method: 'POST' });
      this.setCurrentUser(null, 'logout');
      return payload;
    }
  };

  window.ANTARAAuth = auth;
})();
