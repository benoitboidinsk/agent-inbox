"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();

  // Handle click to proceed to dashboard
  const handleProceed = () => {
    // Set both localStorage and cookie to remember user has seen landing
    localStorage.setItem('hasSeenLanding', 'true');
    document.cookie = 'hasSeenLanding=true; path=/; max-age=86400'; // 24 hours
    
    // Redirect to dashboard with query parameters
    router.push('/dashboard?agent_inbox=013077ae-53ce-408a-91b9-e660ced7d612&inbox=interrupted&limit=10&offset=0');
  };

  return (
    <section 
      className="fixed inset-0 z-50 flex justify-center items-center bg-gray-50 cursor-pointer"
      onClick={handleProceed}
    >
      <div className="text-center px-5 py-10 max-w-4xl relative">
        <div className="relative inline-block opacity-0 translate-y-5 animate-fadeInSlideUp">
          <div className="relative w-[240px] h-[120px] mx-auto">
            <Image 
              src="/icons/SK_logo.png"
              alt="Simon Kucher Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
            {/* Pulse effect positioned at top right of logo */}
            <div className="absolute top-[8px] right-[4px] w-12 h-12 bg-[rgba(220,20,60,0.4)] rounded-full opacity-0 scale-50 animate-delayedPulse"></div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mt-6 mb-4 opacity-0 translate-y-5 animate-fadeInSlideUp" style={{ animationDelay: '0.7s' }}>
          SK Cognitive Hub
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed opacity-0 translate-y-5 animate-fadeInSlideUp" style={{ animationDelay: '1.2s' }}>
          AI-driven insights connecting strategy and execution for:
        </p>
        <div className="mt-4 opacity-0 translate-y-5 animate-fadeInSlideUp" style={{ animationDelay: '1.5s' }}>
          <p className="text-xl font-semibold text-gray-800 flex justify-center items-center flex-wrap gap-x-3">
            <span>Market Research</span>
            <span className="text-red-500">•</span>
            <span>Packaging</span>
            <span className="text-red-500">•</span>
            <span>Pricing</span>
            <span className="text-red-500">•</span>
            <span>Marketing</span>
          </p>
        </div>
        <div className="mt-8 opacity-0 animate-fadeInSlideUp" style={{ animationDelay: '1.8s' }}>
          <p className="text-sm text-gray-500">Click anywhere to continue</p>
        </div>
      </div>
    </section>
  );
}
