'use client';
import { useWorkspaceData } from '@/lib/hooks';
import type { Analytics as AnalyticsData } from '@/lib/types';
import { CompletionChart, DistributionChart, ProjectsChart } from '@/components/charts';
import { Loading, ErrorState, Empty } from '@/components/ui/common';
import { Stats } from './overview';
export function Analytics() {
  const query = useWorkspaceData<AnalyticsData>('analytics');
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return null;
  const data = query.data;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A clearer view of the bigger picture.</h1>
          <p>Real progress, calculated from your workspace.</p>
        </div>
        <span className="badge violet">Last 7 days · UTC</span>
      </div>
      <Stats data={data} />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Your momentum</h2>
              <p>Tasks created and completed each day</p>
            </div>
          </div>
          <div className="panel-body">
            <CompletionChart data={data.trends} />
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Where things stand</h2>
              <p>Current tasks by status</p>
            </div>
          </div>
          {data.totalTasks ? (
            <DistributionChart data={data.distribution} />
          ) : (
            <Empty
              title="A clean slate"
              description="Your task distribution will appear as you add work."
            />
          )}
        </section>
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>From the start to the finish line</h2>
            <p>Project completion based on tasks · {data.activityCount} workspace activities</p>
          </div>
        </div>
        <div className="panel-body">
          {data.projects.length ? (
            <ProjectsChart data={data.projects} />
          ) : (
            <Empty
              title="Room for the next big thing"
              description="Create a project and track its progress here."
            />
          )}
        </div>
      </section>
      <p className="muted" style={{ fontSize: 10, marginTop: 20 }}>
        Completion trends use each task’s current completion timestamp. Reopening a task removes it
        from completed counts. These are current-state insights, not a historical event ledger.
      </p>
    </>
  );
}
