'use client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import type { Analytics } from '@/lib/types';
const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--text)',
};
const colors = ['#5d5d74', '#8da3f7', '#b096fc', '#65d5b3'];
export function CompletionChart({ data }: { data: Analytics['trends'] }) {
  return (
    <div
      className="chart-container"
      role="img"
      aria-label={`Tasks over the last 7 days: ${data.map((d) => `${d.label}: ${d.completed} completed, ${d.created} created`).join('; ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--subtle)', fontSize: 9 }}
            dy={9}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--subtle)', fontSize: 9 }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="created"
            name="Created"
            stroke="#55536c"
            strokeDasharray="4 4"
            fill="transparent"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#a78bfa"
            fill="url(#completedFill)"
            strokeWidth={2.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function DistributionChart({ data }: { data: Analytics['distribution'] }) {
  return (
    <div>
      <div
        className="chart-container"
        role="img"
        aria-label={data.map((d) => `${d.status}: ${d.count}`).join(', ')}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.status} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
        className="chart-legend"
        style={{ justifyContent: 'center', flexWrap: 'wrap', paddingBottom: 15 }}
      >
        {data.map((d, i) => (
          <span key={d.status}>
            <i className="dot" style={{ color: colors[i] }} />
            {d.status.replace('-', ' ')} ({d.count})
          </span>
        ))}
      </div>
    </div>
  );
}
export function ProjectsChart({ data }: { data: Analytics['projects'] }) {
  return (
    <div
      className="chart-container"
      role="img"
      aria-label={data.map((d) => `${d.name}: ${d.progress}%`).join(', ')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 8)} margin={{ left: -20, right: 10, top: 10 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: 'var(--muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(s) => (s.length > 15 ? s.slice(0, 14) + '…' : s)}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: 'var(--muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
          <Bar
            dataKey="progress"
            name="Complete"
            fill="#a78bfa"
            radius={[5, 5, 0, 0]}
            maxBarSize={35}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
