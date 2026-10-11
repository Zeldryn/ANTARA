(() => {
  const registerForm = document.getElementById('registration-form');
  const loginForm = document.getElementById('login-form');
  if (!registerForm || !loginForm) return;

  const auth = window.ANTARAAuth;
  const registerNote = document.getElementById('form-note');
  const loginNote = document.getElementById('login-note');
  const modeButtons = [...document.querySelectorAll('[data-auth-mode]')];
  const sessionPanel = document.getElementById('account-session');
  const sessionName = document.getElementById('account-session-name');
  const sessionEmail = document.getElementById('account-session-email');
  const modeSwitch = document.querySelector('.auth-mode-switch');
  const logoutButton = document.getElementById('logout-button');
  const title = document.querySelector('.console-head h2');
  const headCode = document.querySelector('.console-head p');
  const briefTitle = document.getElementById('registration-title');
  const briefStatus = document.querySelector('.brief-data .ready');

  const fields = {
    fullName: document.getElementById('full-name'),
    username: document.getElementById('username'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirm-password'),
    terms: document.getElementById('terms')
  };

  const loginFields = {
    identifier: document.getElementById('login-identifier'),
    password: document.getElementById('login-password')
  };

  let activeMode = 'register';

  const setNote = (element, message, type = '') => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-success', type === 'success');
    element.classList.toggle('is-error', type === 'error');
  };

  const setRegisterError = (input, message = '') => {
    if (!input) return;
    const target = registerForm.querySelector(`[data-error-for="${input.id}"]`);
    const group = input.closest('.field-group');
    if (target) target.textContent = message;
    if (group) group.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  const setLoginError = (input, message = '') => {
    if (!input) return;
    const target = loginForm.querySelector(`[data-login-error-for="${input.id}"]`);
    const group = input.closest('.field-group');
    if (target) target.textContent = message;
    if (group) group.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  const validateRegisterField = input => {
    if (!input) return true;
    let message = '';

    if (input === fields.fullName && !input.value.trim()) message = 'Masukkan nama penjelajah.';
    if (input === fields.username) {
      const value = input.value.trim();
      if (!value) message = 'Masukkan username.';
      else if (value.length < 3) message = 'Username minimal 3 karakter.';
      else if (!/^[A-Za-z0-9_]+$/.test(value)) message = 'Gunakan huruf, angka, atau underscore.';
    }
    if (input === fields.email) {
      const value = input.value.trim();
      if (!value) message = 'Masukkan alamat email.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Format email belum benar.';
    }
    if (input === fields.password) {
      if (!input.value) message = 'Masukkan kata sandi.';
      else if (input.value.length < 8) message = 'Kata sandi minimal 8 karakter.';
      else if (input.value.length > 128) message = 'Kata sandi maksimal 128 karakter.';
    }
    if (input === fields.confirmPassword) {
      if (!input.value) message = 'Ulangi kata sandi.';
      else if (input.value !== fields.password.value) message = 'Konfirmasi kata sandi belum sama.';
    }

    setRegisterError(input, message);
    return !message;
  };

  const validateLoginField = input => {
    let message = '';
    if (input === loginFields.identifier && !input.value.trim()) message = 'Masukkan username atau email.';
    if (input === loginFields.password && !input.value) message = 'Masukkan kata sandi.';
    setLoginError(input, message);
    return !message;
  };

  const applyServerErrors = errors => {
    if (!errors || typeof errors !== 'object') return;
    const map = {
      fullName: fields.fullName,
      username: fields.username,
      email: fields.email,
      password: fields.password,
      confirmPassword: fields.confirmPassword
    };
    Object.entries(errors).forEach(([key, message]) => {
      if (map[key]) setRegisterError(map[key], String(message));
    });
  };

  const setMode = mode => {
    activeMode = mode === 'login' ? 'login' : 'register';
    const isLogin = activeMode === 'login';
    registerForm.hidden = isLogin;
    loginForm.hidden = !isLogin;

    modeButtons.forEach(button => {
      const active = button.dataset.authMode === activeMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });

    if (title) title.textContent = isLogin ? 'Masuk ke Identitas Penjelajah' : 'Buat Identitas Penjelajah';
    if (headCode) headCode.textContent = isLogin ? 'ANTARA ID // ACCESS' : 'ANTARA ID // REGISTRATION';
    if (briefTitle) briefTitle.textContent = isLogin
      ? 'Lanjutkan perjalananmu bersama ANTARA.'
      : 'Daftar untuk memulai perjalananmu bersama ANTARA.';
    if (briefStatus) briefStatus.textContent = isLogin ? 'SIAP MASUK' : 'SIAP DAFTAR';

    const url = new URL(window.location.href);
    if (isLogin) url.searchParams.set('mode', 'login');
    else url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
  };

  Object.values(fields).forEach(input => {
    if (!input || input.type === 'checkbox') return;
    input.addEventListener('blur', () => validateRegisterField(input));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateRegisterField(input);
      if (input === fields.password && fields.confirmPassword.value) validateRegisterField(fields.confirmPassword);
    });
  });

  Object.values(loginFields).forEach(input => {
    input?.addEventListener('blur', () => validateLoginField(input));
    input?.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateLoginField(input);
    });
  });

  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.textContent = showing ? 'LIHAT' : 'TUTUP';
      button.setAttribute('aria-label', showing ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi');
    });
  });

  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.authMode)));

  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!auth?.register) {
      setNote(registerNote, 'Modul autentikasi ANTARA tidak termuat.', 'error');
      return;
    }

    const valid = [fields.fullName, fields.username, fields.email, fields.password, fields.confirmPassword]
      .map(validateRegisterField)
      .every(Boolean);

    const termsError = registerForm.querySelector('[data-error-for="terms"]');
    if (!fields.terms.checked) termsError.textContent = 'Persetujuan diperlukan untuk melanjutkan.';
    else termsError.textContent = '';

    if (!valid || !fields.terms.checked) {
      registerForm.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    registerForm.classList.add('is-submitting');
    setNote(registerNote, 'Mengaktifkan identitas penjelajah...', '');

    try {
      const payload = await auth.register({
        fullName: fields.fullName.value.trim(),
        username: fields.username.value.trim(),
        email: fields.email.value.trim(),
        password: fields.password.value,
        confirmPassword: fields.confirmPassword.value
      });
      setNote(registerNote, payload.message || 'Identitas berhasil dibuat.', 'success');
      window.setTimeout(() => window.location.assign('index.html'), 450);
    } catch (error) {
      applyServerErrors(error.payload?.errors);
      setNote(registerNote, error.payload?.message || error.message || 'Pendaftaran gagal.', 'error');
    } finally {
      registerForm.classList.remove('is-submitting');
    }
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!auth?.login) {
      setNote(loginNote, 'Modul autentikasi ANTARA tidak termuat.', 'error');
      return;
    }

    const valid = Object.values(loginFields).map(validateLoginField).every(Boolean);
    if (!valid) {
      loginForm.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    loginForm.classList.add('is-submitting');
    setNote(loginNote, 'Memverifikasi identitas...', '');

    try {
      const payload = await auth.login(loginFields.identifier.value.trim(), loginFields.password.value);
      setNote(loginNote, payload.message || 'Login berhasil.', 'success');
      window.setTimeout(() => window.location.assign('index.html'), 350);
    } catch (error) {
      setNote(loginNote, error.payload?.message || error.message || 'Login gagal.', 'error');
    } finally {
      loginForm.classList.remove('is-submitting');
    }
  });

  logoutButton?.addEventListener('click', async () => {
    if (!auth?.logout) return;
    logoutButton.disabled = true;
    try {
      await auth.logout();
      sessionPanel.hidden = true;
      setMode('login');
      setNote(loginNote, 'Sesi ditutup. Kamu dapat masuk kembali kapan saja.', 'success');
    } catch (error) {
      setNote(loginNote, error.message || 'Gagal menutup sesi.', 'error');
    } finally {
      logoutButton.disabled = false;
    }
  });

  const requestedMode = new URLSearchParams(window.location.search).get('mode');
  setMode(requestedMode === 'login' || requestedMode === 'account' ? 'login' : 'register');

  auth?.getCurrentUser?.().then(user => {
    if (!user || !sessionPanel || !sessionName) return;
    sessionName.textContent = user.username || user.name || 'PENJELAJAH';
    if (sessionEmail) sessionEmail.textContent = user.email || user.name || '';
    sessionPanel.hidden = false;

    if (requestedMode === 'account') {
      registerForm.hidden = true;
      loginForm.hidden = true;
      if (modeSwitch) modeSwitch.hidden = true;
      if (title) title.textContent = 'Identitas Penjelajah Aktif';
      if (headCode) headCode.textContent = 'ANTARA ID // SESSION';
      if (briefTitle) briefTitle.textContent = 'Identitasmu terhubung ke ANTARA.';
      if (briefStatus) briefStatus.textContent = 'SESI AKTIF';
    }
  }).catch(() => {});
})();
