import { Router } from 'express';
import { Task, Project, Activity } from '../core/models.js';
export const analyticsRouter = Router({ mergeParams: true });
analyticsRouter.get('/', async (req, res) => {
  const scope = { workspaceId: req.workspaceId };
  const [tasks, projects, activityCount] = await Promise.all([
    Task.find(scope).lean(),
    Project.find(scope).lean(),
    Activity.countDocuments(scope),
  ]);
  const now = new Date();
  const distribution = ['backlog', 'todo', 'in-progress', 'done'].map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));
  const trends = Array.from({ length: 7 }, (_, i) => {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (6 - i));
    const end = new Date(start.getTime() + 86400000);
    return {
      date: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' }),
      completed: tasks.filter((t) => t.completedAt && t.completedAt >= start && t.completedAt < end)
        .length,
      created: tasks.filter((t) => t.createdAt >= start && t.createdAt < end).length,
    };
  });
  const projectProgress = projects.map((project) => {
    const related = tasks.filter((t) => String(t.projectId) === String(project._id));
    const completed = related.filter((t) => t.status === 'done').length;
    return {
      ...project,
      total: related.length,
      completed,
      progress: related.length ? Math.round((completed / related.length) * 100) : 0,
    };
  });
  const completed = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== 'done');
  res.json({
    data: {
      totalTasks: tasks.length,
      completed,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      totalProjects: projects.length,
      overdue: overdue.length,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      activityCount,
      distribution,
      trends,
      projects: projectProgress,
      upcoming: tasks
        .filter((t) => t.dueDate && t.status !== 'done')
        .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
        .slice(0, 5),
      suggestions: [
        ...(overdue.length
          ? [
              `${overdue.length} overdue task${overdue.length === 1 ? ' needs' : 's need'} a new plan. Review due dates with your team.`,
            ]
          : []),
        ...(tasks.filter((t) => t.status === 'in-progress').length > 5
          ? ['Limit work in progress to help your team finish what matters.']
          : []),
        ...(tasks.length === 0
          ? ['Create your first project and break it into small, actionable tasks.']
          : []),
        ...(completed > 0 ? [`${completed} tasks completed. Keep the momentum going.`] : []),
      ],
    },
  });
});
