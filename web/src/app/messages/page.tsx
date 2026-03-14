"use client";

import { useState } from "react";
import { Card, Button, Input } from "@/components/ui";

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
}

const seedMessages: Message[] = [
  { id: 1, sender: "Alex Chen", text: "Hey Jordan! How did the resume workshop go?", time: "10:32 AM" },
  { id: 2, sender: "Jordan Lee", text: "It went great! I got some good feedback on layout.", time: "10:45 AM" },
  { id: 3, sender: "Alex Chen", text: "Nice! Want to go over it in our next meeting?", time: "10:47 AM" },
  { id: 4, sender: "Jordan Lee", text: "Yes, that would be super helpful. Thanks!", time: "11:02 AM" },
];

export default function MessagesPage() {
  const [messages] = useState<Message[]>(seedMessages);

  return (
    <div className="space-y-6 reveal">
      <div>
        <h1 className="text-3xl font-bold font-heading">Messages</h1>
        <p className="mt-1 text-text-muted">Direct messaging with your paired mentor or mentee.</p>
      </div>

      <Card className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        {/* Thread header */}
        <div className="border-b border-border px-5 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-bold">
            AC
          </div>
          <div>
            <p className="font-semibold text-sm">Alex Chen</p>
            <p className="text-xs text-text-muted">Mentor • Career Preparation</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isSelf = msg.sender === "Jordan Lee";
            return (
              <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div className={[
                  "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                  isSelf
                    ? "bg-brand text-white rounded-br-md"
                    : "bg-surface-muted text-text-primary rounded-bl-md",
                ].join(" ")}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${isSelf ? "text-white/70" : "text-text-muted"}`}>{msg.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div className="border-t border-border px-5 py-3 flex gap-3">
          <Input placeholder="Type a message…" className="flex-1" />
          <Button variant="primary" size="md">Send</Button>
        </div>
      </Card>
    </div>
  );
}
