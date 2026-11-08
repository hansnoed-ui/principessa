# Principesse

Eine Principessa entspringt einem Augenblick und trägt seinen Zauber durch vier Ebenen nach unten.

Ein One-Pager: Ein kleiner Film zeigt die Principessa und den Hund mit Krone beim Aufwachen im Turm und beim Spaziergang; am Ende springen beide in 3D aus dem Film und fliegen beim Scrollen über die Seite nach unten – durch Schweben, Glitzer, Verweilen und Ankommen.

## Aufbau

- `index.html`, `style.css` – die Seite: Titelbild, Ebenen, Wiese und Bestellkarte
- `js/auftakt.js` – der Film im Auftakt: Turmzimmer, Aufwachen, Spaziergang, live gezeichnet
- `assets/kopfbild.jpg` – das Gemälde mit der Stadt (zurzeit nicht auf der Seite)
- `assets/principessa2-figur.png` – die zweite Principessa, aus ihrem Gemälde gelöst
- `assets/principessa3-*.png` – die dritte als Meerjungfrau, in vier Teilen zum Zusammensetzen
- `js/figur.js` – die drei Principesse und der Hund mit Krone als Zeichnung und als 3D-Figuren
- `js/main.js` – Herausspringen, Flug beim Scrollen, Treffen, Glitzer, Sterne, Landung und Wiese
- `js/hintergrund.js` – Wolken, Mond und Sternschnuppe, Unterwasserlicht, Seegras, Fische, Blasen, Kleeblätter
- `js/zauber.js` – verzauberter Text: Wörter erscheinen als Glitzer, danach laufen Glitzerwellen hindurch
- `js/bestellen.js` – die Bestellkarte: Auswahl, Live-Vorschau und Bestellung per Mail
- `vendor/` – Three.js r170 (MIT), lokal mitgeliefert, damit die Seite ohne CDN läuft

Lokal ansehen: im Ordner `python3 -m http.server` starten und `http://localhost:8000` öffnen. Direkt als Datei geöffnet, laden die Module nicht.

Veröffentlichen: in den Repo-Einstellungen unter *Pages* den Branch `main` mit Ordner `/` wählen.

Nach jeder Änderung `./neue-version.sh` ausführen: Das hängt eine neue Versionsnummer an alle Dateien in `index.html`, damit Browser die neuen Dateien sofort laden statt bis zu zehn Minuten die alten aus dem Zwischenspeicher zu zeigen.
