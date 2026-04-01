# src/ptune_sync/auth/local_server.py
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from typing import Optional
import logging
import time

logger = logging.getLogger("ptune_sync.auth.local_server")


class CallbackHandler(BaseHTTPRequestHandler):
    """
    OAuth callback handler.
    標準出力へHTTPログを出さない。
    """
    code: Optional[str] = None

    def log_message(self, format: str, *args) -> None:
        # デフォルトの標準出力ログを抑制
        logger.debug("HTTP: " + format % args)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)

        CallbackHandler.code = qs.get("code", [None])[0]

        if CallbackHandler.code:
            logger.info("OAuth callback received")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(
                b"Authentication complete. You may close this window."
            )
        else:
            logger.warning("OAuth callback received without code")
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Missing authorization code.")


def wait_for_code(port: int = 8765, timeout: int = 180) -> str:
    """
    ローカルHTTPサーバでOAuthコードを待機する。
    timeout秒で例外を送出。
    """
    logger.info("Starting local OAuth server on port %s", port)

    CallbackHandler.code = None
    server = HTTPServer(("localhost", port), CallbackHandler)
    server.timeout = 1  # handle_request のブロック回避

    start = time.time()

    try:
        while CallbackHandler.code is None:
            server.handle_request()

            if time.time() - start > timeout:
                logger.error("OAuth authorization timeout")
                raise TimeoutError("OAuth authorization timed out")
    finally:
        server.server_close()
        logger.info("OAuth local server closed")

    return CallbackHandler.code
