// Cloudflare Worker — Proxy Airtable sécurisé pour solaire-66.fr
// Déployez ce fichier sur workers.cloudflare.com
//
// Secret requis (Settings → Variables → Add variable → Encrypt) :
//   AT_TOKEN  =  votre nouveau Personal Access Token Airtable
//
// Constantes (pas secrètes) — modifier si besoin :
const AT_BASE  = 'appctTHuijKSMlrFa';
const AT_TABLE = 'tblixOyNEDUwrHR5h';
const ALLOWED_ORIGIN = 'https://solaire-66.fr';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function airtableHeaders(env) {
  return {
    'Authorization': `Bearer ${env.AT_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// ── Route : créer un enregistrement partenaire ────────────────────────────────
async function handlePartner(req, env) {
  const { fields } = await req.json();
  const res = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}`,
    { method: 'POST', headers: airtableHeaders(env), body: JSON.stringify({ fields }) }
  );
  if (!res.ok) return json({ ok: false, error: await res.text() }, 500);
  return json({ ok: true });
}

// ── Route : vérifier un token et retourner le statut ─────────────────────────
async function handleCheckToken(req, env) {
  const { token } = await req.json();
  if (!token) return json({ statut: null, recordId: null });

  const formula = encodeURIComponent(`{Token}="${token}"`);
  const res = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${env.AT_TOKEN}` } }
  );
  if (!res.ok) return json({ statut: null, recordId: null }, 500);

  const data = await res.json();
  if (!data.records || data.records.length === 0) {
    return json({ statut: null, recordId: null });
  }
  const record = data.records[0];
  return json({
    statut:   record.fields['Statut']  || null,
    prenom:   record.fields['Prénom']  || '',
    nom:      record.fields['Nom']     || '',
    recordId: record.id,
  });
}

// ── Route : soumettre le questionnaire légal (PATCH) ─────────────────────────
async function handleSubmit(req, env) {
  const { recordId, fields } = await req.json();
  if (!recordId) return json({ ok: false, error: 'recordId manquant' }, 400);

  const res = await fetch(
    `https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}/${recordId}`,
    { method: 'PATCH', headers: airtableHeaders(env), body: JSON.stringify({ fields }) }
  );
  if (!res.ok) return json({ ok: false, error: await res.text() }, 500);
  return json({ ok: true });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS });
    }

    const url = new URL(req.url);
    if (url.pathname === '/partner')          return handlePartner(req, env);
    if (url.pathname === '/check-token')      return handleCheckToken(req, env);
    if (url.pathname === '/submit')           return handleSubmit(req, env);

    return new Response('Not Found', { status: 404, headers: CORS });
  },
};
