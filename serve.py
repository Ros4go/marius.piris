#!/usr/bin/env python3
"""Mini serveur local pour le site (build de production dans dist/).

Usage :
    python serve.py            # build si besoin, puis sert dist/ sur :8000
    python serve.py --build    # force un rebuild avant de servir
    python serve.py --port 9000
    python serve.py --no-open  # ne pas ouvrir le navigateur

Note : ceci sert le BUILD (dist/). Pour le dev avec rechargement à chaud,
utilise plutôt `npm run dev`.
"""

import argparse
import http.server
import socketserver
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

# Console Windows (cp1252) : on force l'UTF-8 pour les messages.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


def run_build():
    npm = "npm.cmd" if sys.platform.startswith("win") else "npm"
    print("-> Build du site (npm run build)...")
    subprocess.run([npm, "run", "build"], cwd=ROOT, check=True, shell=False)


def main():
    parser = argparse.ArgumentParser(description="Sert le site buildé en local.")
    parser.add_argument("--port", type=int, default=8000, help="Port (défaut : 8000)")
    parser.add_argument("--build", action="store_true", help="Forcer un rebuild")
    parser.add_argument("--no-open", action="store_true", help="Ne pas ouvrir le navigateur")
    args = parser.parse_args()

    if args.build or not (DIST / "index.html").exists():
        run_build()

    handler = lambda *a, **k: http.server.SimpleHTTPRequestHandler(
        *a, directory=str(DIST), **k
    )

    url = f"http://localhost:{args.port}/"
    with socketserver.TCPServer(("", args.port), handler) as httpd:
        print(f"-> Serveur lance sur {url}")
        print("   (Ctrl+C pour arreter)")
        if not args.no_open:
            threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n-> Serveur arrete.")


if __name__ == "__main__":
    main()
