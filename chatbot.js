/* Chatbot Solaire 66 — Perpignan Solaire / SARL Rezofabrik */
(function () {
  'use strict';

  var ACCESS_KEY = '02224188-7400-4bcb-8e85-6e2a926dd955';
  var PHONE = '07 75 76 92 32';

  /* ── conversation tree ──────────────────────────────────────────── */
  var STEPS = [
    {
      id: 'statut',
      msg: 'Bonjour ! 👋 Je suis votre assistant solaire pour le département 66.\n\nVous êtes…',
      choices: [
        { label: '🏠 Propriétaire', value: 'Propriétaire' },
        { label: '🏢 Professionnel / Entreprise', value: 'Professionnel' },
        { label: '🏡 Bailleur / Investisseur', value: 'Bailleur' }
      ]
    },
    {
      id: 'type_logement',
      msg: 'Parfait ! Quel type de bien ?',
      choices: [
        { label: '🏠 Maison individuelle', value: 'Maison' },
        { label: '🏘️ Maison en copropriété', value: 'Copropriété' },
        { label: '🏭 Local professionnel / Hangar', value: 'Local pro' },
        { label: '🌾 Exploitation agricole', value: 'Agriculture' }
      ]
    },
    {
      id: 'commune',
      msg: 'Dans quelle commune habitez-vous (département 66) ?',
      type: 'text',
      placeholder: 'Ex : Perpignan, Canet, Argelès…'
    },
    {
      id: 'facture',
      msg: 'Quelle est votre facture d\'électricité mensuelle ?',
      choices: [
        { label: '< 80 €/mois', value: 'Moins de 80€' },
        { label: '80 – 150 €/mois', value: '80 à 150€' },
        { label: '150 – 250 €/mois', value: '150 à 250€' },
        { label: '> 250 €/mois', value: 'Plus de 250€' }
      ]
    },
    {
      id: 'objectif',
      msg: 'Quel est votre objectif principal ?',
      choices: [
        { label: '💰 Réduire ma facture', value: 'Réduire facture' },
        { label: '📈 Revendre le surplus (EDF OA)', value: 'Revente surplus' },
        { label: '🔋 Autonomie + stockage batterie', value: 'Autonomie batterie' },
        { label: '🌿 Démarche écologique', value: 'Démarche éco' }
      ]
    },
    {
      id: 'prenom',
      msg: 'Super ! Pour vous envoyer votre étude personnalisée gratuite, quel est votre prénom ?',
      type: 'text',
      placeholder: 'Votre prénom'
    },
    {
      id: 'tel',
      msg: 'Et votre numéro de téléphone ? (nous vous rappelons sous 24h)',
      type: 'tel',
      placeholder: '06 XX XX XX XX'
    }
  ];

  /* ── state ──────────────────────────────────────────────────────── */
  var state = { step: 0, answers: {}, open: false };

  /* ── DOM helpers ────────────────────────────────────────────────── */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  /* ── build UI ───────────────────────────────────────────────────── */
  function buildWidget() {
    /* ── styles ── */
    var style = document.createElement('style');
    style.textContent = [
      /* Portal: zero-size fixed anchor — bypasses overflow:hidden on body/html (iOS Safari fix) */
      '#sb-portal{position:fixed;bottom:0;right:0;width:0;height:0;overflow:visible;z-index:9999;pointer-events:none}',
      '#sb-btn{position:absolute;bottom:24px;right:24px;pointer-events:all;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#F59E0B,#D97706);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(245,158,11,.45);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}',
      '#sb-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(245,158,11,.55)}',
      '#sb-btn svg{width:28px;height:28px;fill:#fff}',
      '#sb-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}',
      '#sb-win{position:absolute;bottom:90px;right:0;pointer-events:all;width:340px;max-width:calc(100vw - 32px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;max-height:calc(100vh - 120px)}',
      '#sb-win.open{display:flex}',
      '#sb-head{background:linear-gradient(135deg,#F59E0B,#D97706);padding:14px 16px;display:flex;align-items:center;gap:10px}',
      '#sb-head-icon{width:36px;height:36px;background:rgba(255,255,255,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '#sb-head-icon svg{width:20px;height:20px;fill:#fff}',
      '#sb-head-info{flex:1;min-width:0}',
      '#sb-head-name{color:#fff;font-weight:700;font-size:14px}',
      '#sb-head-sub{color:rgba(255,255,255,.8);font-size:11px}',
      '#sb-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.8);font-size:20px;padding:0;line-height:1}',
      '#sb-msgs{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:10px;min-height:80px}',
      '.sb-bubble{max-width:85%;padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.5;white-space:pre-line}',
      '.sb-bot{background:#F3F4F6;color:#1F2937;border-bottom-left-radius:4px;align-self:flex-start}',
      '.sb-user{background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}',
      '.sb-typing{display:flex;gap:4px;align-items:center;padding:10px 13px;background:#F3F4F6;border-radius:12px;border-bottom-left-radius:4px;align-self:flex-start}',
      '.sb-dot{width:7px;height:7px;background:#9CA3AF;border-radius:50%;animation:sb-blink 1.2s infinite}',
      '.sb-dot:nth-child(2){animation-delay:.2s}.sb-dot:nth-child(3){animation-delay:.4s}',
      '@keyframes sb-blink{0%,80%,100%{opacity:.3}40%{opacity:1}}',
      '#sb-choices{padding:10px 14px 4px;display:flex;flex-wrap:wrap;gap:7px}',
      '.sb-choice{background:#fff;border:1.5px solid #E5E7EB;border-radius:20px;padding:7px 13px;font-size:12px;color:#374151;cursor:pointer;transition:border-color .15s,background .15s;font-family:inherit}',
      '.sb-choice:hover{border-color:#F59E0B;background:#FFF7E6;color:#92400E}',
      '#sb-input-row{padding:10px 14px;border-top:1px solid #F3F4F6;display:flex;gap:8px;align-items:center}',
      '#sb-input{flex:1;border:1.5px solid #E5E7EB;border-radius:20px;padding:8px 14px;font-size:13px;outline:none;font-family:inherit;color:#1F2937}',
      '#sb-input:focus{border-color:#F59E0B}',
      '#sb-send{background:linear-gradient(135deg,#F59E0B,#D97706);border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '#sb-send svg{width:16px;height:16px;fill:#fff}',
      '#sb-footer{padding:8px 14px;text-align:center;font-size:10px;color:#9CA3AF;border-top:1px solid #F3F4F6}',
      '@media(max-width:380px){#sb-win{right:0;bottom:84px}#sb-btn{bottom:16px;right:12px}}'
    ].join('');
    document.head.appendChild(style);

    /* ── portal (zero-size fixed anchor, bypasses overflow:hidden on body) ── */
    var portal = el('div', '');
    portal.id = 'sb-portal';
    document.body.appendChild(portal);

    /* ── toggle button ── */
    var btn = el('button', '');
    btn.id = 'sb-btn';
    btn.setAttribute('aria-label', 'Ouvrir le chatbot solaire');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg><span id="sb-badge">1</span>';
    portal.appendChild(btn);

    /* ── chat window ── */
    var win = el('div', '');
    win.id = 'sb-win';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Chatbot Solaire 66');
    win.innerHTML = [
      '<div id="sb-head">',
      '  <div id="sb-head-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></div>',
      '  <div id="sb-head-info"><div id="sb-head-name">Assistant Solaire 66</div><div id="sb-head-sub">Devis gratuit · Réponse sous 24h</div></div>',
      '  <button id="sb-close" aria-label="Fermer">✕</button>',
      '</div>',
      '<div id="sb-msgs"></div>',
      '<div id="sb-choices"></div>',
      '<div id="sb-input-row" style="display:none">',
      '  <input id="sb-input" type="text" autocomplete="off"/>',
      '  <button id="sb-send" aria-label="Envoyer"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>',
      '</div>',
      '<div id="sb-footer">Perpignan Solaire · ' + PHONE + '</div>'
    ].join('');
    portal.appendChild(win);

    /* ── refs ── */
    var msgs = document.getElementById('sb-msgs');
    var choices = document.getElementById('sb-choices');
    var inputRow = document.getElementById('sb-input-row');
    var input = document.getElementById('sb-input');
    var badge = document.getElementById('sb-badge');

    /* ── toggle ── */
    btn.addEventListener('click', function () {
      state.open = !state.open;
      win.classList.toggle('open', state.open);
      if (state.open) {
        badge.style.display = 'none';
        if (state.step === 0 && msgs.children.length === 0) {
          setTimeout(function () { showStep(0); }, 200);
        }
        scrollBottom();
      }
    });
    document.getElementById('sb-close').addEventListener('click', function () {
      state.open = false;
      win.classList.remove('open');
    });

    /* ── send input ── */
    function sendInput() {
      var val = input.value.trim();
      if (!val) return;
      addUserBubble(val);
      input.value = '';
      handleTextAnswer(val);
    }
    document.getElementById('sb-send').addEventListener('click', sendInput);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendInput(); });

    /* ── scroll ── */
    function scrollBottom() {
      setTimeout(function () { msgs.scrollTop = msgs.scrollHeight; }, 50);
    }

    /* ── add bot bubble ── */
    function addBotBubble(text, delay) {
      return new Promise(function (resolve) {
        var typing = el('div', 'sb-typing');
        typing.innerHTML = '<div class="sb-dot"></div><div class="sb-dot"></div><div class="sb-dot"></div>';
        msgs.appendChild(typing);
        scrollBottom();
        setTimeout(function () {
          msgs.removeChild(typing);
          var b = el('div', 'sb-bubble sb-bot', text.replace(/\n/g, '<br>'));
          msgs.appendChild(b);
          scrollBottom();
          resolve();
        }, delay || 700);
      });
    }

    /* ── add user bubble ── */
    function addUserBubble(text) {
      var b = el('div', 'sb-bubble sb-user');
      b.textContent = text;
      msgs.appendChild(b);
      scrollBottom();
    }

    /* ── clear controls ── */
    function clearControls() {
      choices.innerHTML = '';
      inputRow.style.display = 'none';
      input.removeAttribute('type');
      input.removeAttribute('placeholder');
    }

    /* ── show step ── */
    function showStep(idx) {
      if (idx >= STEPS.length) { submitLead(); return; }
      var step = STEPS[idx];
      clearControls();
      addBotBubble(step.msg).then(function () {
        if (step.choices) {
          step.choices.forEach(function (c) {
            var btn2 = el('button', 'sb-choice');
            btn2.textContent = c.label;
            btn2.addEventListener('click', function () {
              addUserBubble(c.label);
              state.answers[step.id] = c.value;
              clearControls();
              state.step = idx + 1;
              setTimeout(function () { showStep(state.step); }, 400);
            });
            choices.appendChild(btn2);
          });
        } else {
          inputRow.style.display = 'flex';
          input.type = step.type || 'text';
          input.placeholder = step.placeholder || '';
          setTimeout(function () { input.focus(); }, 100);
        }
      });
    }

    /* ── handle text input ── */
    function handleTextAnswer(val) {
      var step = STEPS[state.step];
      if (!step) return;
      /* basic tel validation */
      if (step.type === 'tel') {
        var digits = val.replace(/\D/g, '');
        if (digits.length < 9) {
          addBotBubble('Merci de saisir un numéro valide (ex : 06 XX XX XX XX) 📱');
          return;
        }
      }
      state.answers[step.id] = val;
      clearControls();
      state.step += 1;
      setTimeout(function () { showStep(state.step); }, 400);
    }

    /* ── submit ── */
    function submitLead() {
      clearControls();
      addBotBubble('Parfait ' + (state.answers.prenom || '') + ' ! 🎉 Je prépare votre étude…').then(function () {
        var commune = state.answers.commune || 'Non précisée';
        var subject = '💬 Chat Solaire 66 — ' + (state.answers.prenom || 'Prospect') + ' (' + commune + ')';
        var body = [
          'Statut : ' + (state.answers.statut || '-'),
          'Type de bien : ' + (state.answers.type_logement || '-'),
          'Commune : ' + commune,
          'Facture mensuelle : ' + (state.answers.facture || '-'),
          'Objectif : ' + (state.answers.objectif || '-'),
          'Prénom : ' + (state.answers.prenom || '-'),
          'Téléphone : ' + (state.answers.tel || '-'),
          '',
          'Source : Chatbot site Perpignan Solaire',
          'Page : ' + window.location.href
        ].join('\n');

        var formData = new FormData();
        formData.append('access_key', ACCESS_KEY);
        formData.append('subject', subject);
        formData.append('from_name', 'Chatbot Perpignan Solaire');
        formData.append('prenom', state.answers.prenom || '');
        formData.append('tel', state.answers.tel || '');
        formData.append('type', state.answers.type_logement || '');
        formData.append('msg', body);
        formData.append('botcheck', '');

        fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.success) {
              addBotBubble('✅ Votre demande est bien enregistrée !\n\nNous vous rappelons au ' + (state.answers.tel || '') + ' sous 24h pour votre devis gratuit.\n\nEn attendant, n\'hésitez pas à appeler le ' + PHONE + ' 😊');
            } else {
              throw new Error('API error');
            }
          })
          .catch(function () {
            addBotBubble('Votre demande a bien été reçue ! 📞\n\nNous vous contacterons sous 24h.\nVous pouvez aussi nous appeler directement : ' + PHONE);
          });
      });
    }
  }

  /* ── init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
