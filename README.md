# Crimson Shrine ~ Danmaku Vespers

An open-source Touhou-style bullet hell (danmaku) fangame that runs entirely in your web browser — no installs required.

Dodge waves of bullets, capture spellcards, and survive three stages guarding the mountain shrine as Reimu or Marisa.

## Play Online

If you've deployed this to a server, just visit the URL in any modern browser. No plugins or downloads needed.

## Controls

| Key | Action |
|---|---|
| Arrow Keys / WASD | Move |
| Shift | Focus (slow, precise movement — reveals hitbox) |
| Z | Fire |
| X | Spell Bomb (clears bullets, brief invincibility) |
| P / Esc | Pause |

## Running Locally (Quick Test)

Since this is a static site (HTML/CSS/JS), you don't need a server to try it out — just open `index.html` directly in a browser:

```bash
git clone https://github.com/crimson-shrine/crimson-shrine.git
cd crimson-shrine
```

Then open `index.html` in your browser (double-click it, or `open index.html` on macOS / `xdg-open index.html` on Linux).

> **Note:** some browsers restrict local file access (e.g. for `fetch`/module loading). If anything doesn't load correctly, use a simple local server instead:
> ```bash
> python3 -m http.server 8000
> ```
> Then visit `http://localhost:8000` in your browser.

## Deploying to a Server (Ubuntu/Debian + nginx)

This repo includes a `deploy.sh` script that installs nginx and serves the game automatically.

1. Clone this repo onto your server:
   ```bash
   git clone https://github.com/crimson-shrine/crimson-shrine.git
   cd crimson-shrine
   ```

2. Run the deploy script with sudo:
   ```bash
   sudo bash deploy.sh [your-domain-or-IP]
   ```
   Replace `[your-domain-or-IP]` with your domain name (e.g. `shrine.example.com`) or leave it blank to serve on any hostname/IP.

3. The script will:
   - Install nginx (if not already installed)
   - Copy `index.html`, `style.css`, `js/`, `images/`, and `fonts/` into `/var/www/touhou-game`
   - Set up and enable the nginx site config
   - Open port 80 in the firewall (if `ufw` is active)

4. Once finished, visit `http://your-server-ip/` (or your domain) in a browser.

### Updating After Changes

Re-run the same command any time you pull new changes:

```bash
git pull
sudo bash deploy.sh
```

## License

This is a fan-made, non-commercial project inspired by the Touhou Project. All original code/assets in this repo are open source — feel free to fork, modify, and learn from it.
