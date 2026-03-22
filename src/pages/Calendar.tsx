import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays, Clock, Loader2, ChevronLeft, ChevronRight, Video
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useMeetings, Meeting } from '../hooks/useMeetings';
import { useUserProfile } from '../hooks/useUserProfile';
import {
  formatMeetingDateKeyLabel,
  formatMeetingDateParts,
  getMeetingDateKey,
  getMeetingStatusClasses,
  isMeetingWithinDays,
} from '../utils/dateUtils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const { calendarMeetings, upcomingCalendarMeetings, loading } = useMeetings();
  const { role } = useUserProfile();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const meetingsByDate: Record<string, Meeting[]> = {};
  calendarMeetings.forEach((meeting) => {
    const key = getMeetingDateKey(meeting.scheduled_at);
    if (!meetingsByDate[key]) meetingsByDate[key] = [];
    meetingsByDate[key].push(meeting);
  });

  const selectedMeetings = selectedDate ? meetingsByDate[selectedDate] || [] : [];
  const upcoming = upcomingCalendarMeetings.filter((meeting) => isMeetingWithinDays(meeting.scheduled_at, 7, now));

  if (loading) {
    return (
      <PageTransition>
        <div className="flex bg-surface min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Calendar"
        description={`Your pending and confirmed meetings with ${role === 'mentor' ? 'mentees' : 'mentors'}.`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
              <ChevronLeft size={20} className="text-primary" />
            </button>
            <h2 className="font-headline font-bold text-lg text-primary">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
              <ChevronRight size={20} className="text-primary" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasMeeting = Boolean(meetingsByDate[dateKey]?.length);
              const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
              const isSelected = selectedDate === dateKey;

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative ${
                    isSelected
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : isToday
                        ? 'bg-primary/10 text-primary font-bold ring-2 ring-primary/30'
                        : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  {day}
                  {hasMeeting ? (
                    <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {selectedDate ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
            >
              <h3 className="font-headline font-bold text-sm text-primary mb-4">
                {formatMeetingDateKeyLabel(selectedDate)}
              </h3>
              {selectedMeetings.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic">No meetings on this day.</p>
              ) : (
                <div className="space-y-3">
                  {selectedMeetings.map(meeting => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}

          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={16} className="text-primary" />
              <h3 className="font-headline font-bold text-sm text-primary">This Week</h3>
            </div>
            {upcoming.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays className="h-10 w-10 text-on-surface-variant/15 mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant italic">No meetings this week.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

const MeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => {
  const { time, dayName } = formatMeetingDateParts(meeting.scheduled_at);

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/10">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-sm text-primary">{meeting.title}</h4>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <Clock size={10} />
            <span className="text-[10px] font-medium">{time}</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getMeetingStatusClasses(meeting.status)}`}>
            {meeting.status}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-on-surface-variant mb-2">
        {dayName} - {meeting.duration_minutes} min
        {meeting.notes ? ` - ${meeting.notes}` : ''}
      </p>
      {meeting.meeting_link ? (
        <a
          href={meeting.meeting_link.startsWith('http') ? meeting.meeting_link : `https://${meeting.meeting_link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:opacity-90 transition-opacity"
        >
          <Video size={10} />
          Join
        </a>
      ) : null}
    </div>
  );
};
