# Submission notes

## Test Results

All tests passing:
- **Test Suites:** 2 passed, 2 total
- **Tests:** 30 passed, 30 total
- **Coverage:** 92.99% (exceeds the 80% target)
  - `src/services/taskService.js`: 100%
  - `src/routes/tasks.js`: 98.07%
  - `src/utils/validators.js`: 77.77%
  - `src/app.js`: 69.23% (error handler not exercised; acceptable)

Run tests locally:
```bash
cd task-api
npm install
npm test
npm run coverage
```

## Live Deployment

The API is deployed and live at:
```
https://take-home-assignment-the-untested-api-911g.onrender.com
```

Test endpoints:
- **GET /tasks** — List all tasks
  ```
  https://take-home-assignment-the-untested-api-911g.onrender.com/tasks
  ```
- **POST /tasks** — Create a task
  ```bash
  curl -X POST https://take-home-assignment-the-untested-api-911g.onrender.com/tasks \
    -H "Content-Type: application/json" \
    -d '{"title": "Test task", "priority": "high"}'
  ```
- **PATCH /tasks/:id/assign** — Assign a task to a user
  ```bash
  curl -X PATCH https://take-home-assignment-the-untested-api-911g.onrender.com/tasks/[TASK_ID]/assign \
    -H "Content-Type: application/json" \
    -d '{"assignee": "Your Name"}'
  ```
- **GET /tasks/stats** — Get task statistics

## Git Repository

Full source code available at:
```
https://github.com/lawrencecracker/Take-Home-Assignment-The-Untested-API
```

## What I would test next

With more time, I would add tests for malformed JSON requests, unsupported query parameters and invalid pagination values, strict ISO 8601 date validation, repeated completion behavior, reassignment edge cases, concurrent modifications, and extreme pagination offsets.

## What surprised me

The API had no tests despite already exposing several stateful behaviors. Two subtle service bugs were present: pagination skipped the first page because its offset was calculated as `page * limit` instead of `(page - 1) * limit`, and status filtering used substring matching (`includes`) instead of exact equality, which could match unintended tasks.

## Questions before production

- Is an in-memory store acceptable, or must tasks survive restarts?
- Should `PUT` be a true full replacement or the current partial update behavior?
- Should assigning an already assigned task be allowed, rejected, or audited?
- Should assignees be validated against users in an identity system?
- Should task completion preserve the existing priority?
- What are the authentication, authorization, rate-limiting, and audit requirements?

## Implementation decisions

`PATCH /tasks/:id/assign` accepts a non-empty string, trims surrounding whitespace, persists it as `assignee`, and returns the updated task. Empty, whitespace-only, missing, or non-string values result in a 400 error. This approach mirrors validation patterns used elsewhere in the service and ensures a consistent assignee format.

## Deliverables Summary

✅ **30 passing tests** across unit and integration test suites
✅ **92.99% code coverage** (exceeds 80% target)
✅ **Bug report** documenting pagination, status filtering, and missing endpoint issues
✅ **Bug fixes** for pagination offset and status filter substring matching
✅ **PATCH /tasks/:id/assign endpoint** with full validation
✅ **Live deployment** on Render — fully functional API
✅ **Production considerations** documented with thoughtful questions

## Verification

From the `task-api` directory:

```bash
npm test
npm run coverage
```

The test suite contains unit tests for the service and Supertest integration tests for every documented endpoint, including validation and not-found edge cases. Additional edge-case tests verify whitespace trimming, invalid payload rejection, and safe pagination fallback behavior.

The live API is accessible and can be tested immediately at the deployed URL above.
