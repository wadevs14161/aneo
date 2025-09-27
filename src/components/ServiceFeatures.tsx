'use client'
import React from 'react';

export default function ServiceFeatures() {
  const features = [
    {
      id: 'video-courses',
      title: 'Video Courses',
      description: 'Watch our comprehensive video lessons',
      icon: (
        <svg className="w-12 h-12 sm:w-16 sm:h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <polygon points="10,8 16,12 10,16"/>
        </svg>
      )
    },
    {
      id: 'one-on-one',
      title: 'Online One-on-One',
      description: 'Real-time interaction with instructors',
      icon: (
        <svg className="w-12 h-12 sm:w-16 sm:h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    {
      id: 'study-guidance',
      title: 'Study Guidance',
      description: 'Get practical study abroad assistance',
      icon: (
        <svg className="w-12 h-12 sm:w-16 sm:h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      )
    },
    {
      id: 'writing-support',
      title: 'Writing Support',
      description: 'Improve your English writing skills',
      icon: (
        <svg className="w-12 h-12 sm:w-16 sm:h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      )
    }
  ];

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ];

  return (
    <div className="bg-gray-100 p-4 sm:p-6 lg:p-8 mx-auto w-full max-w-6xl">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-10">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
            OUR SERVICES
          </h3>
        </div>

        {/* Responsive Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-4">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="rounded-2xl p-6 sm:p-8 lg:p-10 text-center text-white shadow-xl hover:shadow-2xl relative overflow-hidden flex flex-col justify-center items-center min-h-[280px] sm:min-h-[320px] transform transition-all duration-300 hover:-translate-y-2"
              style={{
                background: gradients[index]
              }}
            >
              {/* Background Pattern */}
              <div 
                className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'
                }}
              />
              
              {/* Icon */}
              <div className="mb-6 sm:mb-8 relative z-10 flex justify-center">
                {feature.icon}
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <h4 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-white">
                  {feature.title}
                </h4>
                <p className="text-sm sm:text-base leading-relaxed text-white/90">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}