# Network Diagram Builder

Ein interaktiver, vollständig clientseitiger Editor zum Erstellen von Netzwerk‑Topology‑Diagrammen mit React und lucide‑react Icons

## Vorschau

![image](https://github.com/user-attachments/assets/58885ddc-23ad-4e68-ae12-19cdbb929bc2)

## Features

* Drag‑and‑Drop Node‑Palette
* Shift‑Klick Verbindungsmodus
* Segmentrahmen für Subnetze
* Bulk‑Import Funktion
* Live‑Eigenschaften‑Panel
* Glow‑Effekte durch SVG‑Filter
* Keine Backend‑Abhängigkeit

## Schnellstart

### Voraussetzungen

* Node.js ≥ 18
* npm, pnpm oder yarn

```bash
# Repository klonen
git clone https://github.com/tillmk/netbird-diagram.git
cd netbird-diagram

# Abhängigkeiten installieren
npm install # oder pnpm install / yarn install

# Entwicklungsserver starten
npm run dev # oder npm start / pnpm dev / yarn dev
```

## Verwendung im Projekt

```jsx
import NetworkDiagramBuilder from "./network-diagram"

function App() {
  return <NetworkDiagramBuilder />
}
```

### Bulk‑Import Syntax

```
KnotenA -> KnotenB
KnotenB -> KnotenC
```

Jede Zeile definiert genau eine gerichtete Verbindung

## Tastenkürzel & Tipps

* Drag & Drop Komponenten aus der linken Palette in die Zeichenfläche
* Shift + Klick auf zwei Nodes erzeugt eine Verbindung
* Selektierten Node klicken und ziehen zum Verschieben
* Clear‑Button leert Diagramm und Segmente
* ESC bzw. Klick auf leere Fläche hebt aktuelle Auswahl auf

## Konfiguration

* nodeTypes Array im Quellcode anpassen, um neue Gerätesymbole hinzuzufügen
* Farben, Glow‑Intensität und Größen via CSS‑Variablen oder Styled‑JSX verändern

## Abhängigkeiten

* react & react‑dom
* lucide‑react

## Projektstruktur (Beispiel)

```text
.
├── network-diagram.jsx  # Hauptkomponente
├── package.json
└── README.md
```

## Lizenz

Dieses Projekt steht unter der MIT‑Lizenz – Einzelheiten siehe LICENSE

## Beiträge

Pull‑Requests, Issues und Verbesserungsvorschläge sind willkommen
