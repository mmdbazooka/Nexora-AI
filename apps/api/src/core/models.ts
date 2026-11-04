import mongoose, { Schema } from 'mongoose';
const opts = { timestamps: true } as const;
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    verified: { type: Boolean, default: false },
    avatar: { type: String, default: '' },
    theme: { type: String, default: 'dark' },
    notifications: {
      email: { type: Boolean, default: true },
      activity: { type: Boolean, default: true },
    },
  },
  opts,
);
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const safe = ret as Record<string, unknown>;
    delete safe.passwordHash;
    return safe;
  },
});
export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model(
  'Session',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      tokenHash: { type: String, unique: true, required: true },
      previousHashes: [String],
      userAgent: String,
      expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
      revoked: { type: Boolean, default: false },
    },
    opts,
  ),
);
export const ActionToken = mongoose.model(
  'ActionToken',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      hash: { type: String, required: true, unique: true },
      kind: { type: String, enum: ['verify', 'reset'], required: true },
      expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    },
    opts,
  ),
);
export const Workspace = mongoose.model(
  'Workspace',
  new Schema(
    {
      name: { type: String, required: true },
      members: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        },
      ],
    },
    opts,
  ),
);
Workspace.schema.index({ 'members.userId': 1 });
export const Invitation = mongoose.model(
  'Invitation',
  new Schema(
    {
      workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
      email: { type: String, required: true },
      role: { type: String, enum: ['admin', 'member'], default: 'member' },
      hash: { type: String, unique: true, required: true },
      expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    },
    opts,
  ),
);
const resourceBase = {
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
};
export const Project = mongoose.model(
  'Project',
  new Schema(
    {
      ...resourceBase,
      name: { type: String, required: true },
      description: { type: String, default: '' },
      status: {
        type: String,
        enum: ['planned', 'active', 'completed', 'archived'],
        default: 'active',
      },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      dueDate: Date,
      members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      color: { type: String, default: 'violet' },
    },
    opts,
  ),
);
export const Task = mongoose.model(
  'Task',
  new Schema(
    {
      ...resourceBase,
      title: { type: String, required: true },
      description: { type: String, default: '' },
      status: { type: String, enum: ['backlog', 'todo', 'in-progress', 'done'], default: 'todo' },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
      assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      dueDate: Date,
      completedAt: Date,
      subtasks: [
        { title: { type: String, required: true }, done: { type: Boolean, default: false } },
      ],
    },
    opts,
  ),
);
Task.schema.index({ workspaceId: 1, status: 1, updatedAt: -1 });
export const Note = mongoose.model(
  'Note',
  new Schema(
    {
      ...resourceBase,
      title: { type: String, required: true },
      content: { type: String, default: '' },
      category: { type: String, default: 'General' },
      favorite: { type: Boolean, default: false },
      deleted: { type: Boolean, default: false },
    },
    opts,
  ),
);
export const Activity = mongoose.model(
  'Activity',
  new Schema(
    {
      ...resourceBase,
      message: { type: String, required: true },
      href: { type: String, default: '/dashboard' },
      kind: { type: String, default: 'activity' },
    },
    opts,
  ),
);
Activity.schema.index({ workspaceId: 1, createdAt: -1 });
export const Notification = mongoose.model(
  'Notification',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true, index: true },
      message: String,
      href: { type: String, default: '/dashboard' },
      read: { type: Boolean, default: false },
    },
    opts,
  ),
);
export const Conversation = mongoose.model(
  'Conversation',
  new Schema(
    {
      ...resourceBase,
      title: { type: String, default: 'New conversation' },
      messages: [
        {
          role: { type: String, enum: ['user', 'assistant'], required: true },
          content: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    opts,
  ),
);
export const Usage = mongoose.model(
  'Usage',
  new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true },
      day: { type: String, required: true },
      count: { type: Number, default: 0 },
    },
    opts,
  ),
);
Usage.schema.index({ userId: 1, day: 1 }, { unique: true });
