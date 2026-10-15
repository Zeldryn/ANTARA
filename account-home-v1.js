(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));

  const formatJoined = value => {
    if (!value) return 'Belum tersedia';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return 'Belum tersedia';
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(parsed);
  };

  class AccountHomeUI {
    constructor() {
      this.hud = $('#cockpit-profile-hud');
      this.trigger = $('#profile-hud-trigger');
      this.avatarTrigger = $('#profile-avatar-trigger');
      this.currentUser = null;
      this.menu = null;
      this.overlay = null;
      this.panel = null;
      this.toastTimer = 0;

      if (!this.hud || !this.trigger) return;
      this.mount();
      this.bind();
    }

    mount() {
      this.menu = document.createElement('div');
      this.menu.className = 'account-quick-menu';
      this.menu.id = 'account-quick-menu';
      this.menu.hidden = true;
      this.menu.innerHTML = ` <div class="account-quick-head"> <span class="account-quick-avatar" data-account-menu-initials>?</span> <span class="account-quick-identity"> <strong data-account-menu-name>Penjelajah</strong> <small data-account-menu-username>@antara</small> </span> </div> <div class="account-quick-actions"> <button type="button" data-account-action="profile"> <span class="account-quick-icon" aria-hidden="true">◎</span> <span><strong>PROFIL</strong><small>Lihat identitas penjelajah</small></span> </button> <button type="button" data-account-action="settings"> <span class="account-quick-icon" aria-hidden="true">⚙</span> <span><strong>PENGATURAN</strong><small>Nama, email, dan keamanan</small></span> </button> <button type="button" class="account-quick-logout" data-account-action="logout"> <span class="account-quick-icon" aria-hidden="true">↪</span> <span><strong>KELUAR</strong><small>Akhiri sesi ANTARA</small></span> </button> </div>`;
      this.hud.appendChild(this.menu);

      this.overlay = document.createElement('div');
      this.overlay.className = 'account-overlay';
      this.overlay.id = 'account-overlay';
      this.overlay.hidden = true;
      this.overlay.innerHTML = ` <section class="account-panel" role="dialog" aria-modal="true" aria-labelledby="account-panel-title"> <div class="account-panel-scan" aria-hidden="true"></div> <header class="account-panel-header"> <div> <small>ANTARA ID / PERSONAL CONSOLE</small> <h2 id="account-panel-title">PROFIL PENJELAJAH</h2> </div> <button type="button" class="account-panel-close" data-account-close aria-label="Tutup panel akun">×</button> </header> <nav class="account-panel-tabs" aria-label="Menu akun ANTARA"> <button type="button" data-account-tab="profile" class="is-active">PROFIL</button> <button type="button" data-account-tab="settings">PENGATURAN</button> </nav> <div class="account-panel-content" data-account-content></div> </section> <div class="account-toast" role="status" aria-live="polite" data-account-toast></div>`;
      document.body.appendChild(this.overlay);
      this.panel = $('.account-panel', this.overlay);
    }

    bind() {
      window.addEventListener('antara:auth-change', event => {
        this.currentUser = event.detail?.user ?? null;
        this.syncMenu();
        if (!this.currentUser) {
          this.closeMenu();
          this.closePanel();
        }
      });

      window.addEventListener('antara:profile-request', event => {
        if (!this.currentUser) return;
        event.preventDefault();
        this.toggleMenu();
      });

      this.menu.addEventListener('click', event => {
        const action = event.target.closest('[data-account-action]')?.dataset.accountAction;
        if (!action) return;
        if (action === 'profile') this.openPanel('profile');
        if (action === 'settings') this.openPanel('settings');
        if (action === 'logout') this.logout();
      });

      this.overlay.addEventListener('click', event => {
        if (event.target === this.overlay || event.target.closest('[data-account-close]')) {
          this.closePanel();
          return;
        }
        const tab = event.target.closest('[data-account-tab]')?.dataset.accountTab;
        if (tab) this.renderPanel(tab);

        if (event.target.closest('[data-avatar-early]')) {
          this.showToast('Foto profil masih EARLY ACCESS. Bagian ini belum dibuka.');
        }

        const emptyAction = event.target.closest('[data-empty-action]')?.dataset.emptyAction;
        if (emptyAction) {
          const label = emptyAction === 'bio' ? 'Bio' : emptyAction === 'progress' ? 'Progress' : 'Pencapaian';
          this.showToast(`${label} belum memiliki data. Modul ini siap dihubungkan nanti.`);
        }
      });

      this.overlay.addEventListener('submit', event => {
        const form = event.target.closest('form');
        if (!form) return;
        event.preventDefault();
        if (form.matches('[data-account-profile-form]')) this.saveIdentity(form);
        if (form.matches('[data-account-password-form]')) this.savePassword(form);
      });

      document.addEventListener('click', event => {
        if (this.menu.hidden) return;
        if (this.menu.contains(event.target) || this.trigger.contains(event.target) || this.avatarTrigger?.contains(event.target)) return;
        this.closeMenu();
      });

      document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (!this.overlay.hidden) this.closePanel();
        else this.closeMenu();
      });

      // The HUD's own auth reader will fire antara:auth-change. This fallback also
      // covers script load ordering when the session was already resolved.
      window.setTimeout(() => {
        this.currentUser = window.ANTARAAuth?.currentUser ?? this.currentUser;
        this.syncMenu();
      }, 350);
    }

    initials(name) {
      return String(name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || '?';
    }

    syncMenu() {
      if (!this.currentUser || !this.menu) return;
      $('[data-account-menu-initials]', this.menu).textContent = this.initials(this.currentUser.name);
      $('[data-account-menu-name]', this.menu).textContent = this.currentUser.name || 'Penjelajah';
      $('[data-account-menu-username]', this.menu).textContent = this.currentUser.username ? `@${this.currentUser.username}` : (this.currentUser.email || 'ANTARA ID');
      if (!this.overlay.hidden) {
        const activeTab = $('.account-panel-tabs.is-active', this.overlay)?.dataset.accountTab || 'profile';
        this.renderPanel(activeTab);
      }
    }

    toggleMenu() {
      if (!this.currentUser) return;
      this.menu.hidden ? this.openMenu() : this.closeMenu();
    }

    openMenu() {
      this.syncMenu();
      this.menu.hidden = false;
      this.menu.classList.add('is-open');
      this.trigger.setAttribute('aria-expanded', 'true');
    }

    closeMenu() {
      if (!this.menu) return;
      this.menu.classList.remove('is-open');
      this.menu.hidden = true;
      this.trigger?.removeAttribute('aria-expanded');
    }

    openPanel(tab = 'profile') {
      if (!this.currentUser) return;
      this.closeMenu();
      this.overlay.hidden = false;
      document.documentElement.classList.add('account-panel-open');
      this.renderPanel(tab);
      window.setTimeout(() => this.panel?.classList.add('is-open'), 10);
    }

    closePanel() {
      if (!this.overlay || this.overlay.hidden) return;
      this.panel?.classList.remove('is-open');
      document.documentElement.classList.remove('account-panel-open');
      window.setTimeout(() => { this.overlay.hidden = true; }, 140);
    }

    renderPanel(tab) {
      if (!this.currentUser) return;
      $$('.account-panel-tabs button', this.overlay).forEach(button => button.classList.toggle('is-active', button.dataset.accountTab === tab));
      $('#account-panel-title', this.overlay).textContent = tab === 'settings' ? 'PENGATURAN AKUN' : 'PROFIL PENJELAJAH';
      const content = $('[data-account-content]', this.overlay);
      content.innerHTML = tab === 'settings' ? this.settingsTemplate() : this.profileTemplate();
    }

    profileTemplate() {
      const u = this.currentUser;
      return ` <div class="account-profile-layout"> <section class="account-id-card"> <div class="account-profile-avatar-wrap"> <div class="account-profile-avatar">${escapeHtml(this.initials(u.name))}</div> <button type="button" class="account-avatar-edit" data-avatar-early>GANTI FOTO <span>EARLY ACCESS</span></button> </div> <div class="account-profile-copy"> <h3>${escapeHtml(u.name || 'Penjelajah ANTARA')}</h3> <p>${escapeHtml(u.username ? `@${u.username}` : 'Username belum tersedia')}</p> <dl> <div><dt>EMAIL</dt><dd>${escapeHtml(u.email || 'Belum tersedia')}</dd></div> <div><dt>BERGABUNG</dt><dd>${escapeHtml(formatJoined(u.createdAt))}</dd></div> </dl> </div> </section> <section class="account-profile-empty-grid"> <button type="button" class="account-empty-card account-empty-bio" data-empty-action="bio"> <span class="account-empty-code">BIO</span><strong>BELUM ADA BIO</strong><small>Nanti bio penjelajah akan tampil di sini.</small> </button> <button type="button" class="account-empty-card" data-empty-action="progress"> <span class="account-empty-code">PROGRESS</span><strong>0%</strong><small>Belum ada progress eksplorasi yang ditampilkan.</small> </button> <button type="button" class="account-empty-card" data-empty-action="achievement"> <span class="account-empty-code">PENCAPAIAN</span><strong>0</strong><small>Belum ada badge atau pencapaian.</small> </button> </section> </div>`;
    }

    settingsTemplate() {
      const u = this.currentUser;
      return ` <div class="account-settings-layout"> <section class="account-settings-card"> <header><small>IDENTITAS</small><h3>DATA AKUN</h3></header> <form data-account-profile-form novalidate> <label><span>NAMA</span><input name="fullName" maxlength="60" value="${escapeHtml(u.name || '')}" autocomplete="name" required></label> <label><span>USERNAME</span><input name="username" maxlength="20" value="${escapeHtml(u.username || '')}" autocomplete="username" required></label> <label><span>EMAIL</span><input name="email" type="email" maxlength="254" value="${escapeHtml(u.email || '')}" autocomplete="email" required></label> <div class="account-form-message" data-form-message></div> <button type="submit" class="account-save-button">SIMPAN IDENTITAS</button> </form> </section> <section class="account-settings-card"> <header><small>KEAMANAN</small><h3>GANTI KATA SANDI</h3></header> <form data-account-password-form novalidate> <label><span>KATA SANDI SAAT INI</span><input name="currentPassword" type="password" autocomplete="current-password" required></label> <label><span>KATA SANDI BARU</span><input name="newPassword" type="password" minlength="8" autocomplete="new-password" required></label> <label><span>ULANGI KATA SANDI BARU</span><input name="confirmPassword" type="password" minlength="8" autocomplete="new-password" required></label> <div class="account-form-message" data-form-message></div> <button type="submit" class="account-save-button">PERBARUI KATA SANDI</button> </form> </section> <section class="account-settings-card account-settings-note"> <header><small>PROFIL</small><h3>FOTO PROFIL</h3></header> <p>Upload foto profil belum dibuka pada versi ini.</p> <button type="button" class="account-early-button" data-avatar-early>COBA FITUR <span>EARLY ACCESS</span></button> </section> </div>`;
    }

    async requestUpdate(payload) {
      const response = await fetch('api/account/update.php', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      let data = {};
      try { data = await response.json(); } catch { data = { success: false, message: 'Respons server tidak valid.' }; }
      if (!response.ok || !data.success) {
        const error = new Error(data.message || 'Perubahan akun gagal disimpan.');
        error.payload = data;
        throw error;
      }
      return data;
    }

    setFormMessage(form, text, type = '') {
      const node = $('[data-form-message]', form);
      if (!node) return;
      node.textContent = text || '';
      node.dataset.state = type;
    }

    setFormBusy(form, busy) {
      const button = $('button[type="submit"]', form);
      if (button) {
        button.disabled = busy;
        button.dataset.originalLabel ||= button.textContent;
        button.textContent = busy ? 'MENYIMPAN...' : button.dataset.originalLabel;
      }
      $$('input', form).forEach(input => { input.disabled = busy; });
    }

    async saveIdentity(form) {
      this.setFormMessage(form, '');
      this.setFormBusy(form, true);
      const fd = new FormData(form);
      try {
        const result = await this.requestUpdate({
          action: 'profile',
          fullName: fd.get('fullName'),
          username: fd.get('username'),
          email: fd.get('email')
        });
        this.currentUser = result.user;
        if (window.ANTARAAuth) window.ANTARAAuth.currentUser = result.user;
        window.dispatchEvent(new CustomEvent('antara:auth-change', { detail: { user: result.user } }));
        this.setFormMessage(form, result.message || 'Identitas berhasil diperbarui.', 'success');
        this.showToast('Identitas akun diperbarui.');
      } catch (error) {
        this.setFormMessage(form, error.message, 'error');
      } finally {
        this.setFormBusy(form, false);
      }
    }

    async savePassword(form) {
      this.setFormMessage(form, '');
      this.setFormBusy(form, true);
      const fd = new FormData(form);
      try {
        const result = await this.requestUpdate({
          action: 'password',
          currentPassword: fd.get('currentPassword'),
          newPassword: fd.get('newPassword'),
          confirmPassword: fd.get('confirmPassword')
        });
        form.reset();
        this.setFormMessage(form, result.message || 'Kata sandi berhasil diperbarui.', 'success');
        this.showToast('Kata sandi berhasil diperbarui.');
      } catch (error) {
        this.setFormMessage(form, error.message, 'error');
      } finally {
        this.setFormBusy(form, false);
      }
    }

    async logout() {
      const auth = window.ANTARAAuth;
      if (!auth?.logout) {
        window.location.assign('daftar.html?mode=login');
        return;
      }
      try {
        await auth.logout();
        this.currentUser = null;
        this.closeMenu();
        this.closePanel();
        this.showToast('Sesi ANTARA telah ditutup.');
      } catch (error) {
        this.showToast(error.message || 'Gagal keluar dari sesi.', 'error');
      }
    }

    showToast(message, type = '') {
      const node = $('[data-account-toast]', this.overlay);
      if (!node) return;
      window.clearTimeout(this.toastTimer);
      node.textContent = message;
      node.dataset.state = type;
      node.classList.add('is-visible');
      this.toastTimer = window.setTimeout(() => node.classList.remove('is-visible'), 2600);
    }
  }

  new AccountHomeUI();
})();
