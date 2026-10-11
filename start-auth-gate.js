(() => {
  const launchButton = document.getElementById('launch-button');
  const profileHud = document.getElementById('cockpit-profile-hud');
  const profileTrigger = document.getElementById('profile-hud-trigger');
  if (!launchButton) return;

  const copy = launchButton.querySelector('.launch-button-copy');
  const small = copy?.querySelector('small');
  const strong = copy?.querySelector('strong');
  const originalSmall = small?.textContent || 'ANTARA // 01';
  const originalStrong = strong?.textContent || 'MULAI PERJALANAN';

  const lock = document.createElement('span');
  lock.className = 'launch-auth-lock';
  lock.setAttribute('aria-hidden', 'true');
  launchButton.insertBefore(lock, copy || launchButton.firstChild);

  const notice = document.createElement('div');
  notice.className = 'launch-auth-notice';
  notice.id = 'launch-auth-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.hidden = true;
  notice.innerHTML = '<strong>AKSES PERJALANAN TERKUNCI</strong><span>Tekan <b>MASUK KE ANTARA</b> pada panel identitas di atas untuk mulai menjelajahi Tata Surya.</span>';
  launchButton.insertAdjacentElement('afterend', notice);
  launchButton.setAttribute('aria-describedby', notice.id);

  let authenticated = false;
  let checking = true;
  let noticeTimer = 0;

  const showNotice = (message) => {
    const body = notice.querySelector('span');
    if (body && message) body.innerHTML = message;
    notice.hidden = false;
    requestAnimationFrame(() => notice.classList.add('is-visible'));
    profileHud?.classList.remove('auth-attention');
    void profileHud?.offsetWidth;
    profileHud?.classList.add('auth-attention');
    profileTrigger?.focus?.({ preventScroll: true });
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
      notice.classList.remove('is-visible');
      profileHud?.classList.remove('auth-attention');
      window.setTimeout(() => { if (!notice.classList.contains('is-visible')) notice.hidden = true; }, 220);
    }, 4200);
  };

  const hideNotice = () => {
    window.clearTimeout(noticeTimer);
    notice.classList.remove('is-visible');
    notice.hidden = true;
    profileHud?.classList.remove('auth-attention');
  };

  const applyState = user => {
    authenticated = Boolean(user && typeof user === 'object');
    checking = false;
    launchButton.dataset.authChecking = 'false';
    launchButton.dataset.authLocked = authenticated ? 'false' : 'true';
    launchButton.setAttribute('aria-disabled', authenticated ? 'false' : 'true');
    launchButton.setAttribute('aria-label', authenticated
      ? 'Mulai perjalanan ANTARA'
      : 'Perjalanan terkunci. Masuk ke ANTARA untuk memulai.');

    if (small) small.textContent = authenticated ? originalSmall : 'TERKUNCI · IDENTITAS DIPERLUKAN';
    if (strong) strong.textContent = originalStrong;
    if (authenticated) hideNotice();
  };

  const applyChecking = () => {
    checking = true;
    authenticated = false;
    launchButton.dataset.authChecking = 'true';
    launchButton.dataset.authLocked = 'true';
    launchButton.setAttribute('aria-disabled', 'true');
    if (small) small.textContent = 'MEMERIKSA IDENTITAS ANTARA';
    if (strong) strong.textContent = originalStrong;
  };

  applyChecking();

  window.addEventListener('antara:auth-change', event => {
    applyState(event.detail?.user ?? null);
  });

  window.addEventListener('antara:launch-auth-required', () => {
    if (checking) {
      showNotice('Sedang membaca sesi ANTARA. Jika belum masuk, tekan <b>MASUK KE ANTARA</b> pada panel identitas di atas.');
      return;
    }
    if (!authenticated) showNotice('Tekan <b>MASUK KE ANTARA</b> pada panel identitas di atas untuk mulai menjelajahi Tata Surya.');
  });

  // Capture phase blocks the existing mission click handler before authentication.
  launchButton.addEventListener('click', event => {
    if (authenticated && !checking) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.dispatchEvent(new CustomEvent('antara:launch-auth-required'));
  }, true);

  // If another script already resolved the session before this module ran, sync immediately.
  const existing = window.ANTARAAuth?.currentUser ?? null;
  if (existing) applyState(existing);

  // Never leave the button in an indefinite checking state if the session endpoint fails.
  window.setTimeout(() => {
    if (checking) applyState(null);
  }, 3000);
})();
