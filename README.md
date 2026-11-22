# Sprachpfad

Sprachlern-Web-App (PWA) für **Spanisch, Italienisch, Kroatisch, Bosnisch und Türkisch**, Ausgangssprache Deutsch.

## Funktionen

- **Lernpfad** mit 6 Einheiten (≈ 50 Ausdrücke pro Sprache), die nacheinander freigeschaltet werden
- **7 Übungstypen**: Einführung, Bedeutung wählen, Übersetzung wählen, Hörverständnis, Satz bauen, Schreiben (mit Sonderzeichen-Leiste), Nachsprechen
- **Aussprache-Training**: Spracherkennung im Browser mit Prozent-Bewertung und Wort-für-Wort-Markierung
- **Spaced Repetition** (SM-2-Variante): Fehler kommen nach 10 Minuten wieder, Gekonntes nach 1 → 3 → 8 … Tagen
- **KI-Gesprächspartner** (Claude): 7 Rollenspiel-Szenarien, per Sprache oder Text, mit Korrektur und Übersetzung auf Deutsch
- Statistik (XP, Serie, Trefferquote, Wiederholungs-Prognose), Export/Import des Fortschritts, offline nutzbar (außer KI-Chat)

## Starten

Keine Build-Tools nötig. Lokal: `python3 -m http.server` im Ordner ausführen und `http://localhost:8000` öffnen.

Online: in GitHub unter *Settings → Pages* den Branch `main` / Ordner `/` auswählen. Danach auf dem iPhone in Safari öffnen → Teilen → „Zum Home-Bildschirm“.

## KI-Gesprächspartner

Braucht einen eigenen Anthropic-API-Schlüssel (console.anthropic.com), einzutragen unter *Optionen*. Der Schlüssel liegt nur im `localStorage` des Browsers und wird direkt an die Anthropic-API geschickt. Wer eine Seite mit eingetragenem Schlüssel benutzt, kann ihn auslesen. Die App deshalb nur auf eigenen Geräten mit Schlüssel verwenden.

## Bekannte Grenzen

- Sprachausgabe und Spracherkennung kommen vom Betriebssystem bzw. Browser. Für Bosnisch gibt es meist keine eigene Stimme, dann wird eine kroatische benutzt (sehr ähnlich).
- Firefox hat keine Spracherkennung. Chrome (Android/Desktop) oder Safari (iOS) verwenden.
- Die Kursinhalte sollten von Muttersprachlern geprüft werden.

## Dateien

| Datei | Inhalt |
|---|---|
| `content.js` | Kursinhalte, Sprachen, Szenarien – hier neue Einheiten ergänzen |
| `app.js` | App-Logik (SRS, Übungen, Sprache, KI-Chat) |
| `style.css` | Design (hell/dunkel automatisch) |
| `anthropic-sdk.js` | gebündeltes offizielles Anthropic-JS-SDK (v1.12.0) |
| `sw.js`, `manifest.json` | Offline-Fähigkeit / Installierbarkeit |
