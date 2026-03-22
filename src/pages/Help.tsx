import { CalendarDays, HelpCircle, MessageSquare, Settings, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import { MESSAGES_ROUTE } from '../constants/routes';

const helpTopics = [
  {
    icon: Sparkles,
    title: 'Pairing & Matching',
    description: 'Browse recommended matches, create a connection, and track whether it is pending, active, or completed.',
  },
  {
    icon: MessageSquare,
    title: 'Messages',
    description: 'Use the speech bubble on a connection card to open or create the direct conversation for that mentor or mentee.',
  },
  {
    icon: CalendarDays,
    title: 'Meetings',
    description: 'Schedule meetings inside a conversation and review upcoming sessions from the Calendar page.',
  },
  {
    icon: Settings,
    title: 'Account Settings',
    description: 'Update notification preferences, display settings, and account details from the Settings page.',
  },
];

const quickAnswers = [
  {
    question: 'How do I start a conversation?',
    answer: 'Open My Connections or Pairing and select the speech bubble. Your chat thread will be created automatically when needed.',
  },
  {
    question: 'Why is my pairing marked pending?',
    answer: 'Pending means the connection exists but has not been fully confirmed yet. You can still review the pairing and continue coordination in the app.',
  },
  {
    question: 'Where do I schedule a meeting?',
    answer: 'Open a conversation, click the calendar-plus icon, and send the meeting details directly into the chat history.',
  },
];

export default function Help() {
  return (
    <PageTransition>
      <PageHeader
        title="Help Center"
        description="Quick answers for pairing, messaging, meetings, and account setup."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-8">
        <section className="space-y-8">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-primary">Getting Started</h2>
                <p className="text-sm text-on-surface-variant">Use these steps to move through the platform quickly.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">Step 1</p>
                <p className="text-sm font-semibold text-primary mb-1">Complete your profile</p>
                <p className="text-sm text-on-surface-variant">Finish onboarding so the app can recommend strong mentor and mentee matches.</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">Step 2</p>
                <p className="text-sm font-semibold text-primary mb-1">Create or review connections</p>
                <p className="text-sm text-on-surface-variant">Visit Pairing to explore matches and keep track of your current connections.</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">Step 3</p>
                <p className="text-sm font-semibold text-primary mb-1">Message and schedule</p>
                <p className="text-sm text-on-surface-variant">Start a chat from a connection card, then use that thread to plan your next meeting.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {helpTopics.map((topic) => (
              <article
                key={topic.title}
                className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6"
              >
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <topic.icon className="text-primary" size={18} />
                </div>
                <h3 className="font-headline font-bold text-base text-primary mb-2">{topic.title}</h3>
                <p className="text-sm text-on-surface-variant leading-6">{topic.description}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-8">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6">
            <h2 className="font-headline font-bold text-lg text-primary mb-4">Quick Answers</h2>
            <div className="space-y-4">
              {quickAnswers.map((item) => (
                <div key={item.question} className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/10">
                  <p className="text-sm font-semibold text-primary mb-1">{item.question}</p>
                  <p className="text-sm text-on-surface-variant leading-6">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#002045] to-[#1a365d] rounded-3xl p-6 text-white shadow-lg">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60 mb-2">Quick Links</p>
            <h2 className="font-headline font-bold text-xl mb-2">Need to jump back in?</h2>
            <p className="text-sm text-white/75 mb-5">
              Head straight to the area you need and continue from there.
            </p>
            <div className="space-y-3">
              <Link
                to="/pairing"
                className="block rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                Open Pairing
              </Link>
              <Link
                to={MESSAGES_ROUTE}
                className="block rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                Open Messages
              </Link>
              <Link
                to="/settings"
                className="block rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                Open Settings
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-outline-variant/30 p-5 text-sm text-on-surface-variant">
            Need more guidance later? You can always return to this page from the sidebar Help link.
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
