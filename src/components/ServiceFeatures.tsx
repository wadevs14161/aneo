'use client'
import React from 'react';

export default function ServiceFeatures() {
  const features = [
    {
      id: 'video-courses',
      title: 'Video Courses',
      description: 'Watch our comprehensive video lessons',
      icon: (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <div style={{
      backgroundColor: '#eff1f2ff',
      padding: '10px 20px',
      margin: '0 auto',
      width: '70%'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
          </div>
          <h3 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#2c3e50',
            margin: '0 0 10px 0'
          }}>
            OUR SERVICES
          </h3>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '15px',
          padding: '0 10px',
          flexWrap: 'nowrap',
          alignItems: 'stretch'
        }}>
          {features.map((feature, index) => (
            <div
              key={feature.id}
              style={{
                flex: '1',
                minWidth: '0',
                background: gradients[index],
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
              }}
            >
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }} />
              
              {/* Icon */}
              <div style={{
                marginBottom: '25px',
                position: 'relative',
                zIndex: 1
              }}>
                {feature.icon}
              </div>
              
              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h4 style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  color: 'white'
                }}>
                  {feature.title}
                </h4>
                <p style={{
                  fontSize: '16px',
                  lineHeight: '1.5',
                  color: 'rgba(255,255,255,0.9)',
                  margin: '0'
                }}>
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