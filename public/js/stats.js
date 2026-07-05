/* ==========================================================================
   ELYON AI — stats.js
   Contadores animados (Casos de Éxito) y lógica de la Calculadora de
   Ahorro IA. Sin dependencias externas: requestAnimationFrame + un poco
   de aritmética.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Contadores animados — [data-count-to] cuenta de 0 al valor
     final cuando entra en viewport, una sola vez.
     ============================================================ */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseFloat(el.dataset.countTo);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';

      if (prefersReducedMotion) {
        el.textContent = `${prefix}${target}${suffix}`;
        return;
      }

      const duration = 1600;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo — arranca rápido, se asienta suave, sin overshoot.
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const value = Math.round(eased * target);
        el.textContent = `${prefix}${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ============================================================
     Calculadora de Ahorro IA
     Modelo simple y transparente:
       horas_ahorradas_mes = horas_perdidas_semana * 4.33 * nº_empleados
       coste_hora = salario_mes / (40 * 4.33)
       dinero_ahorrado_mes = horas_ahorradas_mes * coste_hora * 0.6
         (factor 0.6: una IA no recupera el 100% de las horas perdidas
         de inmediato — estimación conservadora, no una promesa)
       beneficio_anual = dinero_ahorrado_mes * 12
       ROI = (beneficio_anual / coste_estimado_plan_pro_anual) * 100
     ============================================================ */
  const calcEmployees = document.getElementById('calcEmployees');
  const calcHours = document.getElementById('calcHours');
  const calcSalary = document.getElementById('calcSalary');
  const calcLostHours = document.getElementById('calcLostHours');

  if (calcEmployees && calcHours && calcSalary && calcLostHours) {
    const out = {
      employees: document.getElementById('calcEmployeesOut'),
      hours: document.getElementById('calcHoursOut'),
      salary: document.getElementById('calcSalaryOut'),
      lostHours: document.getElementById('calcLostHoursOut'),
    };
    const result = {
      time: document.getElementById('calcResultTime'),
      money: document.getElementById('calcResultMoney'),
      year: document.getElementById('calcResultYear'),
      roi: document.getElementById('calcResultROI'),
    };

    const WEEKS_PER_MONTH = 4.33;
    const HOURS_PER_MONTH_FULLTIME = 40 * WEEKS_PER_MONTH;
    const RECOVERY_FACTOR = 0.6;
    const ESTIMATED_ANNUAL_PLAN_COST = 349 * 12; // plan Pro, referencia de ROI

    const formatEUR = (n) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

    function recalculate() {
      const employees = parseInt(calcEmployees.value, 10);
      const lostHoursWeek = parseInt(calcLostHours.value, 10);
      const salary = parseInt(calcSalary.value, 10);

      out.employees.textContent = employees;
      out.hours.textContent = `${calcHours.value} h`;
      out.salary.textContent = formatEUR(salary);
      out.lostHours.textContent = `${lostHoursWeek} h`;

      const hoursSavedMonth = lostHoursWeek * WEEKS_PER_MONTH * employees;
      const costPerHour = salary / HOURS_PER_MONTH_FULLTIME;
      const moneySavedMonth = hoursSavedMonth * costPerHour * RECOVERY_FACTOR;
      const annualBenefit = moneySavedMonth * 12;
      const roi = (annualBenefit / ESTIMATED_ANNUAL_PLAN_COST) * 100;

      result.time.textContent = `${Math.round(hoursSavedMonth)} h`;
      result.money.textContent = formatEUR(Math.round(moneySavedMonth));
      result.year.textContent = formatEUR(Math.round(annualBenefit));
      result.roi.textContent = `${Math.max(0, Math.round(roi))}%`;
    }

    [calcEmployees, calcHours, calcSalary, calcLostHours].forEach((input) => {
      input.addEventListener('input', recalculate);
    });

    recalculate();
  }
})();

/* ==========================================================================
   ELYON Live — contadores "en tiempo real" + sparklines
   Los valores suben con pequeños incrementos aleatorios para dar sensación
   de actividad viva. Es una demostración visual (no hay backend real).
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const liveEls = document.querySelectorAll('[data-live]');
  if (!liveEls.length) return;

  // Estado por contador: valor actual + parámetros de incremento.
  const counters = [];
  liveEls.forEach((el) => {
    const base = parseFloat(el.dataset.liveBase);
    // data-live-inc = "min,max": rango del incremento aleatorio por tick.
    const [incMin, incMax] = (el.dataset.liveInc || '1,3').split(',').map(parseFloat);
    counters.push({
      el,
      value: base,
      incMin,
      incMax,
      prefix: el.dataset.livePrefix || '',
      isFloat: el.dataset.liveFloat === '1',
    });
  });

  const formatNumber = (n, isFloat) => {
    if (isFloat) return n.toFixed(1);
    return Math.floor(n).toLocaleString('es-ES');
  };

  // Arranca solo cuando la sección entra en viewport (no malgasta ciclos).
  let running = false;
  let intervalId = null;

  function tick() {
    counters.forEach((c) => {
      const inc = c.incMin + Math.random() * (c.incMax - c.incMin);
      if (c.isFloat) {
        // Tiempo de respuesta: oscila levemente alrededor de la base.
        c.value = Math.max(0.8, c.value + (Math.random() - 0.5) * 0.1);
      } else {
        c.value += inc;
      }
      c.el.textContent = c.prefix + formatNumber(c.value, c.isFloat);
    });
  }

  function start() {
    if (running || prefersReducedMotion) return;
    running = true;
    intervalId = setInterval(tick, 1600);
  }
  function stop() {
    running = false;
    if (intervalId) clearInterval(intervalId);
  }

  const liveSection = document.getElementById('nexora-live');
  if (liveSection) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) start();
        else stop();
      });
    }, { threshold: 0.2 });
    obs.observe(liveSection);
  }

  // Pausa global si la pestaña se oculta.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (liveSection) {
      const rect = liveSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) start();
    }
  });

  /* ---- Sparklines de ELYON Live: barras que se regeneran suavemente ---- */
  const sparklines = document.querySelectorAll('[data-sparkline]');
  sparklines.forEach((container) => {
    const BAR_COUNT = 32;
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement('span');
      bar.style.height = `${20 + Math.random() * 70}%`;
      container.appendChild(bar);
    }
    if (prefersReducedMotion) return;
    const bars = container.querySelectorAll('span');
    setInterval(() => {
      const rect = container.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0 || document.hidden) return;
      // Desplaza las alturas una posición a la izquierda y añade una nueva.
      for (let i = 0; i < bars.length - 1; i++) {
        bars[i].style.height = bars[i + 1].style.height;
      }
      bars[bars.length - 1].style.height = `${20 + Math.random() * 70}%`;
    }, 900);
  });
})();

/* ==========================================================================
   Casos de éxito — barras animadas dentro de cada panel
   ========================================================================== */

(function () {
  'use strict';

  const barContainers = document.querySelectorAll('[data-case-bars]');
  if (!barContainers.length) return;

  // Cada mini-gráfica de barras muestra una tendencia creciente (antes -> después).
  barContainers.forEach((container) => {
    const heights = [28, 34, 30, 42, 48, 60, 72, 88];
    heights.forEach((h) => {
      const bar = document.createElement('span');
      bar.style.height = '0%';
      bar.dataset.target = h;
      container.appendChild(bar);
    });
  });

  function animateBars(container) {
    const bars = container.querySelectorAll('span');
    bars.forEach((bar, i) => {
      setTimeout(() => {
        bar.style.height = `${bar.dataset.target}%`;
      }, i * 70);
    });
  }

  // Anima las barras del panel activo cuando la sección entra en viewport,
  // y también cada vez que se cambia de pestaña (gestionado en demo.js, que
  // dispara un evento 'case:shown').
  const section = document.getElementById('casos-detalle');
  if (section) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const active = section.querySelector('.case-content.is-active [data-case-bars]');
          if (active) animateBars(active);
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(section);
  }

  document.addEventListener('case:shown', (e) => {
    const container = e.detail?.container?.querySelector('[data-case-bars]');
    if (container) {
      container.querySelectorAll('span').forEach((b) => (b.style.height = '0%'));
      animateBars(container);
    }
  });
})();
