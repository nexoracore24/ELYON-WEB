/* ==========================================================================
   ELYON AI — interactions.js
   Microinteracciones de UI que no dependen de WebGL ni de GSAP:
   navbar al hacer scroll, menú móvil, revelado por scroll, scroll progress.
   Todo basado en rAF / IntersectionObserver, nunca en el evento scroll a pelo.
   ========================================================================== */

(function () {
  'use strict';

  /* ============================================================
     Navbar: encoge y gana cristal al hacer scroll
     ============================================================ */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    let ticking = false;
    const updateNavbar = () => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    }, { passive: true });
    updateNavbar();
  }

  /* ============================================================
     Menú móvil
     ============================================================ */
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const mobileMenu = document.getElementById('mobileMenu');

  function openMenu() {
    mobileMenu.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });
    menuClose?.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ============================================================
     Scroll reveal — elementos con [data-reveal]
     threshold 0 + sin rootMargin negativo: el observer dispara en
     cuanto aparece 1px del elemento, para no perder la transición
     en scrolls muy rápidos (flick de trackpad, PgDn). Como red de
     seguridad adicional, un chequeo manual por rAF revela cualquier
     elemento que ya haya pasado por el viewport y que, por lo que
     sea (scroll muy rápido, tab en segundo plano, etc.), el
     observer no haya llegado a marcar.
     ============================================================ */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    let pending = Array.from(revealEls);
    let catchUpTicking = false;
    const catchUpPass = () => {
      catchUpTicking = false;
      pending = pending.filter((el) => {
        if (el.classList.contains('is-visible')) return false;
        const rect = el.getBoundingClientRect();
        // Ya cruzó por completo la ventana visible sin activarse: revélalo.
        if (rect.bottom < 0 || rect.top < window.innerHeight) {
          el.classList.add('is-visible');
          revealObserver.unobserve(el);
          return false;
        }
        return true;
      });
    };
    const scheduleCatchUp = () => {
      if (!catchUpTicking && pending.length) {
        catchUpTicking = true;
        requestAnimationFrame(catchUpPass);
      }
    };
    window.addEventListener('scroll', scheduleCatchUp, { passive: true });
    window.addEventListener('resize', scheduleCatchUp);
  }

  /* ============================================================
     Smooth-scroll para anclas internas (respeta el alto del navbar)
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = navbar ? navbar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ============================================================
     FAQ — acordeón, solo un elemento abierto a la vez
     ============================================================ */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-item__question');
    question?.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-item__question')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ============================================================
     Efecto ripple en botones — onda que nace en el punto de click
     ============================================================ */
  document.querySelectorAll('.btn, .btn--primary-lg').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      // Respeta reduced-motion: sin onda.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
})();
