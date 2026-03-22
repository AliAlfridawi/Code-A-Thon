import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../../hooks/useSupabase';
import { UserRole } from '../Onboarding';
import { GraduationCap, Users, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

export function RoleSelection({ onSelect }: RoleSelectionProps) {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const [isSaving, setIsSaving] = React.useState<UserRole | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleRoleSelect = async (role: UserRole) => {
    if (!user) {
      setErrorMessage('Please wait for your account to finish loading, then try again.');
      return;
    }

    setIsSaving(role);
    setErrorMessage(null);

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          clerk_user_id: user.id,
          role,
          onboarding_complete: false,
        },
        { onConflict: 'clerk_user_id' }
      );

    if (error) {
      console.error('Error saving selected role:', error);
      setErrorMessage(error.message || 'We could not save your role right now. Please try again.');
      setIsSaving(null);
      return;
    }

    onSelect(role);
  };

  const roles = [
    {
      id: 'mentor' as UserRole,
      title: 'Mentor',
      description: 'Share your knowledge and guide others in their academic journey.',
      icon: <GraduationCap className="h-12 w-12 text-primary" />,
      color: 'bg-primary/10 border-primary/20 hover:border-primary/50'
    },
    {
      id: 'mentee' as UserRole,
      title: 'Mentee',
      description: 'Seek guidance from experienced mentors to excel in your field.',
      icon: <Users className="h-12 w-12 text-primary" />,
      color: 'bg-secondary/50 border-border hover:border-primary/50'
    }
  ];

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Choose Your Role</h1>
      <p className="text-muted-foreground mb-12 text-lg">
        Select how you'd like to participate in the mentoring community.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {roles.map((role) => (
          <motion.button
            key={role.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect(role.id)}
            disabled={!isLoaded || !user || isSaving !== null}
            className={`flex flex-col items-center p-8 rounded-2xl border-2 transition-all text-left ${role.color}`}
          >
            <div className="mb-6">{role.icon}</div>
            <h3 className="text-2xl font-semibold mb-2">{role.title}</h3>
            <p className="text-muted-foreground mb-8 text-center">{role.description}</p>
            <div className="mt-auto flex items-center gap-2 text-primary font-medium group">
              {isSaving === role.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Select Role
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {errorMessage ? (
        <p className="mt-6 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
