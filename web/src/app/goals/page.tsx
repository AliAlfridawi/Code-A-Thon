"use client";

import { Card, Badge, Button } from "@/components/ui";

interface Goal {
  id: number;
  title: string;
  status: "in-progress" | "completed" | "draft";
  target: string;
}

const seedGoals: Goal[] = [
  { id: 1, title: "Complete resume draft", status: "completed", target: "Mar 10" },
  { id: 2, title: "Attend 3 networking events", status: "in-progress", target: "Mar 20" },
  { id: 3, title: "Prepare elevator pitch", status: "draft", target: "Mar 25" },
];

const statusVariant: Record<Goal["status"], "brand" | "warning" | "muted"> = {
  "in-progress": "brand",
  completed: "brand",
  draft: "muted",
};

const statusLabel: Record<Goal["status"], string> = {
  "in-progress": "In Progress",
  completed: "Completed",
  draft: "Draft",
};

export default function GoalsPage() {
  return (
    <div className="space-y-6 reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Goals</h1>
          <p className="mt-1 text-text-muted">Track milestones and celebrate progress.</p>
        </div>
        <Button variant="primary" size="md">+ New Goal</Button>
      </div>

      <div className="space-y-4">
        {seedGoals.map((goal) => (
          <Card key={goal.id} className="p-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{goal.title}</h2>
                <Badge variant={statusVariant[goal.status]}>{statusLabel[goal.status]}</Badge>
              </div>
              <p className="text-sm text-text-muted mt-1">Target: {goal.target}</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
