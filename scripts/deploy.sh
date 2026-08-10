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

echo "── workshop (portfolio-v2)"
WORKSHOP_URL=$(vercel deploy --prod --yes 2>/dev/null | tail -1)
echo "workshop deployment: $WORKSHOP_URL"

echo "── portfolio (damilareoo)"
mv .vercel .vercel-workshop
mv .vercel-portfolio .vercel
restore() {
  mv .vercel .vercel-portfolio
  mv .vercel-workshop .vercel
}
trap restore EXIT
PORTFOLIO_URL=$(vercel deploy --prod --yes 2>/dev/null | tail -1)
echo "portfolio deployment: $PORTFOLIO_URL"

echo
echo "Record in data/changelog.ts: $WORKSHOP_URL"
