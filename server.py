#!/usr/bin/env python3
"""
Baton Alpha Terminal Local Server
Serves static frontend files and proxies real-time pump.fun & DexScreener APIs with CORS.
Zero external dependencies (uses standard library only).
"""

import http.server
import json
import os
import ssl
import sys
import urllib.request
from urllib.parse import urlparse, parse_qs

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
BATON_CA = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump"

# SSL context that works cleanly on macOS python installations
SSL_CTX = ssl._create_unverified_context()

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

class BatonHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for all local requests
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_HEAD(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path in ("/api/callouts", "/api/trending", "/api/coins", "/api/token-stats", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.end_headers()
        else:
            super().do_HEAD()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/callouts":
            self.handle_callouts()
        elif path == "/api/trending" or path == "/api/coins":
            self.handle_trending()
        elif path == "/api/token-stats":
            self.handle_token_stats()
        elif path == "/api/health":
            self.send_json({"status": "ok", "service": "baton-alpha-terminal"})
        else:
            # Fallback to standard static file serving
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/api/chat", "/.netlify/functions/chat"):
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
                data = json.loads(body)
                msg = (data.get("message") or "").strip().lower()

                if "ca" in msg or "contract" in msg or "adres" in msg:
                    reply = f"Official Solana CA: {BATON_CA}. Liquidity 100% burned, 0% tax."
                elif "how are you" in msg or "nasılsın" in msg:
                    reply = "I am a crying flower trapped on Solana while humans lose their rent money. Terrible as usual."
                elif "buy" in msg or "al" in msg:
                    reply = "Use Terminal Swap above or trade on Jupiter DEX. Don't ask me for financial advice."
                else:
                    reply = "Why are you talking to me? Go chase a green candle on Pump.fun instead of bothering a weeping flower."

                self.send_json({"reply": reply})
            except Exception as e:
                self.send_json({"reply": "Human detected. Leave me alone."}, status=200)
        else:
            self.send_response(404)
            self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_callouts(self):
        try:
            req = urllib.request.Request(
                "https://www.outbid.bond/api/callouts",
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10, context=SSL_CTX) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                self.send_json(data)
        except Exception as e:
            # Try direct outbid endpoint fallback
            try:
                req2 = urllib.request.Request(
                    "https://outbid.bond/api/callouts",
                    headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
                )
                with urllib.request.urlopen(req2, timeout=8, context=SSL_CTX) as resp2:
                    data = json.loads(resp2.read().decode("utf-8"))
                    self.send_json(data)
            except Exception as e2:
                print(f"[ERROR] /api/callouts upstream failed: {e2}", file=sys.stderr)
                self.send_json({"success": False, "callouts": [], "error": str(e2)})

    def handle_trending(self):
        try:
            # 1. Fetch live curated tokens from outbid API
            coins_data = []
            try:
                req = urllib.request.Request(
                    "https://www.outbid.bond/api/coins",
                    headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=8, context=SSL_CTX) as resp:
                    d = json.loads(resp.read().decode("utf-8"))
                    coins_data = d.get("data", [])
            except Exception as err1:
                print(f"[WARN] coins endpoint error: {err1}", file=sys.stderr)

            # 2. Fetch top boosts on Solana from DexScreener
            boosted_mints = []
            try:
                req_b = urllib.request.Request(
                    "https://api.dexscreener.com/token-boosts/top/v1",
                    headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
                )
                with urllib.request.urlopen(req_b, timeout=8, context=SSL_CTX) as resp_b:
                    boosts = json.loads(resp_b.read().decode("utf-8"))
                    boosted_mints = [
                        b.get("tokenAddress") for b in boosts
                        if b.get("chainId") == "solana" and b.get("tokenAddress")
                    ][:12]
            except Exception as err2:
                print(f"[WARN] dexscreener boosts error: {err2}", file=sys.stderr)

            # 3. Enrich boosted mints via DexScreener batch endpoint
            dex_coins = []
            if boosted_mints:
                try:
                    mints_csv = ",".join(boosted_mints)
                    req_pairs = urllib.request.Request(
                        f"https://api.dexscreener.com/latest/dex/tokens/{mints_csv}",
                        headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
                    )
                    with urllib.request.urlopen(req_pairs, timeout=8, context=SSL_CTX) as resp_p:
                        pd = json.loads(resp_p.read().decode("utf-8"))
                        pairs = pd.get("pairs", [])
                        seen = set()
                        for p in pairs:
                            base = p.get("baseToken", {})
                            addr = base.get("address")
                            if addr and addr not in seen:
                                seen.add(addr)
                                dex_coins.append({
                                    "id": f"dex-{addr[:8]}",
                                    "name": base.get("name") or "Solana Token",
                                    "ticker": base.get("symbol") or "SOL",
                                    "mintAddress": addr,
                                    "imageUrl": (p.get("info") or {}).get("imageUrl") or "",
                                    "priceUsd": float(p.get("priceUsd") or 0),
                                    "marketCap": float(p.get("marketCap") or p.get("fdv") or 0),
                                    "volume24h": float((p.get("volume") or {}).get("h24") or 0),
                                    "change24h": float((p.get("priceChange") or {}).get("h24") or 0),
                                    "pairAddress": p.get("pairAddress") or "",
                                    "liquidityUsd": float((p.get("liquidity") or {}).get("usd") or 0),
                                    "dexScreenerUrl": p.get("url") or f"https://dexscreener.com/solana/{addr}",
                                })
                except Exception as err3:
                    print(f"[WARN] Dex enrichment error: {err3}", file=sys.stderr)

            # Combine and deduplicate
            all_coins = []
            seen_mints = set()

            for c in coins_data + dex_coins:
                mint = c.get("mintAddress")
                if mint and mint not in seen_mints:
                    seen_mints.add(mint)
                    all_coins.append(c)

            self.send_json({
                "success": True,
                "count": len(all_coins),
                "data": all_coins,
                "timestamp": int(os.path.getmtime(__file__) * 1000)
            })

        except Exception as e:
            print(f"[ERROR] /api/trending error: {e}", file=sys.stderr)
            self.send_json({"success": False, "count": 0, "data": [], "error": str(e)})

    def handle_token_stats(self):
        try:
            req = urllib.request.Request(
                f"https://api.dexscreener.com/latest/dex/tokens/{BATON_CA}",
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=8, context=SSL_CTX) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                pairs = data.get("pairs", [])
                pair = pairs[0] if pairs else {}
                self.send_json({
                    "success": True,
                    "symbol": "BATON",
                    "name": "Baton Corporation Ltd",
                    "mint": BATON_CA,
                    "priceUsd": float(pair.get("priceUsd") or 0),
                    "marketCap": float(pair.get("marketCap") or pair.get("fdv") or 0),
                    "volume24h": float((pair.get("volume") or {}).get("h24") or 0),
                    "priceChange24h": float((pair.get("priceChange") or {}).get("h24") or 0),
                    "priceChange1h": float((pair.get("priceChange") or {}).get("h1") or 0),
                    "priceChange5m": float((pair.get("priceChange") or {}).get("m5") or 0),
                    "liquidityUsd": float((pair.get("liquidity") or {}).get("usd") or 0),
                    "pairAddress": pair.get("pairAddress") or "",
                    "url": pair.get("url") or f"https://dexscreener.com/solana/{BATON_CA}"
                })
        except Exception as e:
            print(f"[ERROR] /api/token-stats error: {e}", file=sys.stderr)
            self.send_json({"success": False, "error": str(e)})

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = http.server.ThreadingHTTPServer(("", PORT), BatonHandler)
    print(f"🔥 BATON Alpha Terminal running at http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()
