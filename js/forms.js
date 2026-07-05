/* ==========================================================================
   ELYON AI — forms.js
   Validación del formulario de contacto sin recargar la página, feedback
   mediante toast, y año dinámico del footer.

   Nota de producción: este formulario valida y prepara el payload en el
   cliente. El envío real (fetch a un endpoint propio o a un proveedor como
   Formspree/Resend) se conecta en el paso de integración con backend —
   aquí queda preparado el punto exacto de conexión, marcado abajo.
   ========================================================================== */

(function () {
  'use strict';

  /* ============================================================
     Año del footer
     ============================================================ */
  const footerYear = document.getElementById('footerYear');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  /* ============================================================
     Toast genérico
     ============================================================ */
  const toast = document.getElementById('formToast');
  let toastTimer;
  function showToast() {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 5000);
  }

  /* ============================================================
     Formulario de contacto
     ============================================================ */
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('contactSubmit');

  const validators = {
    name: (v) => v.trim().length >= 2 || 'Indica tu nombre completo',
    company: (v) => v.trim().length >= 2 || 'Indica el nombre de tu empresa',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Introduce un email válido',
    phone: (v) => /^[+\d][\d\s-]{6,}$/.test(v.trim()) || 'Introduce un teléfono válido',
    sector: (v) => v.trim().length > 0 || 'Selecciona tu sector',
    size: (v) => v.trim().length > 0 || 'Selecciona un rango',
  };

  function setFieldError(fieldEl, message) {
    fieldEl.classList.toggle('has-error', !!message);
    const errorEl = form.querySelector(`[data-error-for="${fieldEl.id}"]`);
    if (errorEl) errorEl.textContent = message || '';
  }

  function validateField(fieldEl) {
    const validator = validators[fieldEl.name];
    if (!validator) return true;
    const result = validator(fieldEl.value);
    if (result === true) {
      setFieldError(fieldEl, '');
      return true;
    }
    setFieldError(fieldEl, result);
    return false;
  }

  // Validación en vivo: limpia el error en cuanto el campo vuelve a ser válido.
  ['name', 'company', 'email', 'phone', 'sector', 'size'].forEach((fieldName) => {
    const el = form.elements[fieldName];
    if (!el) return;
    const eventName = el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(eventName, () => validateField(el));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fieldsToValidate = ['name', 'company', 'email', 'phone', 'sector', 'size']
      .map((name) => form.elements[name])
      .filter(Boolean);

    const isValid = fieldsToValidate
      .map((el) => validateField(el))
      .every(Boolean);

    if (!isValid) {
      fieldsToValidate.find((el) => el.classList.contains('has-error'))?.focus();
      return;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      company: form.elements.company.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      sector: form.elements.sector.value,
      size: form.elements.size.value,
      message: form.elements.message.value.trim(),
    };

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Enviando…';

    try {
      // ---- PUNTO DE CONEXIÓN CON BACKEND ----
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });
      await new Promise((resolve) => setTimeout(resolve, 500)); // simula latencia de red

      form.reset();
      fieldsToValidate.forEach((el) => setFieldError(el, ''));
      showToast();
    } catch (err) {
      // Si el envío real falla, no perdemos los datos del usuario:
      // se mantiene el formulario relleno para que pueda reintentar.
      const errorEl = form.querySelector('[data-error-for="formEmail"]');
      if (errorEl) errorEl.textContent = 'No se pudo enviar. Inténtalo de nuevo.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
})();
