import { PrismaClient, UserRole, ClearanceStatus, ApprovalStatus, SemesterType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clearpath.edu' },
    update: {},
    create: {
      email: 'admin@clearpath.edu',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMINISTRATOR,
      isVerified: true,
      phone: '+1234567890',
    },
  });

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'CSC' },
      update: {},
      create: { name: 'Computer Science', code: 'CSC', description: 'Department of Computer Science', headId: admin.id },
    }),
    prisma.department.upsert({
      where: { code: 'ENG' },
      update: {},
      create: { name: 'Engineering', code: 'ENG', description: 'Department of Engineering', headId: admin.id },
    }),
    prisma.department.upsert({
      where: { code: 'BUS' },
      update: {},
      create: { name: 'Business Administration', code: 'BUS', description: 'Department of Business Administration', headId: admin.id },
    }),
    prisma.department.upsert({
      where: { code: 'SCI' },
      update: {},
      create: { name: 'Sciences', code: 'SCI', description: 'Department of Sciences', headId: admin.id },
    }),
    prisma.department.upsert({
      where: { code: 'ART' },
      update: {},
      create: { name: 'Arts and Humanities', code: 'ART', description: 'Department of Arts and Humanities', headId: admin.id },
    }),
  ]);

  // Create courses
  await Promise.all([
    prisma.course.upsert({ where: { code: 'CSC101' }, update: {}, create: { name: 'Computer Science', code: 'CSC101', departmentId: departments[0].id, duration: 4 } }),
    prisma.course.upsert({ where: { code: 'CSC201' }, update: {}, create: { name: 'Software Engineering', code: 'CSC201', departmentId: departments[0].id, duration: 4 } }),
    prisma.course.upsert({ where: { code: 'ENG101' }, update: {}, create: { name: 'Mechanical Engineering', code: 'ENG101', departmentId: departments[1].id, duration: 5 } }),
    prisma.course.upsert({ where: { code: 'BUS101' }, update: {}, create: { name: 'Business Management', code: 'BUS101', departmentId: departments[2].id, duration: 4 } }),
  ]);

  // Create academic year and semester
  const academicYear = await prisma.academicYear.upsert({
    where: { year: '2024/2025' },
    update: {},
    create: {
      year: '2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-08-31'),
      isCurrent: true,
    },
  });

  const semester = await prisma.semester.upsert({
    where: { academicYearId_semesterType: { academicYearId: academicYear.id, semesterType: SemesterType.FIRST } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      semesterType: SemesterType.FIRST,
      name: 'First Semester 2024/2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-01-15'),
      clearanceDeadline: new Date('2024-12-15'),
      isCurrent: true,
    },
  });

  // Create officers
  const officerPassword = await bcrypt.hash('Officer@123', 12);
  const officerRoles = [
    { email: 'finance@clearpath.edu', role: UserRole.FINANCE_OFFICER, firstName: 'Finance', lastName: 'Officer' },
    { email: 'library@clearpath.edu', role: UserRole.LIBRARY_OFFICER, firstName: 'Library', lastName: 'Officer' },
    { email: 'lab@clearpath.edu', role: UserRole.LABORATORY_OFFICER, firstName: 'Lab', lastName: 'Officer' },
    { email: 'sports@clearpath.edu', role: UserRole.SPORTS_OFFICER, firstName: 'Sports', lastName: 'Officer' },
    { email: 'dept@clearpath.edu', role: UserRole.DEPARTMENT_OFFICER, firstName: 'Department', lastName: 'Officer' },
    { email: 'invigilator@clearpath.edu', role: UserRole.INVIGILATOR, firstName: 'Exam', lastName: 'Invigilator' },
  ];

  for (const officerData of officerRoles) {
    await prisma.user.upsert({
      where: { email: officerData.email },
      update: {},
      create: {
        email: officerData.email,
        password: officerPassword,
        firstName: officerData.firstName,
        lastName: officerData.lastName,
        role: officerData.role,
        isVerified: true,
      },
    });
  }

  // Create test student
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@clearpath.edu' },
    update: {},
    create: {
      email: 'student@clearpath.edu',
      password: studentPassword,
      firstName: 'John',
      lastName: 'Student',
      role: UserRole.STUDENT,
      isVerified: true,
      phone: '+1234567891',
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentId: 'CSC2021001',
      departmentId: departments[0].id,
      courseId: 'CSC101',
      currentLevel: 300,
      yearOfEntry: 2021,
      cgpa: 3.5,
    },
  });

  // Create system settings
  const settings = [
    { key: 'app_name', value: 'ClearPath', group: 'general', type: 'string', isPublic: true, description: 'Application name' },
    { key: 'app_logo', value: '', group: 'general', type: 'string', isPublic: true, description: 'Application logo URL' },
    { key: 'academic_year', value: '2024/2025', group: 'academic', type: 'string', isPublic: true, description: 'Current academic year' },
    { key: 'clearance_deadline', value: '2024-12-15', group: 'clearance', type: 'string', isPublic: true, description: 'Clearance submission deadline' },
    { key: 'enable_email_notifications', value: 'true', group: 'notifications', type: 'boolean', isPublic: false, description: 'Enable email notifications' },
    { key: 'enable_sms_notifications', value: 'false', group: 'notifications', type: 'boolean', isPublic: false, description: 'Enable SMS notifications' },
    { key: 'enable_push_notifications', value: 'true', group: 'notifications', type: 'boolean', isPublic: false, description: 'Enable push notifications' },
    { key: 'maintenance_mode', value: 'false', group: 'system', type: 'boolean', isPublic: false, description: 'Maintenance mode' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('Database seeded successfully!');
  console.log('\nTest Accounts:');
  console.log('  Admin:      admin@clearpath.edu / Admin@123');
  console.log('  Student:    student@clearpath.edu / Student@123');
  console.log('  Finance:    finance@clearpath.edu / Officer@123');
  console.log('  Library:    library@clearpath.edu / Officer@123');
  console.log('  Lab:        lab@clearpath.edu / Officer@123');
  console.log('  Sports:     sports@clearpath.edu / Officer@123');
  console.log('  Dept:       dept@clearpath.edu / Officer@123');
  console.log('  Invigilator: invigilator@clearpath.edu / Officer@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
