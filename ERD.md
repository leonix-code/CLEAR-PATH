# ClearPath Entity Relationship Diagram

## Database Overview

ClearPath uses PostgreSQL with Prisma ORM. The database is fully normalized with 30+ tables organized into the following domains:

- **Identity & Access** – Users, Roles, Permissions, Sessions
- **Academic Structure** – Departments, Courses, Semesters, Academic Years
- **Student Management** – Students, Student Records, Enrollment
- **Clearance Workflow** – Clearance Requests, Approvals, Certificates
- **Notifications** – Notifications, Notification Templates
- **Audit & Security** – Audit Logs, Auth Tokens
- **System Config** – Settings, System Configuration

## ER Diagram (Mermaid)

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role "SUPER_ADMIN | ADMINISTRATOR | REGISTRAR | FINANCE_OFFICER | DEPARTMENT_OFFICER | LIBRARY_OFFICER | LABORATORY_OFFICER | SPORTS_OFFICER | HOSTEL_OFFICER | LECTURER | STUDENT | PARENT | ICT_SUPPORT"
        string phone
        string avatar
        boolean isActive
        datetime lastLogin
        datetime createdAt
        datetime updatedAt
    }

    Student {
        string id PK
        string userId FK UK
        string studentId UK
        string departmentId FK
        string courseId FK
        string currentSemesterId FK
        enum status "ACTIVE | GRADUATED | SUSPENDED | WITHDRAWN"
        date enrollmentDate
        date expectedGraduation
        datetime createdAt
        datetime updatedAt
    }

    Department {
        string id PK
        string name UK
        string code UK
        string description
        string headId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Course {
        string id PK
        string name
        string code UK
        string departmentId FK
        int durationYears
        string description
        boolean isActive
        datetime createdAt
    }

    Semester {
        string id PK
        string academicYearId FK
        string name UK
        enum type "FIRST_SEMESTER | SECOND_SEMESTER | THIRD_SEMESTER"
        date startDate
        date endDate
        date clearanceDeadline
        boolean isActive
    }

    AcademicYear {
        string id PK
        string name UK
        date startDate
        date endDate
        boolean isActive
    }

    ClearanceRequest {
        string id PK
        string studentId FK
        string semesterId FK
        enum status "PENDING | IN_PROGRESS | APPROVED | REJECTED"
        datetime submittedAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
        %% Composite UK: studentId + semesterId
    }

    ClearanceApproval {
        string id PK
        string clearanceRequestId FK
        string officerId FK
        enum status "PENDING | APPROVED | REJECTED | CONDITIONAL"
        string remarks
        datetime approvedAt
        datetime createdAt
        datetime updatedAt
        %% Composite UK: clearanceRequestId + officerId
    }

    Certificate {
        string id PK
        string clearanceRequestId FK UK
        string studentId FK
        string certificateNumber UK
        enum type "CLEARANCE | EXAM_ELIGIBILITY | GOOD_STANDING"
        string qrCodeHash
        string metadata JSON
        datetime issuedAt
        datetime expiresAt
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        string sentById FK
        string title
        string message
        enum type "IN_APP | EMAIL | SMS | PUSH"
        enum priority "LOW | NORMAL | HIGH | URGENT"
        string referenceType
        string referenceId
        boolean isRead
        datetime readAt
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        enum action "CREATE | READ | UPDATE | DELETE | LOGIN | LOGOUT | APPROVE | REJECT | EXPORT"
        string entityType
        string entityId
        object metadata JSON
        string ipAddress
        string userAgent
        datetime createdAt
    }

    AuthToken {
        string id PK
        string userId FK
        string token UK
        enum type "ACCESS | REFRESH | RESET_PASSWORD | VERIFY_EMAIL | MAGIC_LINK"
        datetime expiresAt
        string deviceInfo
        string ipAddress
        boolean isRevoked
        datetime createdAt
    }

    SystemSetting {
        string id PK
        string key UK
        string value
        enum type "string | number | boolean | json"
        string group
        string description
        boolean isPublic
        datetime updatedAt
    }

    %% RELATIONSHIPS
    User ||--o| Student : "has"
    User ||--o{ AuthToken : "has"
    User ||--o{ Notification : "receives"
    User ||--o{ Notification : "sends"
    User ||--o{ AuditLog : "performs"
    Student ||--o{ ClearanceRequest : "submits"
    Student ||--o{ Certificate : "receives"
    Student }|--|| Department : "belongs to"
    Student }|--|| Course : "enrolled in"
    Department ||--o{ Course : "offers"
    Department ||--o{ User : "headed by"
    Semester }|--|| AcademicYear : "part of"
    ClearanceRequest }|--|| Student : "submitted by"
    ClearanceRequest }|--|| Semester : "for semester"
    ClearanceRequest ||--o{ ClearanceApproval : "has stages"
    ClearanceRequest |o--|| Certificate : "results in"
    ClearanceApproval }|--|| User : "approved by"
    SystemSetting ||--o{ SystemSetting : "grouped"
```

## Key Design Decisions

### Normalization
- Database is normalized to 3NF (Third Normal Form)
- Composite unique keys prevent duplicate clearance requests per student per semester
- Separate approval records track each workflow stage independently

### Indexes
- All foreign keys are indexed
- Composite indexes on frequently queried combinations:
  - `(ClearanceRequest.studentId, ClearanceRequest.semesterId)` – unique
  - `(ClearanceApproval.clearanceRequestId, ClearanceApproval.officerId)` – unique
  - `(User.email)` – unique
  - `(Student.studentId)` – unique
  - `(AuthToken.token)` – unique

### Temporal Data
- `createdAt` / `updatedAt` on most tables for auditability
- `completedAt` / `approvedAt` timestamps for workflow tracking
- `expiresAt` on tokens and certificates for lifecycle management

### Enums
Clearance workflow uses strict enums:
- **ClearanceRequest.status**: `PENDING → IN_PROGRESS → APPROVED` (or `REJECTED`)
- **ClearanceApproval.status**: `PENDING → APPROVED` (or `REJECTED` or `CONDITIONAL`)

### Audit Trail
- Every mutation to clearance records generates an audit log entry
- Login/logout events are captured for security auditing
- Export operations are logged for compliance

## Database Migration Strategy

```bash
# Generate migration after schema changes
npx prisma migrate dev --name description_of_change

# Apply to production
npx prisma migrate deploy

# Seed data
npm run db:seed
```

## Seed Data

The seed script creates:
- 4 departments (Computer Science, Mathematics, Physics, Business Administration)
- Admin users for each role
- 10 sample students with clearance requests across all workflow stages
- System settings for clearance deadlines and configuration
- Active academic year and semester
