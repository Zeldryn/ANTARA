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

  const auth = {
    currentUser: null,

    async getCurrentUser() {
      try {
        const payload = await jsonRequest('api/auth/me.php');
        this.currentUser = payload.authenticated ? payload.user : null;
        window.dispatchEvent(new CustomEvent('antara:auth-change', { detail: { user: this.currentUser } }));
        return this.currentUser;
      } catch (error) {
        console.warn('[ANTARA Auth] Gagal membaca sesi:', error.message);
        this.currentUser = null;
        return null;
      }
    },

    async register(data) {
      const payload = await jsonRequest('api/auth/register.php', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      this.currentUser = payload.user ?? null;
      window.dispatchEvent(new CustomEvent('antara:auth-change', { detail: { user: this.currentUser } }));
      return payload;
    },

    async login(identifier, password) {
      const payload = await jsonRequest('api/auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });
      this.currentUser = payload.user ?? null;
      window.dispatchEvent(new CustomEvent('antara:auth-change', { detail: { user: this.currentUser } }));
      return payload;
    },

    async logout() {
      const payload = await jsonRequest('api/auth/logout.php', { method: 'POST' });
      this.currentUser = null;
      window.dispatchEvent(new CustomEvent('antara:auth-change', { detail: { user: null } }));
      return payload;
    }
  };

  window.ANTARAAuth = auth;
})();
