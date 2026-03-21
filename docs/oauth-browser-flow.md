# PtuneSync Browser OAuth Flow

## 1. Purpose

PtuneSync uses the Windows default browser to perform Google OAuth and handles
the configured redirect URI inside the application.

## 2. Adopted Approach

- Use the Windows PC default browser for sign-in.
- Use a redirect URI registered for PtuneSync.
- Handle the redirect result through PtuneSync protocol activation.
- Extend the existing PtuneSync authentication features.

## 3. Rejected Approach

The bundled-secret PKCE design used in `ptune-sync-skel` is NOT migrated.

## 4. Flow

1. User or integration invokes `auth login`.
2. PtuneSync opens the Google authorization URL in the default browser.
3. Google redirects to the configured PtuneSync redirect URI.
4. PtuneSync receives the callback through protocol activation.
5. PtuneSync validates `state` and exchanges the authorization code for tokens.
6. Tokens are stored locally.
7. Result is returned through CLI JSON or `status.json`.

## 5. Callback Contract

Callback handling is modeled as:

- URI route: `auth/callback`
- required parameters:
  - `code`
  - `state`
- optional parameters:
  - `error`
  - `error_description`

## 6. Token Storage

Token storage is an internal implementation detail, but the implementation
SHOULD support:

- persisted refresh token
- access token refresh
- auth status checks without reopening the browser

## 7. Error Handling

Authentication failures MUST map to `AUTH_ERROR`.

Typical cases:

- redirect state mismatch
- missing callback parameters
- token exchange failure
- revoked or expired credentials

## 8. Documentation Note

The Google OAuth redirect URI configured in Google Cloud MUST be documented in
the project setup documentation and kept aligned with the application protocol
handler behavior.
