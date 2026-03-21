import { SignUp } from '@clerk/clerk-react';
import { motion } from 'motion/react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-surface-container-low to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <div className="mb-8 text-center">
          <h1 className="font-headline font-extrabold text-3xl text-primary mb-2">
            Scholarly Editorial
          </h1>
          <p className="text-sm text-on-surface-variant">
            Create an account to get started
          </p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'rounded-3xl shadow-2xl border border-outline-variant/10',
            },
          }}
        />
      </motion.div>
    </div>
  );
}
