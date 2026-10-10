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
      document.body.appendChild(this.menu);

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

        const avatarUpload = event.target.closest('[data-avatar-upload]');
        if (avatarUpload) {
          const scope = avatarUpload.closest('[data-avatar-scope]') || this.overlay;
          scope.querySelector('[data-avatar-input]')?.click();
          return;
        }

        if (event.target.closest('[data-avatar-remove]')) {
          void this.removeAvatar();
          return;
        }

        const emptyAction = event.target.closest('[data-empty-action]')?.dataset.emptyAction;
        if (emptyAction) {
          if (emptyAction === 'progress') {
            window.location.href = 'progress.html';
            return;
          }
          if (emptyAction === 'achievement') {
            window.location.href = 'pencapaian.html';
            return;
          }
          if (emptyAction === 'bio') {
            this.renderPanel('settings');
            window.requestAnimationFrame(() => {
              const bioInput = this.overlay.querySelector('[name="bio"]');
              bioInput?.focus({ preventScroll: false });
              bioInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
          }
        }
      });

      this.overlay.addEventListener('submit', event => {
        const form = event.target.closest('form');
        if (!form) return;
        event.preventDefault();
        if (form.matches('[data-account-profile-form]')) this.saveIdentity(form);
        if (form.matches('[data-account-password-form]')) this.savePassword(form);
      });

      this.overlay.addEventListener('change', event => {
        const input = event.target.closest('[data-avatar-input]');
        if (!input || !input.files?.[0]) return;
        const file = input.files[0];
        input.value = '';
        void this.uploadAvatar(file);
      });

      this.overlay.addEventListener('input', event => {
        const bio = event.target.closest('textarea[name="bio"]');
        if (!bio) return;
        const counter = bio.closest('.account-bio-field')?.querySelector('[data-bio-counter]');
        if (counter) counter.textContent = `${bio.value.length} / 280`;
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

      this.repositionMenu = () => {
        if (!this.menu?.hidden) this.positionMenu();
      };
      window.addEventListener('resize', this.repositionMenu, { passive: true });
      window.addEventListener('orientationchange', this.repositionMenu, { passive: true });
      window.addEventListener('scroll', this.repositionMenu, { passive: true });

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

    avatarMarkup(user = this.currentUser) {
      const avatar = String(user?.avatar || '').trim();
      if (avatar) {
        return `<img class="account-avatar-image" src="${escapeHtml(avatar)}" alt="Foto profil ${escapeHtml(user?.name || 'Penjelajah ANTARA')}">`;
      }
      return `<span class="account-avatar-fallback">${escapeHtml(this.initials(user?.name))}</span>`;
    }

    renderAvatarNode(node, user = this.currentUser) {
      if (!node) return;
      node.replaceChildren();
      const avatar = String(user?.avatar || '').trim();
      if (!avatar) {
        const fallback = document.createElement('span');
        fallback.className = 'account-avatar-fallback';
        fallback.textContent = this.initials(user?.name);
        node.appendChild(fallback);
        return;
      }
      const image = document.createElement('img');
      image.className = 'account-avatar-image';
      image.alt = `Foto profil ${user?.name || 'Penjelajah ANTARA'}`;
      image.src = avatar;
      image.addEventListener('error', () => {
        node.replaceChildren();
        const fallback = document.createElement('span');
        fallback.className = 'account-avatar-fallback';
        fallback.textContent = this.initials(user?.name);
        node.appendChild(fallback);
      }, { once: true });
      node.appendChild(image);
    }

    syncMenu() {
      if (!this.currentUser || !this.menu) return;
      this.renderAvatarNode($('[data-account-menu-initials]', this.menu), this.currentUser);
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
      this.positionMenu();
      // Re-measure after the browser has applied fonts/layout, then animate in.
      window.requestAnimationFrame(() => {
        this.positionMenu();
        this.menu.classList.add('is-open');
      });
      this.trigger.setAttribute('aria-expanded', 'true');
    }

    positionMenu() {
      if (!this.menu || !this.trigger) return;
      const accountFrame = this.trigger.querySelector('.profile-login-frame') || this.trigger;
      const accountRect = accountFrame.getBoundingClientRect();
      const avatarRect = this.avatarTrigger?.getBoundingClientRect?.() || accountRect;
      const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const gutter = viewportWidth <= 430 ? 8 : 10;
      const gap = viewportWidth <= 700 ? 6 : 7;

      // The menu is the account module's continuation: its left edge starts at
      // the profile socket and its right edge ends exactly at the identity frame.
      // This is measured from the live layout, so desktop/medium/mobile breakpoints
      // all stay aligned without per-resolution magic numbers.
      const identityLeft = Math.min(avatarRect.left, accountRect.left);
      const identityRight = Math.max(avatarRect.right, accountRect.right);
      const availableWidth = Math.max(0, viewportWidth - gutter * 2);
      const naturalWidth = Math.max(1, identityRight - identityLeft);
      const menuWidth = Math.min(naturalWidth, availableWidth);
      let left = identityLeft;

      if (left < gutter) left = gutter;
      if (left + menuWidth > viewportWidth - gutter) left = viewportWidth - gutter - menuWidth;

      const anchorBottom = Math.max(accountRect.bottom, avatarRect.bottom);
      const menuTop = anchorBottom + gap;

      this.menu.style.setProperty('--account-menu-left', `${Math.round(left)}px`);
      this.menu.style.setProperty('--account-menu-top', `${Math.round(menuTop)}px`);
      this.menu.style.setProperty('--account-menu-width', `${Math.round(menuWidth)}px`);

      // Tiny-height landscape devices still keep the whole menu reachable.
      const menuHeight = this.menu.offsetHeight || 0;
      const bottom = menuTop + menuHeight;
      if (menuHeight && bottom > viewportHeight - gutter) {
        const maxTop = Math.max(anchorBottom + 2, viewportHeight - menuHeight - gutter);
        this.menu.style.setProperty('--account-menu-top', `${Math.round(maxTop)}px`);
      }
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
      if (tab === 'profile') { this.hydrateProgressCard(content); this.hydrateAchievementCard(content); }
    }

    async hydrateProgressCard(root) {
      const value = $('[data-profile-progress]', root);
      const detail = $('[data-profile-progress-detail]', root);
      if (!value || !detail) return;
      try {
        const response = await fetch('api/progress/get.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) return;
        const overall = payload.overall || {};
        value.textContent = `${Number(overall.progress) || 0}%`;
        detail.textContent = `${overall.completedMilestones || 0} dari ${overall.totalMilestones || 0} milestone tercatat. Klik untuk melihat detail.`;
      } catch (error) {
        console.warn('ANTARA profile progress summary', error);
      }
    }

    async hydrateAchievementCard(root) {
      const value = $('[data-profile-achievements]', root);
      const detail = $('[data-profile-achievements-detail]', root);
      if (!value || !detail) return;
      try {
        const response = await fetch('api/achievements/get.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) return;
        const summary = payload.summary || {};
        value.textContent = `${Number(summary.unlocked) || 0} / ${Number(summary.total) || 30}`;
        detail.textContent = `${Number(summary.percent) || 0}% koleksi terbuka. Klik untuk melihat medali.`;
      } catch (error) {
        console.warn('ANTARA achievement summary', error);
      }
    }

    profileTemplate() {
      const u = this.currentUser;
      return ` <div class="account-profile-layout"> <section class="account-id-card"> <div class="account-profile-avatar-wrap" data-avatar-scope> <div class="account-profile-avatar">${this.avatarMarkup(u)}</div> <input class="account-avatar-input" data-avatar-input type="file" accept="image/jpeg,image/png,image/webp" hidden> <div class="account-avatar-actions"> <button type="button" class="account-avatar-edit" data-avatar-upload>GANTI FOTO</button> ${u.avatar ? '<button type="button" class="account-avatar-remove" data-avatar-remove>HAPUS</button>' : ''} </div> </div> <div class="account-profile-copy"> <h3>${escapeHtml(u.name || 'Penjelajah ANTARA')}</h3> <p>${escapeHtml(u.username ? `@${u.username}` : 'Username belum tersedia')}</p> <dl> <div><dt>EMAIL</dt><dd>${escapeHtml(u.email || 'Belum tersedia')}</dd></div> <div><dt>BERGABUNG</dt><dd>${escapeHtml(formatJoined(u.createdAt))}</dd></div> </dl> </div> </section> <section class="account-profile-empty-grid"> <button type="button" class="account-empty-card account-empty-bio ${u.bio ? 'has-bio' : ''}" data-empty-action="bio"> <span class="account-empty-code">BIO</span> <strong>${u.bio ? 'BIO PENJELAJAH' : 'TAMBAH BIO'}</strong> <small>${u.bio ? escapeHtml(u.bio) : 'Ceritakan sedikit tentang dirimu sebagai penjelajah ANTARA.'}</small> </button> <button type="button" class="account-empty-card" data-empty-action="progress"> <span class="account-empty-code">PROGRESS</span><strong data-profile-progress>0%</strong><small data-profile-progress-detail>Memuat rekam jejak eksplorasi...</small> </button> <button type="button" class="account-empty-card" data-empty-action="achievement"> <span class="account-empty-code">PENCAPAIAN</span><strong data-profile-achievements>0 / 30</strong><small data-profile-achievements-detail>Memuat koleksi medali...</small> </button> </section> </div>`;
    }

    settingsTemplate() {
      const u = this.currentUser;
      return ` <div class="account-settings-layout"> <section class="account-settings-card"> <header><small>IDENTITAS</small><h3>DATA AKUN</h3></header> <form data-account-profile-form novalidate> <label><span>NAMA</span><input name="fullName" maxlength="60" value="${escapeHtml(u.name || '')}" autocomplete="name" required></label> <label><span>USERNAME</span><input name="username" maxlength="20" value="${escapeHtml(u.username || '')}" autocomplete="username" required></label> <label><span>EMAIL</span><input name="email" type="email" maxlength="254" value="${escapeHtml(u.email || '')}" autocomplete="email" required></label> <label class="account-bio-field"><span>BIO <em data-bio-counter>${String(u.bio || '').length} / 280</em></span><textarea name="bio" maxlength="280" rows="4" placeholder="Contoh: Mahasiswa IT yang suka eksplorasi antariksa, coding, dan belajar hal baru.">${escapeHtml(u.bio || '')}</textarea></label> <div class="account-form-message" data-form-message></div> <button type="submit" class="account-save-button">SIMPAN IDENTITAS</button> </form> </section> <section class="account-settings-card"> <header><small>KEAMANAN</small><h3>GANTI KATA SANDI</h3></header> <form data-account-password-form novalidate> <label><span>KATA SANDI SAAT INI</span><input name="currentPassword" type="password" autocomplete="current-password" required></label> <label><span>KATA SANDI BARU</span><input name="newPassword" type="password" minlength="8" autocomplete="new-password" required></label> <label><span>ULANGI KATA SANDI BARU</span><input name="confirmPassword" type="password" minlength="8" autocomplete="new-password" required></label> <div class="account-form-message" data-form-message></div> <button type="submit" class="account-save-button">PERBARUI KATA SANDI</button> </form> </section> <section class="account-settings-card account-settings-note" data-avatar-scope> <header><small>PROFIL</small><h3>FOTO PROFIL</h3></header> <p>Pilih JPG, PNG, atau WebP. Foto akan dipotong persegi dan dikompres otomatis agar tetap ringan.</p> <input class="account-avatar-input" data-avatar-input type="file" accept="image/jpeg,image/png,image/webp" hidden> <div class="account-avatar-settings-actions"> <button type="button" class="account-early-button" data-avatar-upload>PILIH FOTO</button> ${u.avatar ? '<button type="button" class="account-avatar-remove" data-avatar-remove>HAPUS FOTO</button>' : ''} </div> </section> </div>`;
    }

    async prepareAvatar(file) {
      if (!(file instanceof File) || !/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        throw new Error('Format foto harus JPG, PNG, atau WebP.');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Foto asli maksimal 10 MB.');
      }

      const url = URL.createObjectURL(file);
      try {
        const image = await new Promise((resolve, reject) => {
          const node = new Image();
          node.decoding = 'async';
          node.onload = () => resolve(node);
          node.onerror = () => reject(new Error('Foto tidak dapat dibaca browser.'));
          node.src = url;
        });
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!width || !height) throw new Error('Resolusi foto tidak valid.');

        const side = Math.min(width, height);
        const sx = Math.max(0, (width - side) / 2);
        const sy = Math.max(0, (height - side) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Browser tidak dapat memcara foto.');
        ctx.fillStyle = '#07111d';
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(image, sx, sy, side, side, 0, 0, 512, 512);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84));
        if (!blob) throw new Error('Foto gagal dikompres.');
        return new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() });
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    setAvatarBusy(busy) {
      $$('[data-avatar-upload], [data-avatar-remove]', this.overlay).forEach(button => {
        button.disabled = busy;
      });
    }

    async uploadAvatar(file) {
      this.setAvatarBusy(true);
      this.showToast('Memcara foto profil...');
      try {
        const prepared = await this.prepareAvatar(file);
        const fd = new FormData();
        fd.append('action', 'avatar');
        fd.append('avatar', prepared, 'avatar.jpg');
        const response = await fetch('api/account/update.php', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          body: fd
        });
        let data = {};
        try { data = await response.json(); } catch { data = { success: false, message: 'Respons server tidak valid.' }; }
        if (!response.ok || !data.success || !data.user) throw new Error(data.message || 'Foto profil gagal disimpan.');
        this.currentUser = data.user;
        if (window.ANTARAAuth) window.ANTARAAuth.currentUser = data.user;
        window.dispatchEvent(new CustomEvent('antara:auth-change', { detail: { user: data.user, source: 'avatar-update', confirmed: true } }));
        this.showToast('Foto profil berhasil diperbarui.');
      } catch (error) {
        this.showToast(error.message || 'Foto profil gagal diperbarui.', 'error');
      } finally {
        this.setAvatarBusy(false);
      }
    }

    async removeAvatar() {
      this.setAvatarBusy(true);
      try {
        const result = await this.requestUpdate({ action: 'avatar-remove' });
        this.currentUser = result.user;
        if (window.ANTARAAuth) window.ANTARAAuth.currentUser = result.user;
        window.dispatchEvent(new CustomEvent('antara:auth-change', { detail: { user: result.user, source: 'avatar-remove', confirmed: true } }));
        this.showToast('Foto profil dihapus.');
      } catch (error) {
        this.showToast(error.message || 'Foto profil gagal dihapus.', 'error');
      } finally {
        this.setAvatarBusy(false);
      }
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
      $$('input, textarea', form).forEach(input => { input.disabled = busy; });
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
          email: fd.get('email'),
          bio: fd.get('bio')
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
