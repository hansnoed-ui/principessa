#!/bin/sh
# Setzt eine neue Versionsnummer an alle Dateien in index.html,
# damit Browser nach einer Änderung sofort die neuen Dateien laden.
cd "$(dirname "$0")"
v=$(date +%Y%m%d%H%M)
sed -i.bak -E "s/\?v=[0-9]+/?v=$v/g" index.html && rm -f index.html.bak
echo "Version $v"
