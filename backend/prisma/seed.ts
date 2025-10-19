// Database seed script
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@todoapp.com' },
    update: {},
    create: {
      email: 'demo@todoapp.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('✅ User created:', user.email);

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: {
        id: 'cat-1',
        name: 'Work',
        color: '#3B82F6',
        userId: user.id,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: {
        id: 'cat-2',
        name: 'Personal',
        color: '#10B981',
        userId: user.id,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-3' },
      update: {},
      create: {
        id: 'cat-3',
        name: 'Shopping',
        color: '#F59E0B',
        userId: user.id,
      },
    }),
  ]);

  console.log('✅ Categories created:', categories.length);

  // Create sample todos
  const todos = await Promise.all([
    prisma.todo.create({
      data: {
        title: 'Complete project proposal',
        description: 'Finish the project proposal for the new client',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        userId: user.id,
        categories: {
          create: {
            categoryId: categories[0].id,
          },
        },
        subtasks: {
          create: [
            {
              title: 'Research client requirements',
              completed: true,
              order: 1,
            },
            {
              title: 'Create initial draft',
              completed: false,
              order: 2,
            },
            {
              title: 'Review and finalize',
              completed: false,
              order: 3,
            },
          ],
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Buy groceries',
        description: 'Weekly grocery shopping',
        priority: 'MEDIUM',
        status: 'TODO',
        userId: user.id,
        categories: {
          create: {
            categoryId: categories[2].id,
          },
        },
        subtasks: {
          create: [
            {
              title: 'Make shopping list',
              completed: true,
              order: 1,
            },
            {
              title: 'Go to supermarket',
              completed: false,
              order: 2,
            },
          ],
        },
      },
    }),
    prisma.todo.create({
      data: {
        title: 'Exercise routine',
        description: 'Daily workout session',
        priority: 'LOW',
        status: 'COMPLETED',
        userId: user.id,
        categories: {
          create: {
            categoryId: categories[1].id,
          },
        },
      },
    }),
  ]);

  console.log('✅ Todos created:', todos.length);

  // Create sample comments
  await prisma.comment.create({
    data: {
      content: 'Great progress on this task!',
      userId: user.id,
      todoId: todos[0].id,
    },
  });

  console.log('✅ Comments created');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
