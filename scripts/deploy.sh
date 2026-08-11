#!/usr/bin/env bash
# Deploys both faces of the site:
#   workshop  -> portfolio-v2 project (System + Changelog link)
#   portfolio -> damilareoo project (public face, NEXT_PUBLIC_SITE_MODE=portfolio)
#
# .vercel           = workshop link (default)
# .vercel-portfolio = portfolio link
#
# Prints the immutable workshop deployment URL — record it in data/changelog.ts.
set -euo pipefail
cd "$(dirname "$0")/.."

grab_url() {
  grep -oE "https://[a-z0-9-]+\.vercel\.app" | grep -v "\-git\-" | tail -1
}

echo "── workshop (portfolio-v2)"
WORKSHOP_URL=$(vercel deploy --prod --yes 2>&1 | grab_url)
echo "workshop deployment: $WORKSHOP_URL"

echo "── portfolio (damilareoo)"
mv .vercel .vercel-workshop
mv .vercel-portfolio .vercel
restore() {
  mv .vercel .vercel-portfolio
  mv .vercel-workshop .vercel
}
trap restore EXIT
PORTFOLIO_URL=$(vercel deploy --prod --yes 2>&1 | grab_url)
echo "portfolio deployment: $PORTFOLIO_URL"

# The clean alias does not follow --prod on its own; point it at this build.
until vercel alias set "$PORTFOLIO_URL" damilareoo-xyz.vercel.app 2>&1 | grep -q Success; do
  sleep 5
done
echo "portfolio alias:      https://damilareoo-xyz.vercel.app"

echo
echo "Record in data/changelog.ts: $WORKSHOP_URL"
