import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all todos with pagination and filters
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: req.user!.id
    };

    // Filter by status
    if (req.query['status']) {
      where.status = req.query['status'];
    }

    // Filter by priority
    if (req.query['priority']) {
      where.priority = req.query['priority'];
    }

    // Search in title and description
    if (req.query['search']) {
      where.OR = [
        { title: { contains: req.query['search'] as string, mode: 'insensitive' } },
        { description: { contains: req.query['search'] as string, mode: 'insensitive' } }
      ];
    }

    // Filter by category
    if (req.query['category']) {
      where.categories = {
        some: {
          category: {
            name: { contains: req.query['category'] as string, mode: 'insensitive' }
          }
        }
      };
    }

    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true
            }
          },
          subtasks: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.todo.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        todos: todos.map(todo => ({
          ...todo,
          categories: todo.categories.map((tc: any) => tc.category)
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch todos'
    });
  }
});

// Get single todo by ID
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const todo = await prisma.todo.findFirst({
      where: { 
        id: id,
        userId: req.user!.id 
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        subtasks: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!todo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        todo: {
          ...todo,
          categories: todo.categories.map((tc: any) => tc.category)
        }
      }
    });
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch todo'
    });
  }
});

// Create new todo
router.post('/', authenticate, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional().isISO8601(),
  body('categoryIds').optional().isArray()
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { title, description, priority, dueDate, categoryIds } = req.body;

    const todoData: any = {
      title,
      description,
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: req.user!.id
    };

    // Add categories if provided
    if (categoryIds && categoryIds.length > 0) {
      todoData.categories = {
        create: categoryIds.map((categoryId: string) => ({
          categoryId
        }))
      };
    }

    const todo = await prisma.todo.create({
      data: todoData,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        subtasks: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: {
        todo: {
          ...todo,
          categories: todo.categories.map((tc: any) => tc.category)
        }
      }
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create todo'
    });
  }
});

// Update todo
router.put('/:id', authenticate, [
  body('title').optional().notEmpty(),
  body('description').optional(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  body('dueDate').optional().isISO8601(),
  body('categoryIds').optional().isArray()
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { title, description, priority, status, dueDate, categoryIds } = req.body;

    // Check if todo exists and belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: { 
        id: id,
        userId: req.user!.id 
      }
    });

    if (!existingTodo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // Update categories if provided
    if (categoryIds !== undefined) {
      // Delete existing category relations
      await prisma.todoCategory.deleteMany({
        where: { todoId: id }
      });

      // Create new category relations
      if (categoryIds.length > 0) {
        updateData.categories = {
          create: categoryIds.map((categoryId: string) => ({
            categoryId
          }))
        };
      }
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: id },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        subtasks: true
      }
    });

    res.json({
      success: true,
      message: 'Todo updated successfully',
      data: {
        todo: {
          ...updatedTodo,
          categories: updatedTodo?.categories.map((tc: any) => tc.category)
        }
      }
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update todo'
    });
  }
});

// Delete todo
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if todo exists and belongs to user
    const existingTodo = await prisma.todo.findFirst({
      where: { 
        id: id,
        userId: req.user!.id 
      }
    });

    if (!existingTodo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
      return;
    }

    await prisma.todo.delete({
      where: { id: id }
    });

    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete todo'
    });
  }
});

// Add subtask to todo
router.post('/:id/subtasks', authenticate, [
  body('title').notEmpty().withMessage('Subtask title is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { title } = req.body;

    // Check if todo exists and belongs to user
    const todo = await prisma.todo.findFirst({
      where: { 
        id: id,
        userId: req.user!.id 
      }
    });

    if (!todo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
      return;
    }

    const subtask = await prisma.subtask.create({
      data: {
        title,
        todoId: id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subtask created successfully',
      data: { subtask }
    });
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subtask'
    });
  }
});

// Update subtask
router.put('/subtasks/:subtaskId', authenticate, [
  body('title').optional().notEmpty(),
  body('completed').optional().isBoolean()
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { subtaskId } = req.params;
    const { title, completed } = req.body;

    // Check if subtask exists and belongs to user's todo
    const subtask = await prisma.subtask.findFirst({
      where: { 
        id: subtaskId,
        todo: {
          userId: req.user!.id
        }
      }
    });

    if (!subtask) {
      res.status(404).json({
        success: false,
        error: 'Subtask not found'
      });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Subtask updated successfully',
      data: { subtask: updatedSubtask }
    });
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subtask'
    });
  }
});

// Delete subtask
router.delete('/subtasks/:subtaskId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { subtaskId } = req.params;

    // Check if subtask exists and belongs to user's todo
    const subtask = await prisma.subtask.findFirst({
      where: { 
        id: subtaskId,
        todo: {
          userId: req.user!.id
        }
      }
    });

    if (!subtask) {
      res.status(404).json({
        success: false,
        error: 'Subtask not found'
      });
      return;
    }

    await prisma.subtask.delete({
      where: { id: subtaskId }
    });

    res.json({
      success: true,
      message: 'Subtask deleted successfully'
    });
  } catch (error) {
    console.error('Delete subtask error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete subtask'
    });
  }
});

// Add comment to todo
router.post('/:id/comments', authenticate, [
  body('content').notEmpty().withMessage('Comment content is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { content } = req.body;

    // Check if todo exists and belongs to user
    const todo = await prisma.todo.findFirst({
      where: { 
        id: id,
        userId: req.user!.id 
      }
    });

    if (!todo) {
      res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        todoId: id,
        userId: req.user!.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

export default router;