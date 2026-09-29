# Bug report

## 1) Pagination offset was off by one

- Expected behavior: page 1 should return the first slice of tasks and page 2 should continue from the next items; the index should start at `(page - 1) * limit`.
- Actual behavior: the service used `page * limit`, which skipped the first `limit` items when page 1 was requested.
- How it was discovered: the service-level pagination tests showed page 1 returning the second batch instead of the first batch.
- Fix approach: compute the offset as `(page - 1) * limit` and guard against invalid or zero values before slicing.

## 2) Status filtering used substring matching instead of exact equality

- Expected behavior: `GET /tasks?status=todo` should return only tasks whose `status` equals `todo`.
- Actual behavior: the code used `t.status.includes(status)`, which can match partial values and returns tasks that should not be included.
- How it was discovered: a status filter test confirmed that exact matching was required and partial matches were being treated as valid.
- Fix approach: compare the value with strict equality (`t.status === status`) instead of substring matching.

## 3) Assignment endpoint was missing entirely

- Expected behavior: there should be a `PATCH /tasks/:id/assign` endpoint that accepts an assignee string and stores it on the task.
- Actual behavior: no route or service method existed for assignment.
- How it was discovered: the assignment brief and README explicitly call for this endpoint, and the route file had no handler for it.
- Fix approach: add validation for a non-empty string, write the route, and persist the assignee on the task object.

The repository now includes a fix for the pagination and status-filter issues, and the API has the requested assignment endpoint implemented and tested.
