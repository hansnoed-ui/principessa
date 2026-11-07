# Principesse

Eine Principessa entspringt einem Augenblick und trägt seinen Zauber durch vier Ebenen nach unten.

Ein One-Pager: Die Principessa löst sich aus ihrem gezeichneten Bild, springt in 3D heraus und fliegt beim Scrollen über die Seite nach unten – durch Schweben, Glitzer, Verweilen und Ankommen.

## Aufbau

- `index.html`, `style.css` – die Seite: Titelbild, Ebenen, Wiese und Bestellkarte
- `assets/kopfbild.jpg` – das Titelbild, aus dem die erste Principessa springt
- `assets/principessa2-figur.png` – die zweite Principessa, aus ihrem Gemälde gelöst
- `assets/principessa3-*.png` – die dritte als Meerjungfrau, in vier Teilen zum Zusammensetzen
- `js/figur.js` – die drei Principesse als Zeichnung und als 3D-Figuren
- `js/main.js` – Herausspringen, Flug beim Scrollen, Treffen, Glitzer, Sterne, Landung und Wiese
- `js/rahmen.js` – die Glanzstellen im Gemälde
- `js/hintergrund.js` – Wolken, Mond und Sternschnuppe, Unterwasserlicht, Seegras, Fische, Blasen, Kleeblätter
- `js/zauber.js` – verzauberter Text: Wörter erscheinen als Glitzer, danach laufen Glitzerwellen hindurch
- `js/bestellen.js` – die Bestellkarte: Auswahl, Live-Vorschau und Bestellung per Mail
- `vendor/` – Three.js r170 (MIT), lokal mitgeliefert, damit die Seite ohne CDN läuft

Lokal ansehen: im Ordner `python3 -m http.server` starten und `http://localhost:8000` öffnen. Direkt als Datei geöffnet, laden die Module nicht.

Veröffentlichen: in den Repo-Einstellungen unter *Pages* den Branch `main` mit Ordner `/` wählen.

Nach jeder Änderung `./neue-version.sh` ausführen: Das hängt eine neue Versionsnummer an alle Dateien in `index.html`, damit Browser die neuen Dateien sofort laden statt bis zu zehn Minuten die alten aus dem Zwischenspeicher zu zeigen.
