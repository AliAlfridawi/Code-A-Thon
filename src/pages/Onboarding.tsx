import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleSelection } from './onboarding/RoleSelection';
import { ProfileQuiz } from './onboarding/ProfileQuiz';
import { MatchResults } from './onboarding/MatchResults';

export type OnboardingStep = 1 | 2 | 3;
export type UserRole = 'mentor' | 'mentee';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<any>(null);

  const nextStep = () => setStep((prev) => (prev + 1) as OnboardingStep);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <RoleSelection 
            onSelect={(selectedRole) => {
              setRole(selectedRole);
              nextStep();
            }} 
          />
        );
      case 2:
        return (
          <ProfileQuiz 
            role={role!} 
            onComplete={(data) => {
              setFormData(data);
              nextStep();
            }} 
          />
        );
      case 3:
        return (
          <MatchResults 
            role={role!} 
            formData={formData} 
          />
        );
      default:
        return null;
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2 text-sm font-medium text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
