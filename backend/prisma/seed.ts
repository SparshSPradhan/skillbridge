import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SEED SCRIPT
 * -----------
 * This creates test users in your DB (after you've already created
 * them in Clerk and have their clerk_user_ids).
 *
 * Replace the clerkUserId values with actual IDs from your Clerk dashboard.
 * Or run the app, sign up as each role, then this seed will not be needed.
 */
async function main() {
  console.log('🌱 Seeding database...');

  // Create institution user
  const institution = await prisma.user.upsert({
    where: { email: 'institution@skillbridge.dev' },
    update: {},
    create: {
      clerkUserId: 'REPLACE_WITH_CLERK_ID_institution',
      name: 'Delhi Skills Institute',
      email: 'institution@skillbridge.dev',
      role: Role.INSTITUTION,
    },
  });

  // Create trainer
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@skillbridge.dev' },
    update: {},
    create: {
      clerkUserId: 'REPLACE_WITH_CLERK_ID_trainer',
      name: 'Rahul Sharma',
      email: 'trainer@skillbridge.dev',
      role: Role.TRAINER,
      institutionId: institution.id,
    },
  });

  // Create student
  const student = await prisma.user.upsert({
    where: { email: 'student@skillbridge.dev' },
    update: {},
    create: {
      clerkUserId: 'REPLACE_WITH_CLERK_ID_student',
      name: 'Priya Verma',
      email: 'student@skillbridge.dev',
      role: Role.STUDENT,
    },
  });

  // Create programme manager
  await prisma.user.upsert({
    where: { email: 'manager@skillbridge.dev' },
    update: {},
    create: {
      clerkUserId: 'REPLACE_WITH_CLERK_ID_manager',
      name: 'Arjun Mehta',
      email: 'manager@skillbridge.dev',
      role: Role.PROGRAMME_MANAGER,
    },
  });

  // Create monitoring officer
  await prisma.user.upsert({
    where: { email: 'monitor@skillbridge.dev' },
    update: {},
    create: {
      clerkUserId: 'REPLACE_WITH_CLERK_ID_monitor',
      name: 'Sneha Patel',
      email: 'monitor@skillbridge.dev',
      role: Role.MONITORING_OFFICER,
    },
  });

  // Create a batch
  const batch = await prisma.batch.upsert({
    where: { id: 'seed-batch-001' },
    update: {},
    create: {
      id: 'seed-batch-001',
      name: 'Web Development Cohort A',
      institutionId: institution.id,
      createdById: institution.id,
      trainers: { create: { trainerId: trainer.id } },
      students: { create: { studentId: student.id } },
    },
  });

  // Create sessions
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);

  const session1 = await prisma.session.create({
    data: {
      batchId: batch.id,
      trainerId: trainer.id,
      title: 'Introduction to HTML & CSS',
      date: yesterday,
      startTime: '09:00',
      endTime: '11:00',
    },
  });

  await prisma.session.create({
    data: {
      batchId: batch.id,
      trainerId: trainer.id,
      title: 'JavaScript Fundamentals',
      date: today,
      startTime: '09:00',
      endTime: '11:00',
    },
  });

  // Mark attendance for yesterday's session
  await prisma.attendance.create({
    data: {
      sessionId: session1.id,
      studentId: student.id,
      status: AttendanceStatus.PRESENT,
    },
  });

  console.log('✅ Seed complete');
  console.log('Institution ID:', institution.id);
  console.log('Trainer ID:', trainer.id);
  console.log('Student ID:', student.id);
  console.log('Batch ID:', batch.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());