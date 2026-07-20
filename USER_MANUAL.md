# ClearPath User Manual

## Getting Started

### Login
1. Navigate to your ClearPath URL
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to your role-specific dashboard

### Navigation
The sidebar provides access to:
- **Dashboard** - Role-specific overview with stats and charts
- **Clearance** - Submit and track clearance requests
- **Students** - View student records (admin only)
- **Departments** - Manage departments (admin/ICT only)
- **Verification** - QR code scanning (invigilator only)
- **Certificates** - Download clearance certificates
- **Reports** - Generate and export reports
- **Notifications** - View system notifications

## Role-Specific Guides

### Student
1. **Submit Clearance**: Dashboard -> "Submit New Clearance" button
2. **Track Progress**: Dashboard shows current stage and progress bar
3. **Download Certificate**: Available when all 6 stages are approved
4. **Check Eligibility**: Dashboard shows exam eligibility status

### Officer (Finance/Library/Lab/Sports/Department)
1. **View Pending**: Officer Dashboard shows pending requests
2. **Approve**: Click "Approve" on a request, optionally add remarks
3. **Reject**: Click "Reject", provide a reason (required)
4. **Bulk Approve**: Select multiple requests, click "Approve All"

### Registrar
1. **Final Approval**: Review fully approved clearances from other stages
2. **Issue Certificates**: Final approval triggers automatic certificate generation

### Invigilator
1. **QR Scanner**: Scan student QR codes for instant verification
2. **Manual Verify**: Enter student ID as fallback
3. **Offline Mode**: Works without internet using cached data
4. **History**: View all verification attempts

### Administrator
1. **Full Control**: Manage users, departments, courses
2. **Analytics**: View system-wide statistics and trends
3. **Reports**: Export data in CSV, Excel, or PDF
4. **Settings**: Configure system parameters

## AI Assistant

The AI Assistant (bottom-right sparkle icon) provides:
- Natural language answers about clearance processes
- Workflow explanations
- Status guidance
- Certificate and eligibility information

## Offline Mode

ClearPath works offline for key operations:
- **Student data** is cached in IndexedDB
- **Pending actions** sync when back online
- **QR verification** works with cached student data
- **Install the PWA** for the best offline experience (install banner appears after 3 seconds)

## Clearance Workflow

```
Student Submission
├── 1. Finance Officer Approval
├── 2. Library Officer Approval
├── 3. Lab Officer Approval
├── 4. Sports Officer Approval
├── 5. Department Approval
├── 6. Registrar Final Approval
└── Certificate Generated (with HMAC-signed QR)
     └── Exam Eligibility Auto-Enabled
```

Each stage must be approved before moving to the next. If any stage rejects, the entire clearance is rejected with a reason provided.

## Reports & Export

Navigate to Reports page to:
- View clearance trends (daily/weekly/monthly)
- Compare department performance
- See clearance distribution (approved/pending/rejected)
- Export in CSV, Excel, or PDF format

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't login | Check email/password, contact admin to reset |
| Clearance not visible | Make sure you've submitted for current semester |
| Certificate not appearing | Must complete all 6 approval stages |
| QR scan fails | Ensure good lighting, center QR in scanner box |
| Offline data outdated | Connect to internet and sync |
