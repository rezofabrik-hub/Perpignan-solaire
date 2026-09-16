/* form-qualify.js — Qualification & validation des leads / Perpignan Solaire */
(function () {
  'use strict';

  /* ── Phone validation ────────────────────────────────────────────── */
  function validatePhone(raw) {
    var cleaned = raw.replace(/[\s\.\-\/]/g, '');
    if (!/^(06|07)\d{8}$/.test(cleaned)) return false;
    if (/^(\d)\1{9}$/.test(cleaned)) return false;
    var fakes = ['0600000000','0700000000','0612345678','0623456789','0601020304','0601234567'];
    if (fakes.indexOf(cleaned) !== -1) return false;
    var digits = cleaned.replace(/\D/g, '');
    var inc = 0, dec = 0;
    for (var i = 1; i < digits.length; i++) {
      var d = parseInt(digits[i]) - parseInt(digits[i - 1]);
      if (d === 1) { inc++; if (inc >= 4) return false; } else inc = 0;
      if (d === -1) { dec++; if (dec >= 4) return false; } else dec = 0;
    }
    return true;
  }

  function showTelError(input, msg) {
    var errId = input.id + '-fq-err';
    var err = document.getElementById(errId);
    if (!err) {
      err = document.createElement('div');
      err.id = errId;
      err.style.cssText = 'color:#ef4444;font-size:12px;margin-top:5px;font-family:system-ui,sans-serif;font-weight:500;';
      input.parentNode.insertBefore(err, input.nextSibling);
    }
    err.textContent = msg || '';
    err.style.display = msg ? 'block' : 'none';
    input.style.outline = msg ? '2px solid #ef4444' : '';
  }

  /* ── Scoring (devisform pages) ───────────────────────────────────── */
  var TYPE_SCORES = {
    'Maison individuelle — Photovoltaïque seul': 2,
    'Maison individuelle — + Batterie physique': 3,
    'Maison individuelle — + Batterie virtuelle': 2,
    'Professionnel / Entreprise': 3,
    'Agricole': 3,
    'Autre': 1
  };

  function computeDevisScore(form) {
    var cp = (form.cp ? form.cp.value.trim() : '');
    var typ = (form.type ? form.type.value : '');
    var cpScore = 0;
    if (cp.startsWith('66')) cpScore = 3;
    else if (cp.startsWith('11') || cp.startsWith('34') || cp.startsWith('09')) cpScore = 1;
    var typScore = TYPE_SCORES[typ] || 0;
    return cpScore + typScore;
  }

  function getTag(score) {
    if (score >= 5) return '🔥 TRÈS CHAUD';
    if (score >= 3) return '⭐ CHAUD';
    if (score >= 1) return '🌡️ TIÈDE';
    return '❌ FROID';
  }

  /* ── Patch commune form (#lf) — phone validation ─────────────────── */
  function patchLfForm() {
    var form = document.getElementById('lf');
    var telInput = document.getElementById('lf-tl');
    if (!form || !telInput) return;

    form.addEventListener('submit', function (e) {
      var val = telInput.value.trim();
      if (!validatePhone(val)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showTelError(telInput, 'Numéro invalide — saisissez votre mobile (06 ou 07)');
        telInput.focus();
        return false;
      }
      showTelError(telInput, '');
    }, true); /* capture phase — s'exécute avant le handler existant */

    telInput.addEventListener('input', function () {
      if (this.value.trim()) showTelError(this, '');
    });
  }

  /* ── Patch devisform — phone validation + scoring tag ────────────── */
  function patchDevisForm() {
    var form = document.getElementById('devisform');
    var telInput = document.getElementById('dv-tel');
    if (!form || !telInput) return;

    /* hidden input that the existing handler will send to web3forms */
    var tagInput = document.createElement('input');
    tagInput.type = 'hidden';
    tagInput.name = 'qualification';
    form.appendChild(tagInput);

    form.addEventListener('submit', function (e) {
      var val = telInput.value.trim();
      if (!validatePhone(val)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showTelError(telInput, 'Numéro invalide — saisissez votre mobile (06 ou 07)');
        telInput.focus();
        return false;
      }
      showTelError(telInput, '');
      var score = computeDevisScore(form);
      tagInput.value = getTag(score) + ' · Score ' + score + '/6';
    }, true);

    telInput.addEventListener('input', function () {
      if (this.value.trim()) showTelError(this, '');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    patchLfForm();
    patchDevisForm();
  });
})();
