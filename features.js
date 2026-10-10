(() => {
  const art = document.querySelector('.feature-art');
  if (!art) return;
  const buttons = [...art.querySelectorAll('.feature-orb')];
  const toggle = art.querySelector('.orbit-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hovered = null;
  let focused = null;
  let pinned = null;
  let manualPause = false;
  let keyboardInput = false;
  let lastPointerType = 'mouse';
  function placeCard(button) {
    const anchor = button.parentElement.getBoundingClientRect();
    const bounds = art.getBoundingClientRect();
    const width = Math.min(244, bounds.width - 40);
    const left = Math.max(bounds.left + 14, Math.min(anchor.left, bounds.right - width * 1.04 - 14));
    button.style.setProperty('--card-width', width + 'px');
    button.style.setProperty('--card-shift', (left - anchor.left) + 'px');
    const height = Math.max(44, button.querySelector('.orb-copy').scrollHeight + 27) * 1.04;
    const shiftY = Math.min(0, bounds.bottom - 14 - anchor.top - height);
    button.style.setProperty('--card-shift-y', shiftY + 'px');
  }
  function render() {
    const active = hovered || focused || pinned;
    art.classList.toggle('motion-paused', manualPause || Boolean(active));
    buttons.forEach(button => {
      const open = button === active;
      if (open) placeCard(button);
      button.closest('.feature-slot').classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
    toggle.setAttribute('aria-pressed', String(manualPause));
    toggle.textContent = manualPause ? 'Resume motion' : 'Pause motion';
  }
  document.addEventListener('keydown', event => {
    keyboardInput = true;
    if (event.key === 'Escape') {
      hovered = focused = pinned = null;
      render();
    }
  });
  document.addEventListener('pointerdown', event => {
    keyboardInput = false;
    lastPointerType = event.pointerType;
    focused = null;
    if (!event.target.closest('.feature-orb')) pinned = null;
    render();
  });
  buttons.forEach(button => {
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') { hovered = button; render(); }
    });
    button.addEventListener('pointerleave', () => {
      if (hovered === button) hovered = null;
      render();
    });
    button.addEventListener('focus', () => {
      if (keyboardInput) { focused = button; render(); }
    });
    button.addEventListener('blur', () => {
      if (focused === button) focused = null;
      render();
    });
    button.addEventListener('click', event => {
      // Mouse hover owns the card; touch and keyboard can toggle it.
      if (event.detail > 0 && lastPointerType === 'mouse') return;
      pinned = pinned === button ? null : button;
      render();
    });
  });
  toggle.addEventListener('click', () => {
    manualPause = !manualPause;
    render();
  });
  window.addEventListener('resize', render);
  reducedMotion.addEventListener('change', render);
  render();
})();
