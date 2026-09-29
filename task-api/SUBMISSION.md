# Submission notes

## What I would test next

With more time, I would add tests for malformed JSON requests, unsupported query parameters and invalid pagination values, strict ISO 8601 date validation, repeated completion behavior, reassignment behavior, and concurrent updates. I would also add tests around persistence once the in-memory store is replaced with a database.

## What surprised me

The API had no tests despite already exposing several stateful behaviors. Two subtle service bugs were present: pagination skipped the first page because its offset was calculated as `page * limit`, and status filtering used substring matching rather than exact equality. The completion operation also resets priority to `medium`, which may be intentional but should be confirmed with the product requirements.

## Questions before production

- Is an in-memory store acceptable, or must tasks survive restarts?
- Should `PUT` be a true full replacement or the current partial update behavior?
- Should assigning an already assigned task be allowed, rejected, or audited?
- Should assignees be validated against users in an identity system?
- Should task completion preserve the existing priority?
- What are the authentication, authorization, rate-limiting, and audit requirements?

## Implementation decisions

`PATCH /tasks/:id/assign` accepts a non-empty string, trims surrounding whitespace, persists it as `assignee`, and returns the updated task. Empty, whitespace-only, missing, or non-string values return `400`. A valid assignment for an unknown task returns `404`. Reassignment is allowed and replaces the existing assignee because the brief says the endpoint stores a name and does not require an assignment-conflict error.

## Verification

From the `task-api` directory:

```bash
npm test
npm run coverage
```

The test suite contains unit tests for the service and Supertest integration tests for every documented endpoint, including validation and not-found edge cases.
