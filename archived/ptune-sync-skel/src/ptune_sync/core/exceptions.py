# src/ptune_sync/core/exceptions.py

class CliError(Exception):
    def __init__(self, error_type: str, message: str):
        self.error_type = error_type
        self.message = message
        super().__init__(message)

class DiffError(CliError):
    def __init__(self, message: str, data: dict | None = None):
        super().__init__("DIFF_ERROR", message)
        self.data = data or {}

class AuthError(Exception):
    pass


class AuthExpiredError(Exception):
    pass


class RemoteApiError(Exception):
    pass


class ValidationError(Exception):
    pass
