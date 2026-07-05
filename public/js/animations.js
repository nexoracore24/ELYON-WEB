/* ==========================================================================
   ELYON AI — animations.js
   Animaciones orquestadas con GSAP + ScrollTrigger. Si GSAP no carga (CDN
   caído, red bloqueada), cada bloque tiene su propio fallback en CSS puro
   o vanilla JS — ninguna sección depende exclusivamente de GSAP para verse
   bien.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ============================================================
     Timeline de "Cómo funciona": la línea-luz avanza con el
     scroll y cada paso se ilumina cuando la línea lo alcanza.
     Con GSAP: scrub atado a la posición de scroll (suave, sin
     saltos). Sin GSAP: IntersectionObserver activa cada paso al
     entrar en viewport — degradado correcto, no se rompe nada.
     ============================================================ */
  const timeline = document.getElementById('timeline');
  const lineFill = document.getElementById('timelineLineFill');
  const steps = timeline ? Array.from(timeline.querySelectorAll('.timeline__step')) : [];

  if (timeline && lineFill && steps.length) {
    if (hasGSAP && !prefersReducedMotion && window.innerWidth > 1024) {
      ScrollTrigger.create({
        trigger: timeline,
        start: 'top 65%',
        end: 'bottom 70%',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress * 100;
          lineFill.style.width = progress + '%';
          // Cada paso se activa cuando la línea ha recorrido su posición
          // proporcional dentro de la fila (5 pasos -> 0, 25, 50, 75, 100%).
          steps.forEach((step, i) => {
            const threshold = (i / (steps.length - 1)) * 100;
            step.classList.toggle('is-active', progress >= threshold - 4);
          });
        },
      });
    } else {
      // Fallback: activa cada paso por separado al entrar en viewport,
      // y la línea de fondo (en desktop) llega a su ancho final sin scrub.
      const stepObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-active');
            }
          });
        },
        { threshold: 0.4 }
      );
      steps.forEach((step) => stepObserver.observe(step));

      const lineObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              lineFill.style.transition = 'width 1.4s ' + 'cubic-bezier(0.16,1,0.3,1)';
              lineFill.style.width = '100%';
              lineObserver.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      lineObserver.observe(timeline);
    }
  }

  /* ============================================================
     Bento cards: spotlight radial que sigue al cursor dentro de
     cada tarjeta (variables --mx/--my leídas por el ::before en
     components.css). Puro CSS + JS ligero, no necesita GSAP.
     ============================================================ */
  const bentoCards = document.querySelectorAll('.bento-card');
  bentoCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });

  /* ============================================================
     Scroll cinemático (solo con GSAP + desktop + sin reduced-motion):
     las cabeceras de sección se desplazan a velocidad ligeramente
     distinta del scroll, creando profundidad sin marear.

     Nota: el "entra elevándose" de tarjetas y del dashboard vivía antes
     aquí también, vía gsap.from(..., { opacity: 0, ... }) + ScrollTrigger
     sobre los mismos elementos que ya llevan [data-reveal]. gsap.from()
     fija opacity/transform inline en cuanto se registra, con más
     prioridad que la clase .is-visible — si ese ScrollTrigger no llegaba
     a disparar (recarga a mitad de scroll, carrera con el registro de
     triggers, etc.), la tarjeta quedaba oculta para siempre, aunque el
     sistema [data-reveal] + interactions.js ya la hubiera revelado. Como
     [data-reveal] cubre el mismo efecto (fade + translateY) de forma
     fiable, se quitó la versión GSAP duplicada en vez de mantener dos
     sistemas compitiendo por el mismo opacity/transform.
     ============================================================ */
  if (hasGSAP && !prefersReducedMotion && window.innerWidth > 1024) {
    // Parallax suave de las cabeceras centradas.
    gsap.utils.toArray('.section-head--center').forEach((head) => {
      gsap.fromTo(
        head,
        { y: 40 },
        {
          y: -20,
          ease: 'none',
          scrollTrigger: {
            trigger: head,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );
    });
  }
})();
