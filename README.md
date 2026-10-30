# Lawliet Fishery Calculator

Web dashboard that calculates the effect and the upgrade costs of the fishery tools of the Lawliet Bot:
Fishing Robot (Daily), Fishing Net (Voice), Fishing Rod (Message) and Work.

For a chosen tool and level it shows

- **Effect** at this level
- **Cost** for this level
- **Total cost** up to this level

Below that, charts show how effect, cost and total cost develop over the levels (hover or use the arrow keys to read exact values; a table view is available too).

Nothing has to be downloaded or installed. Open the page and type in a level.

## Usage

Once GitHub Pages is enabled (Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`),
the calculator is available at `https://freecrownies.github.io/lawliet-bot-upgrade-cost-calculator/`.

It also works locally by opening `index.html` in a browser. There is no build step.

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `style.css`, `app.js` | the dashboard |
| `charts.js` | small dependency-free SVG charts |
| `logic.js` | calculation logic (port of the former Java code) |
| `test/` | regression test with reference values of the Java implementation: `node test/logic.test.js` |

Coded by Crown#0016
