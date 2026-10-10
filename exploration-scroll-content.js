/* ANTARA exploration content scrolling — 2026-10-04
   Keep only the compact topic counter and bottom navigation fixed.
   Topic title, subtitle, lesson content and source share one scroll region. */
(() => {
  const findScroll = (scope) => scope?.querySelector?.('[class*="topic-scroll"]') || null;
  const resetScroll = (scope) => {
    const scroller = findScroll(scope);
    if (scroller) scroller.scrollTop = 0;
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (/-topic-(?:prev|next)$/.test(button.id)) {
      resetScroll(button.closest('aside'));
      return;
    }

    if (button.classList.contains('return-panorama-button')) {
      resetScroll(button.closest('aside'));
    }
  });
})();
