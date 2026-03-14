"use client";

import { Card, Badge, Button } from "@/components/ui";
import { useRole } from "@/context/RoleProvider";

export default function PairingsPage() {
  const { role } = useRole();

  return (
    <div className="space-y-6 reveal">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Pairings</h1>
          <p className="mt-1 text-text-muted">
            {role === "officer"
              ? "Manage and create mentor-mentee pairings."
              : "View your current pairing details."}
          </p>
        </div>
        {role === "officer" && (
          <Button variant="primary" size="md">
            + New Pairing
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold font-heading">Jordan Lee ↔ Alex Chen</h2>
            <p className="text-sm text-text-muted mt-1">Matched for career preparation • Since Feb 2026</p>
          </div>
          <Badge variant="brand">Active</Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg bg-surface-muted p-3">
            <p className="text-text-muted">Messages</p>
            <p className="font-semibold">12 exchanged</p>
          </div>
          <div className="rounded-lg bg-surface-muted p-3">
            <p className="text-text-muted">Goals</p>
            <p className="font-semibold">2 active</p>
          </div>
          <div className="rounded-lg bg-surface-muted p-3">
            <p className="text-text-muted">Compatibility</p>
            <p className="font-semibold">84 / 100</p>
          </div>
        </div>
      </Card>

      <Card className="border-dashed border-2 border-border bg-transparent p-8 text-center">
        <p className="text-text-muted text-sm">
          {role === "officer"
            ? "Click \"+ New Pairing\" to create a new mentor-mentee match."
            : "You currently have one active pairing."}
        </p>
      </Card>
    </div>
  );
}
