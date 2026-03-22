from ptune_sync.auth.oauth_flow import authenticate
from ptune_sync.auth.token_store import TokenStore
from ptune_sync.core.exceptions import AuthError


class AuthUseCase:

    @staticmethod
    def status() -> dict:
        try:
            return TokenStore.status()
        except Exception as e:
            raise AuthError(str(e)) from e

    @staticmethod
    def login() -> dict:
        try:
            token_data = authenticate()
            TokenStore.save(token_data)
            return TokenStore.status()
        except Exception as e:
            raise AuthError(str(e)) from e
