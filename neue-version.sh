#!/bin/sh
# Setzt eine neue Versionsnummer an alle Dateien in index.html und alpha/index.html,
# damit Browser nach einer Änderung sofort die neuen Dateien laden.
cd "$(dirname "$0")"
v=$(date +%Y%m%d%H%M)
for f in index.html alpha/index.html; do [ -f "$f" ] && sed -i.bak -E "s/\?v=[0-9]+/?v=$v/g" "$f" && rm -f "$f.bak"; done
echo "Version $v"
