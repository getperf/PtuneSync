# Ptune Sync Cleanup Policy

## Purpose

If PtuneSync uses per-request run directories, cleanup is required.

The cleanup policy should preserve debuggability while avoiding endless growth
of old run directories.

## Recommended Principles

- cleanup SHOULD be delayed
- cleanup SHOULD be best-effort
- cleanup MUST NOT break active commands
- cleanup failures SHOULD be warnings only

## Recommended Deletion Scope

A run directory SHOULD be eligible for cleanup only when:
- `status.json.phase == completed`
- the run is older than a configured threshold

Recommended examples:
- remove runs older than `7` days
- or keep only the latest `N` runs

## Recommended Timing

Cleanup MAY run:
- at app startup
- before creating a new run directory
- on a periodic maintenance trigger

Immediate deletion right after completion is NOT recommended.

## Windows File Lock Considerations

Windows can prevent deletion when files are still open because of:
- active process handles
- virus scanners
- indexers
- log viewers

Therefore:
- cleanup SHOULD catch and ignore deletion failures
- failed deletions SHOULD be retried later
- cleanup SHOULD not assume that completed files are immediately removable

## Recommended Minimum Behavior

- try to delete completed run directories older than the threshold
- if deletion fails, log a warning and continue
- do not block user commands because of cleanup failure

## Optional Future Enhancements

- keep a small rolling history of recent successful runs
- keep error runs longer than success runs
- expose cleanup settings for development builds
