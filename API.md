# ClearPath API Reference

Base URL: `/api/v1`
Auth: Bearer token in `Authorization` header

## Authentication

### POST /auth/login
```json
{ "email": "student@example.com", "password": "password123" }
```

### POST /auth/register
```json
{ "email": "...", "password": "...", "firstName": "...", "lastName": "...", "role": "STUDENT" }
```

### POST /auth/refresh
```json
{ "refreshToken": "..." }
```

## Clearance Workflow

### GET /workflow/timeline/:id
Returns full approval chain with stages, status, and progress.

### PATCH /workflow/:id/approve
```json
{ "remarks": "Approved - all fees paid" }
```

### PATCH /workflow/:id/reject
```json
{ "remarks": "Library books not returned" }
```

### PATCH /workflow/:id/conditional
```json
{ "remarks": "Approved conditionally - submit documents by Friday" }
```

## QR Verification

### GET /workflow/verify-qr?data=...&signature=...
Verifies HMAC signature for anti-tampering. Returns `{"valid": true, "data": {...}}`

## Reports

### GET /reports/data?type=clearances&startDate=...&endDate=...
Returns filtered report data with summary statistics.

### GET /reports/export/csv?type=clearances
Downloads CSV file.

### GET /reports/export/excel?type=clearances
Downloads Excel-compatible file.

### GET /reports/export/pdf?type=clearances
Downloads PDF-compatible HTML file.

## Notifications

### GET /notifications
Returns paginated notifications for current user.

### PATCH /notifications/:id/read
Mark notification as read.

### PATCH /notifications/mark-all-read
Mark all notifications as read.

## AI Assistant

### POST /ai/chat
```json
{ "message": "How do I submit clearance?", "context": "student-clearance" }
```

### POST /ai/search
```json
{ "query": "clearance workflow stages", "type": "knowledge" }
```

### GET /ai/recommendations?userId=...
Returns personalized recommendations based on user role and status.

## Analytics

### GET /analytics/dashboard
Returns system-wide statistics (users, students, clearance counts, approval rate).

### GET /analytics/clearance-trend?days=30
Returns daily clearance submission/approval data.

### GET /analytics/departments
Returns per-department clearance statistics.

## Users & Students

### GET /users
List users (admin only)
### PATCH /users/:id
Update user
### GET /students/me
Get current student profile
### GET /students
List students (paginated, filterable)

## Swagger Documentation

Full interactive API documentation is available at:
`http://localhost:4000/api/docs`

## Error Format

```json
{
  "statusCode": 400,
  "message": "Clearance request already exists for this semester",
  "error": "Bad Request",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```
