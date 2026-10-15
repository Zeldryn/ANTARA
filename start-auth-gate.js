(() => {
  const launchButton = document.getElementById('launch-button');
  const profileHud = document.getElementById('cockpit-profile-hud');
  if (!launchButton) return;

  const GUEST_KEY = window.ANTARAGuestData?.key || 'antara-guest-session-v1';
  const copy = launchButton.querySelector('.launch-button-copy');
  const small = copy?.querySelector('small');
  const strong = copy?.querySelector('strong');
  const originalSmall = small?.textContent || '';
  const originalStrong = strong?.textContent || 'MULAI PERJALANAN';

  const readGuest = () => {
    try {
      if (window.ANTARAGuestData?.isActive) return window.ANTARAGuestData.isActive();
      return localStorage.getItem(GUEST_KEY) === 'active';
    } catch { return false; }
  };
  const writeGuest = active => {
    try {
      if (window.ANTARAGuestData?.setActive) window.ANTARAGuestData.setActive(active);
      else if (active) localStorage.setItem(GUEST_KEY, 'active');
      else localStorage.removeItem(GUEST_KEY);
    } catch { /* localStorage is optional. */ }
  };

  let authenticated = false;
  let guest = readGuest();
  let checking = true;
  let lastFocus = null;
  let toastTimer = 0;

  window.ANTARAGuestSession = Object.freeze({
    isActive: () => guest && !authenticated,
    clear: () => {
      guest = false;
      writeGuest(false);
      syncLaunchState();
      window.dispatchEvent(new CustomEvent('antara:guest-change', { detail: { active: false } }));
    }
  });

  const lock = document.createElement('span');
  lock.className = 'launch-auth-lock';
  lock.setAttribute('aria-hidden', 'true');
  launchButton.insertBefore(lock, copy || launchButton.firstChild);

  const chooser = document.createElement('section');
  chooser.className = 'launch-auth-chooser';
  chooser.id = 'launch-auth-chooser';
  chooser.hidden = true;
  chooser.setAttribute('role', 'dialog');
  chooser.setAttribute('aria-modal', 'true');
  chooser.setAttribute('aria-labelledby', 'launch-auth-title');
  chooser.innerHTML = ` <div class="launch-auth-panel"> <button class="launch-auth-close" type="button" aria-label="Tutup pilihan akses">×</button> <div class="launch-auth-heading"> <span class="launch-auth-symbol" aria-hidden="true">◇</span> <div><small>IDENTITAS PENJELAJAH</small><strong id="launch-auth-title">Pilih cara memulai perjalanan</strong></div> </div> <p class="launch-auth-lead">Pakai akun ANTARA untuk menyimpan identitas dan ikut peringkat, atau coba perjalanan sebagai tamu.</p> <div class="launch-auth-account-actions"> <a class="launch-auth-action is-login" href="daftar.html?mode=login"><span>SUDAH PUNYA AKUN</span><strong>MASUK</strong></a> <a class="launch-auth-action is-register" href="daftar.html?mode=register"><span>PENJELAJAH BARU</span><strong>DAFTAR</strong></a> </div> <div class="launch-auth-divider"><span>ATAU</span></div> <button class="launch-auth-guest" type="button"> <span class="launch-auth-guest-icon" aria-hidden="true">◎</span> <span><small>COBA TANPA AKUN</small><strong>MASUK SEBAGAI TAMU</strong><em>Sesi tamu diingat di perangkat ini.</em></span> </button> <p class="launch-auth-leaderboard-note"><span aria-hidden="true">★</span><span><strong>Mau masuk Leaderboard?</strong> Buat atau masuk ke akun ANTARA agar peringkat dan identitasmu bisa dicatat.</span></p> </div> `;
  document.body.appendChild(chooser);

  const toast = document.createElement('div');
  toast.className = 'guest-session-toast';
  toast.hidden = true;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = '<strong>MODE TAMU AKTIF</strong><span>Kamu bisa menjelajah sekarang. Leaderboard membutuhkan akun ANTARA.</span>';
  document.body.appendChild(toast);

  const closeButton = chooser.querySelector('.launch-auth-close');
  const guestButton = chooser.querySelector('.launch-auth-guest');
  const firstAction = chooser.querySelector('.launch-auth-action');

  function authorized() {
    return authenticated || guest;
  }

  function syncLaunchState() {
    const ready = !checking && authorized();
    launchButton.dataset.authChecking = checking ? 'true' : 'false';
    launchButton.dataset.authLocked = ready ? 'false' : 'true';
    launchButton.dataset.guest = guest && !authenticated ? 'true' : 'false';
    launchButton.setAttribute('aria-disabled', ready ? 'false' : 'true');
    launchButton.setAttribute('aria-label', ready
      ? (guest && !authenticated ? 'Mulai perjalanan ANTARA sebagai tamu' : 'Mulai perjalanan ANTARA')
      : 'Pilih masuk, daftar, atau lanjut sebagai tamu untuk memulai perjalanan.');
    if (small) small.textContent = checking ? 'MEMERIKSA SESI' : (guest && !authenticated ? 'MODE TAMU' : originalSmall);
    if (strong) strong.textContent = originalStrong;
  }

  function showToast() {
    window.clearTimeout(toastTimer);
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      window.setTimeout(() => { if (!toast.classList.contains('is-visible')) toast.hidden = true; }, 220);
    }, 4200);
  }

  function openChooser() {
    if (!checking && authorized()) return;
    lastFocus = document.activeElement;
    chooser.hidden = false;
    document.documentElement.classList.add('launch-auth-open');
    requestAnimationFrame(() => {
      chooser.classList.add('is-visible');
      firstAction?.focus?.({ preventScroll: true });
    });
  }

  function closeChooser({ restoreFocus = true } = {}) {
    chooser.classList.remove('is-visible');
    document.documentElement.classList.remove('launch-auth-open');
    window.setTimeout(() => {
      if (!chooser.classList.contains('is-visible')) chooser.hidden = true;
    }, 180);
    if (restoreFocus) lastFocus?.focus?.({ preventScroll: true });
  }

  function applyState(user) {
    authenticated = Boolean(user && typeof user === 'object');
    checking = false;
    if (authenticated) {
      guest = false;
      writeGuest(false);
      closeChooser({ restoreFocus: false });
    } else {
      guest = readGuest();
    }
    syncLaunchState();
  }

  function applyChecking() {
    checking = true;
    authenticated = false;
    guest = readGuest();
    syncLaunchState();
  }

  function activateGuest() {
    guest = true;
    authenticated = false;
    checking = false;
    writeGuest(true);
    syncLaunchState();
    closeChooser({ restoreFocus: false });
    window.dispatchEvent(new CustomEvent('antara:guest-change', { detail: { active: true } }));
    showToast();
    // Keep this inside the real guest-button gesture task so audio can unlock.
    launchButton.click();
  }

  closeButton?.addEventListener('click', () => closeChooser());
  guestButton?.addEventListener('click', activateGuest);
  chooser.addEventListener('click', event => {
    if (event.target === chooser) closeChooser();
  });
  document.addEventListener('keydown', event => {
    if (chooser.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeChooser();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...chooser.querySelectorAll('a[href],button:not([disabled])')].filter(el => !el.hidden && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });

  window.addEventListener('antara:auth-change', event => {
    applyState(event.detail?.user ?? null);
  });

  window.addEventListener('antara:launch-auth-required', () => {
    if (checking) return;
    if (!authorized()) openChooser();
  });

  // Capture-phase gate runs before the original mission handler.
  launchButton.addEventListener('click', event => {
    if (!checking && authorized()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!checking) openChooser();
  }, true);

  applyChecking();

  const existing = window.ANTARAAuth?.currentUser ?? null;
  if (existing) applyState(existing);

  // Never remain stuck in a loading state if the PHP session request fails.
  window.setTimeout(() => {
    if (checking) applyState(null);
  }, 3000);
})();
