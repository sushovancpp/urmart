#!/usr/bin/env python3
"""
UR MART — Full Stack Startup Script
Starts the Flask backend which also serves the React frontend.
"""

import subprocess, sys, os, webbrowser, time

def main():
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    app_py      = os.path.join(backend_dir, "app.py")

    print("\n" + "═"*56)
    print("  ██╗   ██╗██████╗     ███╗   ███╗ █████╗ ██████╗ ████████╗")
    print("  ██║   ██║██╔══██╗    ████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝")
    print("  ██║   ██║██████╔╝    ██╔████╔██║███████║██████╔╝   ██║   ")
    print("  ██║   ██║██╔══██╗    ██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ")
    print("  ╚██████╔╝██║  ██║    ██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ")
    print("   ╚═════╝ ╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ")
    print("═"*56)
    print("  Tech Stack: Flask + SQLite + JWT + React 18")
    print("  URL:        http://localhost:5000")
    print("  Admin:      admin@urmart.com / admin123")
    print("  Coupons:    WELCOME10 · SAVE50 · FRESH20")
    print("═"*56 + "\n")

    print("[*] Initializing SQLite database...")
    print("[*] Starting Flask server on port 5000...\n")

    try:
        proc = subprocess.Popen(
            [sys.executable, app_py],
            cwd=backend_dir,
        )
        time.sleep(1.5)
        webbrowser.open("http://localhost:5000")
        proc.wait()
    except KeyboardInterrupt:
        print("\n[*] Shutting down UR MART...")
        proc.terminate()

if __name__ == "__main__":
    main()
