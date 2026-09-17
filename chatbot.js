/* Chatbot Solaire 66 — Perpignan Solaire / SARL Rezofabrik */
(function () {
  'use strict';

  var ACCESS_KEY = '02224188-7400-4bcb-8e85-6e2a926dd955';
  var PHONE = '07 75 76 92 32';

  /* ── scoring weights ─────────────────────────────────────────────── */
  var SCORES = {
    statut:        { 'Propriétaire': 3, 'Professionnel': 3, 'Bailleur': 2 },
    type_logement: { 'Maison': 3, 'Copropriété': 2, 'Local pro': 3, 'Agriculture': 3 },
    facture:       { 'Moins de 80€': 0, '80 à 150€': 1, '150 à 250€': 2, 'Plus de 250€': 3 },
    objectif:      { 'Réduire facture': 1, 'Revente surplus': 2, 'Autonomie batterie': 2, 'Démarche éco': 1 }
  };

  /* ── conversation steps ──────────────────────────────────────────── */
  var STEPS = [
    {
      id: 'statut',
      msg: 'Bonjour ! 👋 Je suis votre assistant solaire pour le département 66.\n\nVous êtes…',
      choices: [
        { label: '🏠 Propriétaire', value: 'Propriétaire' },
        { label: '🏢 Professionnel / Entreprise', value: 'Professionnel' },
        { label: '🏡 Bailleur / Investisseur', value: 'Bailleur' },
        { label: '🔑 Locataire', value: 'Locataire', disqualify: true }
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

  /* ── phone validation ────────────────────────────────────────────── */
  function validatePhone(raw) {
    var cleaned = raw.replace(/[\s\.\-\/]/g, '');
    /* must be French mobile 06/07 + 8 digits */
    if (!/^(06|07)\d{8}$/.test(cleaned)) return false;
    /* reject all-same-digit (0611111111, 0600000000…) */
    if (/^(\d)\1{9}$/.test(cleaned)) return false;
    /* reject obvious fake patterns */
    var fakes = ['0600000000','0700000000','0612345678','0623456789','0601020304','0601234567'];
    if (fakes.indexOf(cleaned) !== -1) return false;
    /* reject 5+ consecutive sequential digits */
    var digits = cleaned.replace(/\D/g, '');
    var inc = 0, dec = 0;
    for (var i = 1; i < digits.length; i++) {
      var d = parseInt(digits[i]) - parseInt(digits[i - 1]);
      if (d === 1) { inc++; if (inc >= 4) return false; } else inc = 0;
      if (d === -1) { dec++; if (dec >= 4) return false; } else dec = 0;
    }
    return true;
  }

  /* ── compute lead score ──────────────────────────────────────────── */
  function computeScore() {
    var total = 0;
    Object.keys(SCORES).forEach(function (field) {
      var answer = state.answers[field];
      if (answer && SCORES[field][answer] !== undefined) {
        total += SCORES[field][answer];
      }
    });
    return total;
  }

  /* ── lead tag from score ─────────────────────────────────────────── */
  function getTag(score) {
    if (score >= 9) return '🔥 TRÈS CHAUD';
    if (score >= 6) return '⭐ CHAUD';
    if (score >= 3) return '🌡️ TIÈDE';
    return '❄️ FROID';
  }

  /* ── DOM helpers ─────────────────────────────────────────────────── */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  /* ── build UI ────────────────────────────────────────────────────── */
  function buildWidget() {
    /* ── styles ── */
    var style = document.createElement('style');
    style.textContent = [
      /* Portal: zero-size fixed anchor — bypasses overflow:hidden on body/html (iOS Safari fix) */
      '#sb-portal{position:fixed;bottom:0;right:0;width:0;height:0;overflow:visible;z-index:9999;pointer-events:none}',
      '#sb-btn{position:absolute;bottom:24px;right:24px;pointer-events:all;width:68px;height:68px;border-radius:50%;background:transparent;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(245,158,11,.45);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;padding:0;overflow:hidden}',
      '#sb-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(245,158,11,.55)}',
      '#sb-btn img{width:68px;height:68px;object-fit:cover;border-radius:50%;display:block}',
      '#sb-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}',
      '#sb-win{position:absolute;bottom:90px;right:0;pointer-events:all;width:340px;max-width:calc(100vw - 32px);background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;max-height:calc(100vh - 120px)}',
      '#sb-win.open{display:flex}',
      '#sb-head{background:linear-gradient(135deg,#F59E0B,#D97706);padding:10px 14px;display:flex;align-items:center;gap:10px}',
      '#sb-head-logo{display:flex;align-items:center;flex-shrink:0;text-decoration:none;background:#fff;border-radius:8px;padding:3px 7px;gap:5px}',
      '#sb-head-logo img{height:32px;width:auto;display:block}',
      '#sb-head-info{flex:1;min-width:0}',
      '#sb-head-name{color:#fff;font-weight:700;font-size:13px}',
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
    btn.innerHTML = '<img src="data:image/webp;base64,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" alt="Assistant solaire" style="width:68px;height:68px;border-radius:50%;display:block"><span id="sb-badge">1</span>';
    portal.appendChild(btn);

    /* ── chat window ── */
    var win = el('div', '');
    win.id = 'sb-win';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Chatbot Solaire 66');
    win.innerHTML = [
      '<div id="sb-head">',
      '  <a id="sb-head-logo" href="./index.html" title="Retour à l\'accueil"><img src="./logo.svg" alt="Perpignan Solaire"></a>',
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

    /* ── disqualify politely ── */
    function disqualify() {
      clearControls();
      addBotBubble('Merci pour votre intérêt ! 😊\n\nMalheureusement, les panneaux solaires nécessitent d\'être propriétaire du bien.\n\nSi votre situation change, nous serons ravis de vous accompagner. Bonne journée ! ☀️');
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
              if (c.disqualify) { disqualify(); return; }
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
      if (step.type === 'tel') {
        if (!validatePhone(val)) {
          addBotBubble('Ce numéro ne semble pas valide. Merci de saisir votre numéro mobile (06 ou 07) pour que nous puissions vous rappeler 📱');
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
      var score = computeScore();
      var tag = getTag(score);
      addBotBubble('Parfait ' + (state.answers.prenom || '') + ' ! 🎉 Je prépare votre étude…').then(function () {
        var commune = state.answers.commune || 'Non précisée';
        var subject = tag + ' — ' + (state.answers.prenom || 'Prospect') + ' (' + commune + ') · Score ' + score + '/11';
        var body = [
          '━━━ QUALIFICATION DU LEAD ━━━',
          'Score    : ' + score + '/11 — ' + tag,
          '',
          '━━━ INFORMATIONS ━━━',
          'Statut        : ' + (state.answers.statut || '-'),
          'Type de bien  : ' + (state.answers.type_logement || '-'),
          'Commune       : ' + commune,
          'Facture/mois  : ' + (state.answers.facture || '-'),
          'Objectif      : ' + (state.answers.objectif || '-'),
          'Prénom        : ' + (state.answers.prenom || '-'),
          'Téléphone     : ' + (state.answers.tel || '-'),
          '',
          '━━━ SOURCE ━━━',
          'Canal  : Chatbot site Perpignan Solaire',
          'Page   : ' + window.location.href,
          'Date   : ' + new Date().toLocaleString('fr-FR')
        ].join('\n');

        var formData = new FormData();
        formData.append('access_key', ACCESS_KEY);
        formData.append('subject', subject);
        formData.append('from_name', 'Chatbot Perpignan Solaire');
        formData.append('prenom', state.answers.prenom || '');
        formData.append('tel', state.answers.tel || '');
        formData.append('score', score + '/11 — ' + tag);
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
