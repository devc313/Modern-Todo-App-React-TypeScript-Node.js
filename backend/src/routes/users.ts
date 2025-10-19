import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user statistics
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get todo statistics
    const todoStats = await prisma.todo.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    });

    // Get category statistics
    const categoryStats = await prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { todos: true }
        }
      }
    });

    // Get recent activity
    const recentTodos = await prisma.todo.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true
      }
    });

    // Calculate completion rate
    const totalTodos = await prisma.todo.count({ where: { userId } });
    const completedTodos = await prisma.todo.count({ 
      where: { userId, status: 'COMPLETED' } 
    });
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    res.json({
      success: true,
      data: {
        todoStats: todoStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        categoryStats: categoryStats.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          todoCount: cat._count.todos
        })),
        recentTodos,
        completionRate: Math.round(completionRate * 100) / 100,
        totalTodos,
        completedTodos
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics'
    });
  }
});

// Get user's teams
router.get('/teams', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const teams = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { members: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        teams: teams.map(member => ({
          id: member.team.id,
          name: member.team.name,
          description: member.team.description,
          role: member.role,
          owner: member.team.owner,
          memberCount: member.team._count.members,
          joinedAt: member.joinedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user teams'
    });
  }
});

// Delete user account
router.delete('/account', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

export default router;
