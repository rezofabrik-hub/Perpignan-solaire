# Projet Énergie Solaire 66 — solaire-66.fr

## Identité de l'entreprise

- **Société** : SARL Rezofabrik (nom commercial : Perpignan Solaire / Énergie Solaire 66)
- **Site principal** : solaire-66.fr (ce repo, GitHub Pages, branche `main`)
- **Site sœur** : rezo-fabrik.fr (vente de cache climatisation sur mesure)
- **Email** : contact.energiesolaire66@gmail.com
- **Téléphone** : **07 75 76 92 32** — SEUL numéro autorisé sur tout site public

## Règles de sécurité ABSOLUES

- ❌ Ne JAMAIS faire apparaître le numéro **06 84 05 92 55** sur aucun site
- ❌ Ne JAMAIS nommer le pilote drone ni faire apparaître **Pierre MIEUX / FRA-RP-000000079589**
- ❌ Tout le travail solaire va dans ce repo (`rezofabrik-hub/Perpignan-solaire`) UNIQUEMENT — pas dans `social-miroir`
- ✅ Seul numéro public : **07 75 76 92 32**

## Architecture technique

- **125 pages HTML** statiques avec SEO local par ville du département 66
- **Hébergement** : GitHub Pages sur branche `main`
- **Logo** : `logo.svg` — soleil + montagnes + "66" + "solaire-66.fr"
- **Vidéo hero** : `hero-bg.mp4` (page d'accueil)
- **Sitemap** : `sitemap.xml` (100 URLs — 25 pages manquantes à ajouter)
- **Robots** : `robots.txt` configuré avec référence sitemap

## Statut légal et opérationnel

- En attente : **modification de statuts au greffe** (objet social élargi)
- En attendant : opère comme **apporteur d'affaires** — transmet les leads aux installateurs partenaires
- Installateurs partenaires : certifiés **RGE QualiPV**, assurés **décennale** jusqu'à 500 kW
- Site dit "nos installateurs RGE certifiés · Décennale" (jamais "Rezofabrik est certifié RGE")

## Ce qui est fait (commits déjà poussés)

- ✅ Remplacement "certifié RGE QualiPV" → "nos installateurs RGE certifiés · Décennale" sur 125 pages
- ✅ Ajout lien rezo-fabrik.fr sous l'email dans le footer de toutes les pages
- ✅ Suppression "0€ Accès au toit" sur inspection-drone-toiture.html
- ✅ Logo Gemini caché sur la vidéo hero (overlay CSS bas-gauche)
- ✅ Mode maintenance utilisé puis retiré (site entièrement en ligne)

## À faire (priorités)

1. **Google Business Profile** — créer sur business.google.com
   - Nom : Énergie Solaire 66
   - Catégorie : Entrepreneur en énergie solaire
   - Tél : 07 75 76 92 32
   - Zone : Pyrénées-Orientales, Aude, Hérault, Ariège
   - Masquer adresse personnelle, afficher zone de service

2. **Google Search Console** — soumettre sitemap.xml après GBP

3. **Titres SEO trop longs** — 122/125 titres > 60 caractères (Google tronque)

4. **Sitemap incomplet** — 100 URLs pour 125 pages, ajouter les 25 manquantes

5. **Schema LocalBusiness manquant** sur 12 pages de services

6. **Avis clients** — demander aux premiers contacts dès que GBP est live

## Contenu marketing prêt

- 10 posts Facebook prêts à publier
- 11 scripts de réponse aux commentaires
- Prompts image IA (Gemini/Bing/Firefly) pour visuels solaire + Canigou
- Stratégie Facebook Ads Plaine du Roussillon (ciblage, textes, formulaire)

## Structure footer (toutes les pages)

```html
<!-- Email -->
<div class="ftr-contact-item">
  <svg>...</svg>
  <a href="mailto:contact.energiesolaire66@gmail.com">contact.energiesolaire66@gmail.com</a>
</div>
<!-- Lien rezo-fabrik (en dessous, pas à côté) -->
<div class="ftr-contact-item">
  <a href="https://www.rezo-fabrik.fr" target="_blank" rel="noopener">🏠 Cache clim sur mesure : rezo-fabrik.fr</a>
</div>
```
