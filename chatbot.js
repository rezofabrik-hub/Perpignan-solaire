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
    btn.innerHTML = '<img src="data:image/webp;base64,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" alt="Assistant solaire" style="width:68px;height:68px;border-radius:50%;display:block"><span id="sb-badge">1</span>';height:68px;border-radius:50%;display:block"><span id="sb-badge">1</span>';
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
