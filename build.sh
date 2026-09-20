#!/usr/bin/env bash
# Construit dist/ : le site public, et rien d'autre.
#
# Cloudflare Pages publie le contenu du dossier de sortie. Comme le depot
# contient aussi des fichiers de travail (documentation, scripts, outils),
# on ne deploie pas la racine telle quelle.
#
# Le principe est volontairement inverse d'une liste blanche : on recopie
# tout, puis on retire ce qui n'a rien a faire en ligne. Une liste blanche
# finit toujours par oublier un fichier public ; ici, un nouveau fichier
# public part tout seul, et un nouveau fichier interne est arrete par le
# garde-fou en fin de script.
#
# Reglages Cloudflare Pages correspondants :
#   Build command      : bash build.sh
#   Build output       : dist
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist

tar --exclude=./.git --exclude=./dist -cf - . | tar -xf - -C dist

# Outils, sources et automatisations : pas du site.
rm -rf dist/.github dist/cloudflare-worker

# Artefacts propres a GitHub Pages, inutiles chez Cloudflare.
rm -f dist/CNAME dist/.nojekyll dist/.gitignore

# Documentation, scripts, pages enregistrees : jamais en ligne.
find dist \( -name '*.md' -o -name '*.sh' -o -name '*.py' -o -name '*.mhtml' \) -delete
find dist -type d \( -name '_*' -o -name '__pycache__' \) -prune -exec rm -rf {} +

# Garde-fou : mieux vaut ne rien publier que publier une fuite.
fuites=$(find dist \( -name '*.md' -o -name '*.sh' -o -name '*.py' -o -name '*.mhtml' \
  -o -name '.env*' -o -name '*.key' -o -name '*.pem' \) -print)
if [ -n "$fuites" ]; then
  echo "ERREUR : fichier interne dans dist/, publication annulee :" >&2
  echo "$fuites" >&2
  exit 1
fi

echo "dist/ construit : $(find dist -type f | wc -l | tr -d ' ') fichiers."
