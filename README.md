# Principessa

Eine Principessa entspringt einem Augenblick und trägt seinen Zauber durch vier Ebenen nach unten.

Ein One-Pager: Die Principessa löst sich aus ihrem gezeichneten Bild, springt in 3D heraus und fliegt beim Scrollen über die Seite nach unten – durch Schweben, Glitzer, Verweilen und Ankommen.

## Aufbau

- `index.html`, `style.css` – die Seite und ihre vier Ebenen
- `js/figur.js` – die Principessa, flach gezeichnet und als 3D-Figur, beide aus denselben Massen
- `js/main.js` – Auftakt (Klopfen, Abrollen, Plopp), Flug beim Scrollen, Glitzer, Sterne, Landung und Wiese
- `vendor/` – Three.js r170 (MIT), lokal mitgeliefert, damit die Seite ohne CDN läuft

Lokal ansehen: im Ordner `python3 -m http.server` starten und `http://localhost:8000` öffnen. Direkt als Datei geöffnet, laden die Module nicht.

Veröffentlichen: in den Repo-Einstellungen unter *Pages* den Branch `main` mit Ordner `/` wählen.
