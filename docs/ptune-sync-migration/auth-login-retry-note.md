# auth-login retry note

## Current issue

- `auth-login` can remain in `phase=running` when the browser redirect flow becomes unstable.
- While that stale `running` status remains, a subsequent `auth-login` request can be rejected as busy.

## Short-term mitigation

- Add a timeout to `auth-login` and transition the run to `completed/error` when browser authentication does not finish in time.
- Allow retry when an `auth-login` status stays `accepted` or `running` longer than the stale threshold.
- If the resident process still becomes stuck, force-stop the running `PtuneSync` process before retrying.

## Deferred medium-term work

- Replace the current process-local redirect signal with a cross-activation / cross-process handoff mechanism.
- Review OAuth redirect handling and single-instance activation flow together in a dedicated iteration.
