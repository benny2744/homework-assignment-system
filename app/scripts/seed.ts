
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  
  // Create test teacher account
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  // Clear existing data
  await prisma.autoSaveSession.deleteMany({});
  await prisma.studentWork.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.user.deleteMany({});
  
  // Create test teacher
  const testTeacher = await prisma.user.create({
    data: {
      username: 'john@doe.com',
      password_hash: hashedPassword,
      created_at: new Date(),
      active_sessions_count: 0,
    },
  });
  
  console.log('Created test teacher:', testTeacher.username);
  
  // Create a sample assignment
  const sampleAssignment = await prisma.assignment.create({
    data: {
      teacher_id: testTeacher.id,
      title: 'Sample Essay Assignment',
      content: `Write a 500-word essay on the following topic:

"The Impact of Technology on Modern Education"

In your essay, consider the following aspects:
1. How technology has changed the way students learn
2. The benefits and challenges of digital learning tools
3. Your personal experience with technology in education
4. Future predictions for educational technology

Make sure to:
- Provide specific examples
- Support your arguments with reasoning
- Use proper grammar and structure
- Stay within the word limit`,
      instructions: 'Please read the prompt carefully and write a thoughtful, well-structured essay. You can save your work as a draft and return to continue writing at any time before the deadline.',
      assignment_code: 'ABC123',
      status: 'active',
      activated_at: new Date(),
      student_count: 0,
      max_students: 30,
    },
  });
  
  console.log('Created sample assignment:', sampleAssignment.title);
  
  console.log('Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('Username: john@doe.com');
  console.log('Password: johndoe123');
  console.log('Sample Assignment Code: ABC123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
