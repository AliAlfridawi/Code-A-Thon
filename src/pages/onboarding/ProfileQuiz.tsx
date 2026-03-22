import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../../hooks/useSupabase';
import { markOnboardingComplete } from '../../hooks/useOnboardingStatus';
import { UserRole } from '../Onboarding';
import { Loader2, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileQuizProps {
  role: UserRole;
  onComplete: (data: any) => void;
}

export function ProfileQuiz({ role, onComplete }: ProfileQuizProps) {
  const { user } = useUser();
  const supabase = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    dept: '',
    major: '',
    program: '',
    bio: '',
    tags: [] as string[],
    interests: [] as string[],
    research_interests: [] as string[],
    availability: ['Monday', 'Wednesday', 'Friday']
  });

  const [newTag, setNewTag] = useState('');
  const [newResearch, setNewResearch] = useState('');

  const addTag = () => {
    if (!newTag.trim()) return;
    const field = role === 'mentor' ? 'tags' : 'interests';
    if (!formData[field].includes(newTag.trim())) {
      setFormData({ ...formData, [field]: [...formData[field], newTag.trim()] });
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    const field = role === 'mentor' ? 'tags' : 'interests';
    setFormData({ ...formData, [field]: formData[field].filter(t => t !== tag) });
  };

  const addResearch = () => {
    if (!newResearch.trim()) return;
    if (!formData.research_interests.includes(newResearch.trim())) {
      setFormData({ ...formData, research_interests: [...formData.research_interests, newResearch.trim()] });
    }
    setNewResearch('');
  };

  const removeResearch = (item: string) => {
    setFormData({ ...formData, research_interests: formData.research_interests.filter(t => t !== item) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) return;

      const table = role === 'mentor' ? 'mentors' : 'mentees';
      const payload: any = {
        clerk_user_id: user.id,
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        research_interests: formData.research_interests,
        availability: formData.availability.map(day => ({ day, hours: '9AM - 5PM' })),
        avatar_url: user.imageUrl,
      };

      if (role === 'mentor') {
        payload.dept = formData.dept;
        payload.tags = formData.tags;
      } else {
        payload.major = formData.major;
        payload.program = formData.program;
        payload.interests = formData.interests;
      }

      // 1. Upsert into role table
      const { error: roleError } = await supabase
        .from(table)
        .upsert(payload, { onConflict: 'clerk_user_id' });

      if (roleError) throw roleError;

      // 2. Upsert user_profiles row with role and onboarding_complete
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({ 
          clerk_user_id: user.id,
          role: role,
          onboarding_complete: true 
        }, { onConflict: 'clerk_user_id' });

      if (profileError) throw profileError;

      // Warm the onboarding cache so the guard doesn't redirect back
      markOnboardingComplete(role);

      onComplete(payload);
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const labelClasses = "block text-sm font-medium text-muted-foreground mb-2 ml-1";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Tell us about yourself</h1>
        <p className="text-muted-foreground">This information helps us find the best matches for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Full Name</label>
            <input 
              required
              className={inputClasses}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClasses}>Email Address</label>
            <input 
              required
              type="email"
              className={inputClasses}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        {role === 'mentor' ? (
          <div>
            <label className={labelClasses}>Department</label>
            <input 
              required
              placeholder="e.g. Computer Science"
              className={inputClasses}
              value={formData.dept}
              onChange={e => setFormData({ ...formData, dept: e.target.value })}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Major</label>
              <input 
                required
                placeholder="e.g. Software Engineering"
                className={inputClasses}
                value={formData.major}
                onChange={e => setFormData({ ...formData, major: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Program</label>
              <input 
                required
                placeholder="e.g. Bachelor of Science"
                className={inputClasses}
                value={formData.program}
                onChange={e => setFormData({ ...formData, program: e.target.value })}
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelClasses}>{role === 'mentor' ? 'Tags / Skills' : 'Interests'}</label>
          <div className="flex gap-2 mb-3">
            <input 
              className={inputClasses}
              placeholder={`Add a ${role === 'mentor' ? 'tag' : 'interest'}`}
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button 
              type="button" 
              onClick={addTag}
              className="p-3 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(role === 'mentor' ? formData.tags : formData.interests).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClasses}>Research Interests</label>
          <div className="flex gap-2 mb-3">
            <input 
              className={inputClasses}
              placeholder="Add a research interest"
              value={newResearch}
              onChange={e => setNewResearch(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addResearch())}
            />
            <button 
              type="button" 
              onClick={addResearch}
              className="p-3 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.research_interests.map(item => (
              <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {item}
                <button type="button" onClick={() => removeResearch(item)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClasses}>Bio</label>
          <textarea 
            required
            rows={4}
            className={inputClasses}
            placeholder="Tell us a bit about your academic background and goals..."
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving Profile...
            </>
          ) : (
            'Complete Profile'
          )}
        </button>
      </form>
    </div>
  );
}
