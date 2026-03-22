import { User, Bell, Palette, Shield, Save, Camera, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/PageHeader';
import { useSettings } from '../hooks/useSettings';
import { useUser } from '@clerk/clerk-react';

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

function Toggle({ enabled, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
    >
      <motion.span
        animate={{ x: enabled ? -20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

export default function Settings() {
  const { settings, loading, updateSetting } = useSettings();
  const { user } = useUser(); // From Clerk

  const sections = [
    {
      id: 'profile',
      icon: User,
      title: 'Profile',
      description: 'Manage your personal information',
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Configure how you receive alerts',
    },
    {
      id: 'appearance',
      icon: Palette,
      title: 'Appearance',
      description: 'Customize the look and feel',
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Security',
      description: 'Manage your account security',
    },
  ];

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
        title="Settings"
        description="Manage your account preferences and application settings."
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Navigation */}
        <nav className="xl:col-span-1">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-2 space-y-1 sticky top-24">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                <section.icon size={18} />
                <span>{section.title}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Settings Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Profile Section */}
          <motion.section
            id="profile"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-6 flex items-center gap-2">
              <User size={20} /> Profile
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <div className="relative group shrink-0">
                <img
                  src={user?.imageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150"}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover"
                />
                <button className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.fullName || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-surface-container-low opacity-70 cursor-not-allowed rounded-xl text-sm text-on-surface outline-none border border-outline-variant/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.primaryEmailAddress?.emailAddress || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-surface-container-low opacity-70 cursor-not-allowed rounded-xl text-sm text-on-surface outline-none border border-outline-variant/10 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant italic">
                    Note: Profile and security settings are managed via your Clerk account portal.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section
            id="notifications"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-6 flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h2>
            <div className="space-y-5">
              {[
                { label: 'Email notifications', desc: 'Receive pairing updates via email', key: 'email_notifs' },
                { label: 'Push notifications', desc: 'Get real-time browser notifications', key: 'push_notifs' },
                { label: 'Weekly digest', desc: 'Summary of activity sent every Monday', key: 'weekly_digest' },
                { label: 'Match alerts', desc: 'Notify when a new match is suggested', key: 'match_alerts' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors">
                  <div>
                    <p className="text-sm font-bold text-primary">{item.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle 
                    enabled={!!settings[item.key as keyof typeof settings]} 
                    onToggle={() => updateSetting(item.key as keyof typeof settings, !settings[item.key as keyof typeof settings])} 
                  />
                </div>
              ))}
            </div>
          </motion.section>

          {/* Appearance Section */}
          <motion.section
            id="appearance"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-6 flex items-center gap-2">
              <Palette size={20} /> Appearance
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors">
                <div>
                  <p className="text-sm font-bold text-primary">Dark mode</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Switch to a darker color scheme</p>
                </div>
                <Toggle 
                  enabled={!!settings.dark_mode} 
                  onToggle={() => updateSetting('dark_mode', !settings.dark_mode)} 
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors">
                <div>
                  <p className="text-sm font-bold text-primary">Compact view</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Reduce spacing and card sizes</p>
                </div>
                <Toggle 
                  enabled={!!settings.compact_view} 
                  onToggle={() => updateSetting('compact_view', !settings.compact_view)} 
                />
              </div>
            </div>
          </motion.section>

          {/* Security Section */}
          <motion.section
            id="security"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
            className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6"
          >
            <h2 className="font-headline font-bold text-lg text-primary mb-6 flex items-center gap-2">
              <Shield size={20} /> Security
            </h2>
            <div className="space-y-4">
               <p className="text-sm text-on-surface-variant mb-4">
                  For enhanced security, password resets and two-factor authentication must be managed directly through your provider.
               </p>
               <button className="px-5 py-2.5 bg-surface-container-low text-primary font-bold rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all">
                 Manage Account Security
               </button>
            </div>
          </motion.section>

          {/* Save Button (Optional since toggles auto-save) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.35 }}
            className="flex justify-end"
          >
            <button className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-transform hover:shadow-xl">
              <Save size={18} />
              Save Preferences
            </button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
