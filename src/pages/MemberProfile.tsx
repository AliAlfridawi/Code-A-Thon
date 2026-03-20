import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Calendar, Clock, BookOpen, Beaker, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import PageTransition from '../components/PageTransition';
import { MENTORS, MENTEES } from '../types';
import { MENTOR_PROFILES, MENTEE_PROFILES } from '../data/profiles';

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();

  const mentor = MENTORS.find((m) => m.id === id);
  const mentee = MENTEES.find((m) => m.id === id);
  const person = mentor || mentee;
  const profile = id ? (MENTOR_PROFILES[id] || MENTEE_PROFILES[id]) : null;
  const isMentor = !!mentor;

  if (!person || !profile) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
            <GraduationCap size={32} className="text-on-surface-variant" />
          </div>
          <h2 className="font-headline font-bold text-xl text-primary mb-2">Member Not Found</h2>
          <p className="text-sm text-on-surface-variant mb-6">The profile you're looking for doesn't exist.</p>
          <Link to="/members" className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl">
            Back to Members
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Back Button */}
      <Link
        to="/members"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-6"
      >
        <ArrowLeft size={16} /> Back to Members
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-8"
      >
        <div className={`h-40 bg-gradient-to-br ${isMentor ? 'from-primary to-primary-container' : 'from-[#1a365d] to-[#2a4a7f]'}`} />
        <div className="bg-surface-container-lowest rounded-b-3xl px-8 pb-6 pt-0 border border-t-0 border-outline-variant/10">
          <div className="flex flex-col sm:flex-row items-start gap-6 -mt-12">
            <img
              src={person.avatar}
              alt={person.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
            />
            <div className="flex-1 pt-4 sm:pt-14">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-headline font-extrabold text-primary">{person.name}</h1>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {isMentor ? (mentor!.dept) : (`${mentee!.program} • ${mentee!.major}`)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${isMentor ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-violet-100 text-violet-700'}`}>
                    {isMentor ? 'Mentor' : 'Mentee'}
                  </span>
                  <a href={`mailto:${profile.email}`} className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-container transition-colors">
                    <Mail size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column — Main Info */}
        <div className="xl:col-span-2 space-y-8">
          {/* Bio */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-3">About</h2>
            <p className="text-sm text-on-surface leading-relaxed">{profile.bio}</p>
          </motion.section>

          {/* Research Interests */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-4 flex items-center gap-2">
              <Beaker size={18} /> Research Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.researchInterests.map((interest) => (
                <span key={interest} className="px-3 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-xl">
                  {interest}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Publications */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-4 flex items-center gap-2">
              <BookOpen size={18} /> Publications
            </h2>
            {profile.publications.length > 0 ? (
              <div className="space-y-4">
                {profile.publications.map((pub, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
                    <p className="text-sm font-bold text-primary">{pub.title}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {pub.journal} • {pub.year}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic">No publications yet.</p>
            )}
          </motion.section>
        </div>

        {/* Right Column — Contact & Availability */}
        <div className="space-y-8">
          {/* Contact Info */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-4">Contact</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-on-surface-variant mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</p>
                  <p className="text-sm text-primary">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-on-surface-variant mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Office</p>
                  <p className="text-sm text-primary">{profile.office}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-on-surface-variant mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Joined</p>
                  <p className="text-sm text-primary">{profile.joinedDate}</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Availability */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-4 flex items-center gap-2">
              <Clock size={18} /> Availability
            </h2>
            <div className="space-y-3">
              {profile.availability.map((slot) => (
                <div key={slot.day} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                  <span className="text-sm font-bold text-primary">{slot.day}</span>
                  <span className="text-xs text-on-surface-variant">{slot.hours}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Expertise Tags (mentors only) */}
          {isMentor && mentor!.tags.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10"
            >
              <h2 className="font-headline font-bold text-lg text-primary mb-4">Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {mentor!.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
