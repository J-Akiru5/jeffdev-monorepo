'use client';

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { AlertCircle, UserCheck, X } from 'lucide-react';
import { UserProfile } from '@/types/user';

interface SetupGuideProps {
  profile: UserProfile;
}

export function SetupGuide({ profile }: SetupGuideProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Derive missing fields directly
  const missingFields: string[] = [];
  if (!profile.displayName) missingFields.push('Display Name');
  if (!profile.title) missingFields.push('Title/Role');
  if (!profile.phone) missingFields.push('Phone');
  if (!profile.location) missingFields.push('Location');
  if (!profile.bio) missingFields.push('Bio');
  if (!profile.namecard?.username) missingFields.push('Username');

  useEffect(() => {
    if (missingFields.length > 0) {
      // Check if user has dismissed the guide in this session
      const dismissed = sessionStorage.getItem('setup_guide_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [missingFields.length]); // Depend on the count of missing fields

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#input-display-name',
          popover: {
            title: 'Who are you?',
            description: 'Enter your full name as you want it to appear to clients and the team.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#input-title',
          popover: {
            title: 'Your Role',
            description: 'What is your official designation? (e.g., Senior Developer, Designer).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#input-phone',
          popover: {
            title: 'Contact Info',
            description: 'Add your phone number for internal team communication.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#input-location',
          popover: {
            title: 'Location',
            description: 'Where are you based? Helps with time zone coordination.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#input-bio',
          popover: {
            title: 'Short Bio',
            description: 'Tell us a bit about your expertise and background.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#input-username',
          popover: {
            title: 'Claim your Handle',
            description: 'Choose a unique username for your public digital namecard.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#btn-save',
          popover: {
            title: 'Save Changes',
            description: 'Don\'t forget to save your profile once you\'re done!',
            side: 'top',
            align: 'end',
          },
        },
      ],
    });

    driverObj.drive();
  };

  const dismissGuide = () => {
    setIsVisible(false);
    sessionStorage.setItem('setup_guide_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <UserCheck className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-semibold text-white">Complete your profile</h3>
                <p className="mt-1 text-sm text-white/60 max-w-xl">
                    Your profile is {Math.round(((6 - missingFields.length) / 6) * 100)}% complete. 
                    Adding these details helps the team get to know you better.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {missingFields.map(field => (
                        <span key={field} className="inline-flex items-center rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white/50">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {field}
                        </span>
                    ))}
                </div>
                <div className="mt-4">
                    <button
                        onClick={startTour}
                        className="rounded-md bg-cyan-500 px-4 py-2 text-xs font-bold text-black transition-transform hover:scale-105 hover:bg-cyan-400"
                    >
                        Start Guide
                    </button>
                    <button
                        onClick={dismissGuide}
                        className="ml-3 text-xs text-white/40 hover:text-white/60 hover:underline"
                    >
                        Remind me later
                    </button>
                </div>
            </div>
        </div>
        
        <button 
            onClick={dismissGuide}
            className="text-white/20 hover:text-white transition-colors"
        >
            <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
