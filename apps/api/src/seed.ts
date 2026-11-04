import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { registerSchema } from '@nexora/shared';
import { config } from './core/config.js';
import { User, Workspace, Project, Task, Note, Activity } from './core/models.js';
if (config.NODE_ENV === 'production')
  throw new Error('Demo seed is intentionally disabled in production.');
const input = registerSchema.parse({
  name: 'Alex Morgan',
  email: process.env.SEED_EMAIL,
  password: process.env.SEED_PASSWORD,
});
await mongoose.connect(config.MONGODB_URI);
try {
  let user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (user && !(await bcrypt.compare(input.password, user.passwordHash)))
    throw new Error('Seed account already exists with another password. No data changed.');
  if (!user)
    user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      verified: true,
    });
  let workspace = await Workspace.findOne({
    name: 'Studio workspace · demo seed',
    'members.userId': user._id,
  });
  if (workspace) {
    console.log('Demo workspace already exists; seed is idempotent.');
  } else {
    workspace = await Workspace.create({
      name: 'Studio workspace · demo seed',
      members: [{ userId: user._id, role: 'owner' }],
    });
    const scope = { workspaceId: workspace._id, createdBy: user._id };
    const projects = await Project.insertMany([
      {
        ...scope,
        name: 'Website redesign',
        description: 'A clearer story for the next chapter of our brand.',
        color: 'violet',
        status: 'active',
        priority: 'high',
        members: [user._id],
      },
      {
        ...scope,
        name: 'Product launch',
        description: 'Give our next big idea a thoughtful introduction.',
        color: 'emerald',
        status: 'active',
        priority: 'medium',
        members: [user._id],
      },
      {
        ...scope,
        name: 'Brand exploration',
        description: 'Find a visual direction that feels like us.',
        color: 'amber',
        status: 'planned',
        priority: 'medium',
        members: [user._id],
      },
    ]);
    const titles = [
      'Explore the new brand direction',
      'Review landing page designs',
      'Prepare product launch notes',
      'Write the first project brief',
      'Design the onboarding flow',
      'Gather customer interview notes',
      'Map the navigation structure',
      'Finalize the visual direction',
      'Build the component library',
      'Plan the launch checklist',
      'Review accessibility',
      'Polish the empty states',
    ];
    await Task.insertMany(
      titles.map((title, i) => ({
        ...scope,
        title,
        projectId: projects[i % 3]._id,
        assigneeId: user!._id,
        status: i < 4 ? 'done' : i < 7 ? 'in-progress' : i < 10 ? 'todo' : 'backlog',
        priority: i % 4 === 0 ? 'high' : 'medium',
        description: 'Illustrative demo seed data. Replace with your own work.',
        dueDate: new Date(Date.now() + (i - 1) * 86400000),
        completedAt: i < 4 ? new Date(Date.now() - i * 86400000) : undefined,
      })),
    );
    await Note.insertMany([
      {
        ...scope,
        title: 'A few thoughts on what comes next',
        content:
          '<h2>Make room for the big idea</h2><p>This workspace contains clearly identified demo seed data. All changes you make here are saved to MongoDB.</p><ul><li>Keep the experience thoughtful</li><li>Give every next step a home</li></ul>',
        favorite: true,
        category: 'Ideas',
      },
      {
        ...scope,
        title: 'Product launch meeting',
        content:
          '<h2>The next chapter</h2><p>Agree on the story, plan the milestones, and share a first draft.</p>',
        category: 'Meeting notes',
      },
    ]);
    await Activity.create({
      ...scope,
      message: 'Created an illustrative demo workspace. All entries are demo seed data.',
      href: '/dashboard',
    });
    console.log('Demo seed created. Sign in with your SEED_EMAIL and SEED_PASSWORD.');
  }
} finally {
  await mongoose.disconnect();
}
