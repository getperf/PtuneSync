# auth-login retry note

## Current issue

- `auth-login` can remain in `phase=running` when the browser redirect flow becomes unstable.
- While that stale `running` status remains, a subsequent `auth-login` request can be rejected as busy.

## Short-term mitigation

- Add a timeout to `auth-login` and transition the run to `completed/error` when browser authentication does not finish in time.
- Allow retry when an `auth-login` status stays `accepted` or `running` longer than the stale threshold.
- If the resident process still becomes stuck, force-stop the running `PtuneSync` process before retrying.
- Persist OAuth redirect handoff in auth session files instead of process-local memory.
- Move single-instance and redirected activation wiring into a custom `Program.Main`.

## Current status

- `launch + ping` diagnostics reproduced the COM failure without OAuth, which confirmed the issue was in WinUI / AppLifecycle activation handling rather than in the Google flow itself.
- After moving activation wiring to `Program.Main`, repeated `ping` and `auth-login` tests no longer reproduced the COM failure in current validation.

## Deferred medium-term work

- Review whether diagnostics-only `launch` / `ping` handlers should remain in production builds or move behind a test-only switch.
- Re-evaluate Windows App SDK version updates and additional activation telemetry in a dedicated iteration.
