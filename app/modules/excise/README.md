# Excise Directive 1004/2024 - Implementation Notes

This module starts implementation of Directive No. 1004/2024 with a staged approach.

## Phase 1 (Implemented)

- Factory/Warehouse registration
  - API: `GET/POST/PATCH /v1/excise/facilities`
  - Includes unique facility code, location metadata, and active status.
- Delivery note management
  - API: `GET/POST /v1/excise/delivery-notes`
  - API: `PATCH /v1/excise/delivery-notes/:id/status`
  - Supports shipment route, transport details, item list, and status lifecycle.
- Excise stamp request management
  - API: `GET/POST /v1/excise/stamp-requests`
  - Enforces minimum 60-day lead time on `requiredByDate` per Article 7 and 8.

## Status Workflows

- Delivery note: `DRAFT -> SUBMITTED -> APPROVED -> DISPATCHED -> RECEIVED`
- Stamp request: `DRAFT -> SUBMITTED -> APPROVED -> FULFILLED`
- Cancellation and rejection paths are supported with transition controls.

## Phase 2 (Implemented)

- Stamp fee payment tracking and payment proof metadata
  - API: `PATCH /v1/excise/stamp-requests/:id/payment`
- Stamp request submission workflow
  - API: `POST /v1/excise/stamp-requests/:id/submit`
  - Requires payment to be recorded before submission.
- Tax authority review workflow with 5 working-day SLA target
  - API: `PATCH /v1/excise/admin/stamp-requests/:id/review`
  - Review due date is auto-computed at submission time.
  - SLA breach is tracked with `reviewSlaBreached`.
- Stamp issuance fulfillment action
  - API: `POST /v1/excise/stamp-requests/:id/fulfill`

## Phase 3 (Implemented)

- UI/stamp consumption forecast for rolling 6 months
  - API: `GET/POST/PATCH /v1/excise/forecasts`
  - API: `GET /v1/excise/forecasts/:id`
  - API: `POST /v1/excise/forecasts/:id/submit`
  - Requires exactly 6 consecutive `YYYY-MM` monthly entries.
  - Submission enforces 60-day lead time before first forecast month.
- Admin visibility for forecast records
  - API: `GET /v1/excise/admin/forecasts`
  - API: `GET /v1/excise/admin/forecasts/:id`

## Phase 4 (Implemented)

- Stamp return / wastage / transfer workflow
  - API: `GET/POST /v1/excise/stamp-stock-events`
  - API: `GET /v1/excise/stamp-stock-events/:id`
  - API: `POST /v1/excise/stamp-stock-events/:id/submit`
  - API: `POST /v1/excise/stamp-stock-events/:id/complete`
  - API: `PATCH /v1/excise/admin/stamp-stock-events/:id/review`
- Workflow control and validations
  - Draft, submission, review (approve/reject), completion lifecycle.
  - Transfer requires source and target facilities.
  - Wastage supports 1% threshold check when linked to a stamp request.
  - Reason codes are validated per event type.

## Phase 5 (Implemented)

- Public and operator stamp verification logging
  - API: `POST /v1/excise/public/stamp-verifications`
  - API: `GET/POST /v1/excise/stamp-verifications`
  - API: `GET /v1/excise/stamp-verifications/:id`
- Verification evidence support
  - Captures supplier document type/number, supplier details, and evidence payload.
  - Operator flow requires supplier document references for compliance proof.
- Admin verification monitoring
  - API: `GET /v1/excise/admin/stamp-verifications`
  - API: `GET /v1/excise/admin/stamp-verifications/:id`
  - API: `GET /v1/excise/admin/stamp-verifications/summary`
  - Summary includes counts by verification outcome.

## Remaining Phases

- None in current directive implementation scope.
