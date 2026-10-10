(() => {
  const GUEST_KEY = 'antara-guest-session-v1';

  // Only exploration/progress state is cleared when a guest becomes an account.
  // Device preferences such as audio, graphics quality, and solar-system speed stay intact.
  const LOCAL_PROGRESS_RULES = [
    key => key === 'antara-mars-full-missions-v2',
    key => key.startsWith('antara-earth-discoveries-v1:'),
    key => key.startsWith('antara-jupiter-atmosphere-discovery-v2:'),
    key => key.startsWith('antara-saturn-pov-discovery-v1:'),
    key => key.startsWith('antara-uranus-pov-discovery-v1:'),
    key => key.startsWith('antara-neptune-pov-discovery-v1:')
  ];

  const SESSION_PROGRESS_RULES = [
    key => key.startsWith('antara-mercury-discoveries-'),
    key => key.startsWith('antara-venus-discoveries-'),
    key => key === 'antara-earth-full-tutorial-v2',
    key => key === 'antara-mars-full-tutorial',
    key => key === 'antara-mercury-full-tutorial-v2',
    key => key === 'antara-venus-full-tutorial-v2'
  ];

  const safeRead = (storage, key) => {
    try { return storage.getItem(key); }
    catch { return null; }
  };

  const removeMatching = (storage, rules) => {
    let removed = 0;
    try {
      const keys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key) keys.push(key);
      }
      keys.forEach(key => {
        if (!rules.some(rule => rule(key))) return;
        storage.removeItem(key);
        removed += 1;
      });
    } catch {}
    return removed;
  };

  const isActive = () => safeRead(localStorage, GUEST_KEY) === 'active';

  const setActive = active => {
    try {
      if (active) localStorage.setItem(GUEST_KEY, 'active');
      else localStorage.removeItem(GUEST_KEY);
    } catch {}
  };

  const clearMarker = () => setActive(false);

  const clearProgress = () => {
    const localRemoved = removeMatching(localStorage, LOCAL_PROGRESS_RULES);
    const sessionRemoved = removeMatching(sessionStorage, SESSION_PROGRESS_RULES);
    return { localRemoved, sessionRemoved, totalRemoved: localRemoved + sessionRemoved };
  };

  const completeAccountSwitch = () => {
    const removed = clearProgress();
    clearMarker();
    try {
      window.dispatchEvent(new CustomEvent('antara:guest-change', {
        detail: { active: false, reason: 'account-switch', removed }
      }));
    } catch {}
    return removed;
  };

  window.ANTARAGuestData = Object.freeze({
    key: GUEST_KEY,
    isActive,
    setActive,
    clearMarker,
    clearProgress,
    completeAccountSwitch
  });
})();
