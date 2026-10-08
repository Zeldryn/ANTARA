(() => {
  const form = document.getElementById('registration-form');
  if (!form) return;

  const fields = {
    fullName: document.getElementById('full-name'),
    username: document.getElementById('username'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirm-password'),
    terms: document.getElementById('terms')
  };
  const note = document.getElementById('form-note');

  const setError = (input, message = '') => {
    const id = input.id;
    const target = form.querySelector(`[data-error-for="${id}"]`);
    const group = input.closest('.field-group');
    if (target) target.textContent = message;
    if (group) group.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  const validateField = input => {
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
    }
    if (input === fields.confirmPassword) {
      if (!input.value) message = 'Ulangi kata sandi.';
      else if (input.value !== fields.password.value) message = 'Konfirmasi kata sandi belum sama.';
    }

    setError(input, message);
    return !message;
  };

  Object.values(fields).forEach(input => {
    if (!input || input.type === 'checkbox') return;
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      if (input === fields.password && fields.confirmPassword.value) validateField(fields.confirmPassword);
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

  form.addEventListener('submit', event => {
    event.preventDefault();

    const valid = [fields.fullName, fields.username, fields.email, fields.password, fields.confirmPassword]
      .map(validateField)
      .every(Boolean);

    const termsError = form.querySelector('[data-error-for="terms"]');
    if (!fields.terms.checked) {
      termsError.textContent = 'Persetujuan diperlukan untuk melanjutkan.';
    } else {
      termsError.textContent = '';
    }

    if (!valid || !fields.terms.checked) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    window.dispatchEvent(new CustomEvent('antara:register-request', {
      detail: {
        fullName: fields.fullName.value.trim(),
        username: fields.username.value.trim(),
        email: fields.email.value.trim()
      }
    }));

    note.textContent = 'Data formulir valid. Antarmuka siap dihubungkan ke sistem akun ANTARA.';
    note.classList.add('is-success');
  });
})();
