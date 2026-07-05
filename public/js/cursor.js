/* ==========================================================================
   ELYON AI — cursor.js
   Cursor personalizado: punto que sigue al ratón al instante + anillo con
   inercia (lerp) que se infla sobre elementos interactivos.
   Se desactiva por completo en dispositivos táctiles.
   ========================================================================== */

(function () {
  'use strict';

  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch) return;

  const cursor = document.getElementById('customCursor');
  if (!cursor) return;

  const dot = cursor.querySelector('.custom-cursor__dot');
  const ring = cursor.querySelector('.custom-cursor__ring');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  let visible = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!visible) {
      visible = true;
      cursor.classList.add('is-visible');
    }
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    cursor.classList.remove('is-visible');
    visible = false;
  });

  function renderRing() {
    // Lerp suave: el anillo persigue al punto con inercia, nunca brusco.
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderRing);
  }

  if (!prefersReducedMotion) {
    requestAnimationFrame(renderRing);
  } else {
    window.addEventListener('mousemove', () => {
      ring.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    }, { passive: true });
  }

  const interactiveSelector = 'a, button, input, textarea, select, [data-cursor-hover]';

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest(interactiveSelector);
    cursor.classList.toggle('is-hovering', !!target);

    const magnetic = e.target.closest('[data-magnetic]');
    if (magnetic) cursor.classList.add('is-magnetic');
  });

  document.addEventListener('mouseout', (e) => {
    const magnetic = e.target.closest('[data-magnetic]');
    if (magnetic) cursor.classList.remove('is-magnetic');
  });

  document.addEventListener('mousedown', () => cursor.classList.add('is-pressed'));
  document.addEventListener('mouseup', () => cursor.classList.remove('is-pressed'));

  // ---- Botones magnéticos: se desplazan ligeramente hacia el cursor ----
  const magneticEls = document.querySelectorAll('[data-magnetic]');
  magneticEls.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
})();
