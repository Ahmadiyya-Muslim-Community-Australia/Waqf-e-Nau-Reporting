# Reporting Journey Matrix (FP MBT)

This matrix tracks executable journey coverage for the reporting portal.

Status legend:
- `green`: implemented and passing in CI target lane
- `in-progress`: partially implemented or pending lane wiring
- `planned`: not implemented yet

## Authentication + RBAC

| Journey | Route | Suite | Status | Notes |
|---|---|---|---|---|
| Auth flow bootstrap and session checks | `/` | `tests/e2e/auth-flow.spec.ts` | green | Core signed-in experience checks |
| National RBAC visibility + access constraints | multi-route | `tests/e2e/auth-rbac-national.spec.ts` | green | National role-level invariants |
| Jamaat-scoped RBAC constraints | multi-route | `tests/e2e/auth-rbac-jamaat-scoped.spec.ts` | green | Scoped data access boundaries |
| Viewer RBAC read-only boundaries | multi-route | `tests/e2e/auth-rbac-viewer.spec.ts` | green | Viewer cannot mutate protected flows |
| Sign-out journey and session teardown | global nav | `tests/e2e/sign-out.spec.ts` | green | Logout and post-logout route protection |

## Product Workflows

| Journey | Route | Suite | Status | Notes |
|---|---|---|---|---|
| Markaz search and reset transitions | `/markaz/*` | `tests/e2e/markaz-mbt.spec.ts` | green | Preview Chromium lane covers generated search/clear transitions and placeholder invariants |

## Implementation Order

1. Keep auth and RBAC suites green as role policy changes.
2. Add export/report-download invariants after data pipeline stabilizes.
