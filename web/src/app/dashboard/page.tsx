"use client";

import { useRole } from "@/context/RoleProvider";
import { Card, Badge } from "@/components/ui";

/* ── KPI Stat Card ── */
function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <Card muted className="p-5">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold font-heading">{value}</p>
      {change && (
        <p className="mt-1 text-sm text-brand">{change}</p>
      )}
    </Card>
  );
}

/* ── Officer Dashboard ── */
function OfficerDashboard() {
  return (
    <div className="space-y-6 reveal">
      <div>
        <h1 className="text-3xl font-bold font-heading">Officer Dashboard</h1>
        <p className="mt-1 text-text-muted">Club-level mentorship overview and analytics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active Pairs" value="18" change="+3 this week" />
        <StatCard label="Meetings Logged" value="42" change="87% completion rate" />
        <StatCard label="Avg Compatibility" value="81" change="confidence: medium-high" />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold font-heading">Recent Activity</h2>
        <p className="mt-2 text-text-muted text-sm">Activity feed will appear here once pairings are active.</p>
      </Card>
    </div>
  );
}

/* ── Mentor Dashboard ── */
function MentorDashboard() {
  return (
    <div className="space-y-6 reveal">
      <div>
        <h1 className="text-3xl font-bold font-heading">Mentor Dashboard</h1>
        <p className="mt-1 text-text-muted">Your mentees, upcoming actions, and progress.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active Mentees" value="3" />
        <StatCard label="Pending Check-ins" value="1" change="due this week" />
        <StatCard label="Goals in Progress" value="5" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-heading">My Pairings</h2>
          <Badge variant="brand">On Track</Badge>
        </div>
        <p className="mt-2 text-text-muted text-sm">Your active pairings will be listed here.</p>
      </Card>
    </div>
  );
}

/* ── Mentee Dashboard ── */
function MenteeDashboard() {
  return (
    <div className="space-y-6 reveal">
      <div>
        <h1 className="text-3xl font-bold font-heading">Mentee Dashboard</h1>
        <p className="mt-1 text-text-muted">Track your mentorship journey — goals, meetings, and growth.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="My Mentor" value="Assigned" change="View profile →" />
        <StatCard label="Goals" value="2 Active" />
        <StatCard label="Next Check-in" value="Mar 18" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-heading">Progress</h2>
          <Badge variant="brand">On Track</Badge>
        </div>
        <p className="mt-2 text-text-muted text-sm">Your milestone progress will be displayed here.</p>
      </Card>
    </div>
  );
}

/* ── Routed Dashboard ── */
export default function DashboardPage() {
  const { role } = useRole();

  switch (role) {
    case "officer":
      return <OfficerDashboard />;
    case "mentor":
      return <MentorDashboard />;
    default:
      return <MenteeDashboard />;
  }
}
