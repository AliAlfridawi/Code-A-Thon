"use client";

import { Card, Badge, Button } from "@/components/ui";

interface CheckIn {
  id: number;
  date: string;
  summary: string;
  mood: "positive" | "neutral" | "needs-attention";
}

const seedCheckIns: CheckIn[] = [
  { id: 1, date: "Mar 12, 2026", summary: "Good progress on resume. Discussed networking strategies.", mood: "positive" },
  { id: 2, date: "Mar 5, 2026", summary: "Initial meeting. Set expectations and communication cadence.", mood: "positive" },
  { id: 3, date: "Feb 26, 2026", summary: "Introductory check-in after pairing was created.", mood: "neutral" },
];

const moodVariant: Record<CheckIn["mood"], "brand" | "warning" | "muted"> = {
  positive: "brand",
  neutral: "muted",
  "needs-attention": "warning",
};

const moodLabel: Record<CheckIn["mood"], string> = {
  positive: "Positive",
  neutral: "Neutral",
  "needs-attention": "Needs Attention",
};

export default function CheckInsPage() {
  return (
    <div className="space-y-6 reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Check-ins</h1>
          <p className="mt-1 text-text-muted">Reflection logs and feedback from mentor-mentee meetings.</p>
        </div>
        <Button variant="primary" size="md">+ New Check-in</Button>
      </div>

      <div className="space-y-4">
        {seedCheckIns.map((ci) => (
          <Card key={ci.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{ci.date}</h2>
                  <Badge variant={moodVariant[ci.mood]}>{moodLabel[ci.mood]}</Badge>
                </div>
                <p className="text-sm text-text-muted mt-1">{ci.summary}</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
