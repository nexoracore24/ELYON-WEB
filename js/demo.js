/* ==========================================================================
   ELYON AI — demo.js
   Dos interacciones de demostración:
     1. Chat "Demo IA": el visitante pulsa una pregunta sugerida y el agente
        responde con un texto pre-escrito, simulando escritura ("typing").
        No hay backend ni IA real — es un guión que demuestra el tono.
     2. Tabs de "Casos de éxito detallados": cambia el panel visible y avisa
        a stats.js (evento 'case:shown') para re-animar las barras.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. Chat Demo IA
     ============================================================ */
  const messagesEl = document.getElementById('demoChatMessages');
  const suggestionsEl = document.getElementById('demoSuggestions');

  if (messagesEl && suggestionsEl) {
    // Guiones de respuesta. Cada uno es un array de burbujas que el agente
    // "escribe" en secuencia, para que parezca una conversación real.
    const scripts = {
      automatizar: [
        'Genial 🙌 Para automatizar tu negocio, primero identifico las tareas que más tiempo te quitan: responder mensajes, agendar y hacer seguimientos.',
        'Después despliego un agente que se encarga de ellas 24/7 y lo conecto con tus herramientas (WhatsApp, calendario, CRM).',
        '¿Quieres que te prepare una demo con tu caso concreto? Solo necesito saber a qué se dedica tu empresa.',
      ],
      vender: [
        'Para vender más, un agente ELYON cualifica cada lead al instante y responde sin que se enfríe el interés.',
        'Detecta intención de compra, envía presupuestos automáticamente y agenda llamadas con tu equipo comercial.',
        'Negocios parecidos al tuyo cierran hasta un 30% más rápido. ¿Te enseño cómo quedaría con tu producto?',
      ],
      chatbot: [
        'Lo que ofrecemos va más allá de un chatbot: es un agente entrenado con tu catálogo, precios y horarios reales.',
        'Entiende lenguaje natural, mantiene el contexto de la conversación y sabe cuándo pasar el caso a una persona.',
        '¿En qué canal lo necesitas primero: WhatsApp, Instagram o tu web?',
      ],
      whatsapp: [
        'Perfecto. Conecto un agente a tu WhatsApp Business con tu número actual, sin perder tu historial.',
        'Responde al instante a cualquier hora, agenda citas y envía recordatorios automáticos para reducir ausencias.',
        '¿Quieres verlo funcionando con un ejemplo de tu negocio?',
      ],
      reservas: [
        'Con ELYON, tus clientes reservan solos por WhatsApp o web, y la cita entra directa en tu calendario.',
        'El agente consulta tu disponibilidad real, confirma la reserva y envía recordatorios antes de la cita.',
        'La agenda se llena sola y las ausencias bajan de forma notable. ¿Te preparo una demo?',
      ],
    };

    const questionLabels = {
      automatizar: 'Quiero automatizar mi negocio',
      vender: 'Quiero vender más',
      chatbot: 'Necesito un chatbot',
      whatsapp: 'Quiero automatizar WhatsApp',
      reservas: 'Quiero reservar citas automáticamente',
    };

    let busy = false;

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addUserMessage(text) {
      const wrap = document.createElement('div');
      wrap.className = 'demo-msg demo-msg--user';
      wrap.innerHTML = `<div class="demo-msg__bubble"></div>`;
      wrap.querySelector('.demo-msg__bubble').textContent = text;
      messagesEl.appendChild(wrap);
      scrollToBottom();
    }

    function addTypingIndicator() {
      const wrap = document.createElement('div');
      wrap.className = 'demo-msg demo-msg--bot demo-msg--typing';
      wrap.innerHTML = `<div class="demo-msg__bubble"><span class="demo-typing-dot"></span><span class="demo-typing-dot"></span><span class="demo-typing-dot"></span></div>`;
      messagesEl.appendChild(wrap);
      scrollToBottom();
      return wrap;
    }

    function addBotMessage(text) {
      const wrap = document.createElement('div');
      wrap.className = 'demo-msg demo-msg--bot';
      wrap.innerHTML = `<div class="demo-msg__bubble"></div>`;
      wrap.querySelector('.demo-msg__bubble').textContent = text;
      messagesEl.appendChild(wrap);
      scrollToBottom();
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    async function runScript(key) {
      if (busy) return;
      const script = scripts[key];
      if (!script) return;
      busy = true;

      // Deshabilita las sugerencias mientras "responde".
      suggestionsEl.querySelectorAll('button').forEach((b) => (b.disabled = true));

      addUserMessage(questionLabels[key]);
      await wait(prefersReducedMotion ? 0 : 500);

      for (const line of script) {
        if (prefersReducedMotion) {
          addBotMessage(line);
          continue;
        }
        const typing = addTypingIndicator();
        // Tiempo de "escritura" proporcional a la longitud, con tope.
        await wait(Math.min(500 + line.length * 12, 1500));
        typing.remove();
        addBotMessage(line);
        await wait(350);
      }

      // Marca esta pregunta como usada; reactiva el resto.
      suggestionsEl.querySelectorAll('button').forEach((b) => {
        if (b.dataset.demoKey === key) {
          b.disabled = true;
          b.style.opacity = '0.4';
        } else {
          b.disabled = false;
        }
      });

      busy = false;
    }

    suggestionsEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => runScript(btn.dataset.demoKey));
    });
  }

  /* ============================================================
     2. Tabs de casos de éxito
     ============================================================ */
  const tabs = document.querySelectorAll('.cases-tab');
  const contents = document.querySelectorAll('.case-content');

  if (tabs.length && contents.length) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.case;

        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });

        let shownContainer = null;
        contents.forEach((content) => {
          const match = content.dataset.caseContent === key;
          content.classList.toggle('is-active', match);
          if (match) shownContainer = content;
        });

        // Avisa a stats.js para que re-anime las barras del panel mostrado.
        if (shownContainer) {
          document.dispatchEvent(new CustomEvent('case:shown', { detail: { container: shownContainer } }));
        }
      });
    });
  }
})();
