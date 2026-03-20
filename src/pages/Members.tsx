import { useState } from 'react';
import { Search, Filter, Grid3X3, List, Mail, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { MENTORS, MENTEES } from '../types';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';

type Tab = 'mentors' | 'mentees';

export default function Members() {
  const [activeTab, setActiveTab] = useState<Tab>('mentors');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredMentors = MENTORS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMentees = MENTEES.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <PageHeader
        title="Members"
        description="Browse and manage all mentors and mentees in the program."
      />

      {/* Tabs + Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex bg-surface-container-low rounded-xl p-1">
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'mentors'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Mentors ({MENTORS.length})
          </button>
          <button
            onClick={() => setActiveTab('mentees')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'mentees'
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Mentees ({MENTEES.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-lowest rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10 transition-all"
            />
          </div>
          <button className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/20 transition-colors">
            <Filter size={16} className="text-on-surface-variant" />
          </button>
          <div className="flex bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Member Grid/List */}
      {activeTab === 'mentors' && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredMentors.map((mentor, i) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden hover:shadow-lg hover:border-primary/10 transition-all group ${
                viewMode === 'list' ? 'flex items-center gap-5 p-5' : 'p-0'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid Card */}
                  <div className="h-24 bg-gradient-to-br from-primary to-primary-container relative">
                    <div className="absolute -bottom-8 left-5">
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md"
                      />
                    </div>
                  </div>
                  <div className="pt-12 px-5 pb-5">
                    <h3 className="font-bold text-primary text-base">{mentor.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{mentor.dept}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {mentor.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/10">
                      <button className="flex-1 py-2 text-xs font-semibold text-primary bg-surface-container-low rounded-xl hover:bg-primary hover:text-white transition-colors">
                        View Profile
                      </button>
                      <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                        <Mail size={14} className="text-on-surface-variant" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                        <ExternalLink size={14} className="text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List Row */}
                  <img src={mentor.avatar} alt={mentor.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary text-sm">{mentor.name}</h3>
                    <p className="text-xs text-on-surface-variant">{mentor.dept}</p>
                  </div>
                  <div className="hidden md:flex flex-wrap gap-1.5">
                    {mentor.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="px-4 py-2 text-xs font-semibold text-primary bg-surface-container-low rounded-xl hover:bg-primary hover:text-white transition-colors shrink-0">
                    View
                  </button>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'mentees' && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredMentees.map((mentee, i) => (
            <motion.div
              key={mentee.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden hover:shadow-lg hover:border-primary/10 transition-all group ${
                viewMode === 'list' ? 'flex items-center gap-5 p-5' : 'p-0'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="h-24 bg-gradient-to-br from-[#1a365d] to-[#2a4a7f] relative">
                    <div className="absolute -bottom-8 left-5">
                      <img
                        src={mentee.avatar}
                        alt={mentee.name}
                        className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md"
                      />
                    </div>
                  </div>
                  <div className="pt-12 px-5 pb-5">
                    <h3 className="font-bold text-primary text-base">{mentee.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{mentee.program} • {mentee.major}</p>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/10">
                      <button className="flex-1 py-2 text-xs font-semibold text-primary bg-surface-container-low rounded-xl hover:bg-primary hover:text-white transition-colors">
                        View Profile
                      </button>
                      <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                        <Mail size={14} className="text-on-surface-variant" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                        <ExternalLink size={14} className="text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img src={mentee.avatar} alt={mentee.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary text-sm">{mentee.name}</h3>
                    <p className="text-xs text-on-surface-variant">{mentee.program} • {mentee.major}</p>
                  </div>
                  <button className="px-4 py-2 text-xs font-semibold text-primary bg-surface-container-low rounded-xl hover:bg-primary hover:text-white transition-colors shrink-0">
                    View
                  </button>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
