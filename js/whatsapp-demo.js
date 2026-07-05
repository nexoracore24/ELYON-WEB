/* ==========================================================================
   ELYON AI — whatsapp-demo.js
   Chat de WhatsApp escribible y realista para una PELUQUERÍA (demostración).

   Motor 100% offline por intención + palabras clave:
     • Normaliza el texto (minúsculas, sin acentos) y busca coincidencias.
     • Mantiene un mini-flujo de reserva con estado: servicio → día → hora →
       datos → confirmación. En cualquier momento el usuario puede preguntar
       otra cosa (precios, horarios…) y el bot responde sin perder el hilo.
     • Fallback amable cuando no entiende, ofreciendo opciones.

   No hay red ni IA real: es un guión inteligente que enseña el tono y el
   flujo que tendría un agente ELYON entrenado para el negocio.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.getElementById('waDemo');
  if (!root) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const messagesEl = root.querySelector('[data-wa-messages]');
  const form = root.querySelector('[data-wa-form]');
  const input = root.querySelector('[data-wa-input]');
  const quickWrap = root.querySelector('[data-wa-quick]');

  /* ============================================================
     Datos del negocio (peluquería de ejemplo)
     ============================================================ */
  const BIZ = {
    name: 'Peluquería Bella',
    horario: 'Martes a sábado, de 9:30 a 20:00. Domingos y lunes cerramos.',
    direccion: 'Calle Mayor 24, Madrid. Estamos a 2 minutos del metro Sol.',
    telefono: '+34 674 555 240',
    servicios: [
      { nombre: 'Corte de caballero', precio: '15 €', dur: '30 min' },
      { nombre: 'Corte de señora', precio: '22 €', dur: '45 min' },
      { nombre: 'Corte + peinado', precio: '30 €', dur: '1 h' },
      { nombre: 'Tinte', precio: 'desde 40 €', dur: '1 h 30 min' },
      { nombre: 'Mechas / balayage', precio: 'desde 65 €', dur: '2 h 30 min' },
      { nombre: 'Peinado / recogido', precio: '25 €', dur: '45 min' },
    ],
    profesionales: ['Marta', 'Lucía', 'Andrea'],
  };

  const HORAS_LIBRES = ['10:00', '11:30', '13:00', '17:00', '18:30'];

  /* ============================================================
     Estado del mini-flujo de reserva
     ============================================================ */
  const flow = {
    active: false,
    step: null, // 'servicio' | 'dia' | 'hora' | 'nombre' | 'done'
    data: {},
  };

  /* ============================================================
     Utilidades
     ============================================================ */
  const normalize = (s) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[¿?¡!.,;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const has = (text, words) => words.some((w) => text.includes(w));

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  function addUser(text) {
    const el = document.createElement('div');
    el.className = 'wa-bubble wa-bubble--out';
    el.innerHTML = `<span class="wa-bubble__text"></span><span class="wa-bubble__meta">${nowTime()} <svg viewBox="0 0 16 11" fill="none" aria-hidden="true"><path d="M1 5.5L4.5 9 10 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 9l5.5-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    el.querySelector('.wa-bubble__text').textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'wa-bubble wa-bubble--in wa-bubble--typing';
    el.innerHTML = `<span class="wa-typing"><span></span><span></span><span></span></span>`;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function addBot(html) {
    const el = document.createElement('div');
    el.className = 'wa-bubble wa-bubble--in';
    el.innerHTML = `<span class="wa-bubble__text">${html}</span><span class="wa-bubble__meta">${nowTime()}</span>`;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  // Envía una o varias burbujas del bot con "escribiendo…" entre ellas.
  async function botSay(parts) {
    const arr = Array.isArray(parts) ? parts : [parts];
    for (const part of arr) {
      if (prefersReducedMotion) {
        addBot(part);
        continue;
      }
      const typing = addTyping();
      await wait(Math.min(500 + part.replace(/<[^>]+>/g, '').length * 11, 1400));
      typing.remove();
      addBot(part);
      await wait(280);
    }
  }

  /* ============================================================
     Generadores de respuesta
     ============================================================ */
  function serviciosLista() {
    const items = BIZ.servicios
      .map((s) => `• ${s.nombre} — <strong>${s.precio}</strong> (${s.dur})`)
      .join('<br>');
    return `Estos son nuestros servicios y precios:<br>${items}`;
  }

  function quickSet(list) {
    if (!quickWrap) return;
    quickWrap.innerHTML = '';
    list.forEach((label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wa-quick-btn';
      b.textContent = label;
      b.addEventListener('click', () => handleUserText(label));
      quickWrap.appendChild(b);
    });
  }

  /* ============================================================
     Motor de intención
     ============================================================ */
  async function respond(raw) {
    const text = normalize(raw);

    // --- Si estamos dentro del flujo de reserva, priorizar sus pasos ---
    if (flow.active) {
      // permitir cancelar
      if (has(text, ['cancelar', 'dejalo', 'olvidalo', 'nada'])) {
        flow.active = false;
        flow.step = null;
        flow.data = {};
        await botSay('Sin problema, he cancelado la reserva 😊 ¿Puedo ayudarte con algo más?');
        quickSet(['Ver precios', 'Horarios', 'Reservar cita']);
        return;
      }

      if (flow.step === 'servicio') {
        // intenta casar con un servicio
        const match = BIZ.servicios.find((s) => {
          const n = normalize(s.nombre);
          return text.includes(n) || n.split(' ').some((w) => w.length > 3 && text.includes(w));
        });
        const generic =
          has(text, ['corte']) ? 'Corte de caballero' :
          has(text, ['tinte', 'color']) ? 'Tinte' :
          has(text, ['mecha', 'balayage']) ? 'Mechas / balayage' :
          has(text, ['peinado', 'recogido']) ? 'Peinado / recogido' : null;
        const chosen = match ? match.nombre : generic;
        if (chosen) {
          flow.data.servicio = chosen;
          flow.step = 'dia';
          await botSay([`¡Genial! Has elegido <strong>${chosen}</strong>. ✂️`, '¿Qué día te viene bien? Puedes decirme por ejemplo "mañana", "el viernes" o una fecha.']);
          quickSet(['Mañana', 'El viernes', 'El sábado']);
        } else {
          await botSay('¿Qué servicio te gustaría? Por ejemplo: corte, tinte, mechas o peinado.');
          quickSet(BIZ.servicios.slice(0, 4).map((s) => s.nombre));
        }
        return;
      }

      if (flow.step === 'dia') {
        flow.data.dia = raw.trim();
        flow.step = 'hora';
        await botSay([`Perfecto, para <strong>${escapeHtml(raw.trim())}</strong> tengo estos huecos libres:`, HORAS_LIBRES.join(' · ')]);
        quickSet(HORAS_LIBRES);
        return;
      }

      if (flow.step === 'hora') {
        // busca una hora en el texto
        const horaMatch = raw.match(/\b(\d{1,2})[:.h ]?(\d{2})?\b/);
        const hora = HORAS_LIBRES.find((h) => raw.includes(h)) || (horaMatch ? raw.trim() : null);
        if (hora) {
          flow.data.hora = hora;
          flow.step = 'nombre';
          await botSay('¡Estupendo! ¿A nombre de quién pongo la reserva?');
          quickSet([]);
        } else {
          await botSay('¿A qué hora te viene mejor? Puedes elegir uno de los huecos libres 👇');
          quickSet(HORAS_LIBRES);
        }
        return;
      }

      if (flow.step === 'nombre') {
        flow.data.nombre = raw.trim();
        flow.active = false;
        flow.step = 'done';
        await botSay([
          `✅ <strong>¡Reserva confirmada!</strong>`,
          `${escapeHtml(flow.data.nombre)}, te esperamos para <strong>${escapeHtml(flow.data.servicio)}</strong> el <strong>${escapeHtml(flow.data.dia)}</strong> a las <strong>${escapeHtml(flow.data.hora)}</strong>.`,
          `Te enviaré un recordatorio el día antes. ¡Gracias por reservar en ${BIZ.name}! 💇`,
        ]);
        await botSay('Por cierto — esto es una demostración de ELYON. Un agente real haría exactamente esto en tu propio WhatsApp, con tu agenda y tus servicios. 😉');
        quickSet(['Ver precios', 'Empezar de nuevo']);
        return;
      }
    }

    // --- Fuera del flujo: intención general ---

    // Saludos
    if (has(text, ['hola', 'buenas', 'hey', 'buenos dias', 'buenas tardes', 'buenas noches'])) {
      await botSay(`¡Hola! 👋 Soy el asistente de ${BIZ.name}. Puedo ayudarte a <strong>reservar una cita</strong>, ver <strong>precios</strong>, <strong>horarios</strong> o resolver cualquier duda. ¿Qué necesitas?`);
      quickSet(['Reservar cita', 'Ver precios', 'Horarios']);
      return;
    }

    // Reservar → inicia flujo
    if (has(text, ['reservar', 'reserva', 'cita', 'pedir hora', 'coger hora', 'agendar', 'quiero ir'])) {
      flow.active = true;
      flow.step = 'servicio';
      flow.data = {};
      await botSay(['¡Genial! Vamos a reservar tu cita. 📅', '¿Qué servicio te gustaría?']);
      quickSet(BIZ.servicios.slice(0, 4).map((s) => s.nombre));
      return;
    }

    // Precios
    if (has(text, ['precio', 'precios', 'cuanto cuesta', 'cuanto vale', 'tarifa', 'coste', 'cuesta'])) {
      await botSay(serviciosLista());
      await botSay('¿Quieres que te reserve alguno? 😊');
      quickSet(['Reservar cita', 'Horarios']);
      return;
    }

    // Servicios
    if (has(text, ['servicio', 'servicios', 'que haceis', 'que hacen', 'ofreceis', 'hacen'])) {
      await botSay(serviciosLista());
      quickSet(['Reservar cita', 'Ver horarios']);
      return;
    }

    // Horarios
    if (has(text, ['horario', 'horarios', 'abierto', 'abren', 'abris', 'cerrado', 'cierran', 'a que hora', 'cuando abris'])) {
      await botSay(`🕒 Nuestro horario es:<br>${BIZ.horario}`);
      quickSet(['Reservar cita', 'Dónde estáis']);
      return;
    }

    // Ubicación
    if (has(text, ['donde', 'direccion', 'ubicacion', 'como llego', 'sitio', 'lugar', 'estais'])) {
      await botSay(`📍 ${BIZ.direccion}`);
      quickSet(['Reservar cita', 'Horarios']);
      return;
    }

    // Teléfono / contacto
    if (has(text, ['telefono', 'llamar', 'numero', 'contacto', 'whatsapp'])) {
      await botSay(`Puedes llamarnos o escribirnos al <strong>${BIZ.telefono}</strong> 📞`);
      quickSet(['Reservar cita', 'Horarios']);
      return;
    }

    // Profesionales
    if (has(text, ['quien', 'peluquer', 'estilista', 'profesional', 'con quien'])) {
      await botSay(`Nuestro equipo lo forman ${BIZ.profesionales.join(', ')} 💇‍♀️. Puedes pedir cita con quien prefieras.`);
      quickSet(['Reservar cita', 'Ver precios']);
      return;
    }

    // Agradecimientos
    if (has(text, ['gracias', 'genial', 'perfecto', 'vale', 'ok'])) {
      await botSay('¡A ti! 😊 ¿Necesitas algo más?');
      quickSet(['Reservar cita', 'Ver precios', 'Horarios']);
      return;
    }

    // Empezar de nuevo
    if (has(text, ['empezar de nuevo', 'reiniciar', 'de nuevo'])) {
      await botSay(`¡Claro! ¿En qué te ayudo? Puedo gestionar reservas, precios y horarios de ${BIZ.name}.`);
      quickSet(['Reservar cita', 'Ver precios', 'Horarios']);
      return;
    }

    // Fallback
    await botSay([
      'Mmm, no estoy seguro de haber entendido 🤔',
      `Puedo ayudarte con <strong>reservas</strong>, <strong>precios</strong>, <strong>horarios</strong> o <strong>ubicación</strong> de ${BIZ.name}. ¿Qué prefieres?`,
    ]);
    quickSet(['Reservar cita', 'Ver precios', 'Horarios']);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ============================================================
     Entrada de usuario
     ============================================================ */
  let botBusy = false;

  async function handleUserText(text) {
    const clean = text.trim();
    if (!clean || botBusy) return;
    addUser(clean);
    input.value = '';
    botBusy = true;
    if (quickWrap) quickWrap.innerHTML = '';
    await respond(clean);
    botBusy = false;
    input.focus();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserText(input.value);
  });

  /* ============================================================
     Arranque: mensaje de bienvenida cuando la sección entra en vista
     ============================================================ */
  let started = false;
  function startConversation() {
    if (started) return;
    started = true;
    (async () => {
      await wait(400);
      await botSay(`¡Hola! 👋 Bienvenido/a a <strong>${BIZ.name}</strong>. Soy el asistente virtual y puedo ayudarte a reservar, ver precios u horarios. ¿Qué necesitas? 😊`);
      quickSet(['Reservar cita', 'Ver precios', 'Horarios', 'Dónde estáis']);
    })();
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startConversation();
        obs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  obs.observe(root);
})();
