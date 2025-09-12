'use client'
import React from 'react';

export default function CourseCardSkeleton() {
  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '8px',
      maxWidth: '100%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: 'white',
      animation: 'pulse 1.5s ease-in-out infinite'
    }}>
      {/* Thumbnail skeleton */}
      <div style={{
        width: '100%',
        height: '120px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        marginBottom: '6px'
      }}></div>
      
      {/* Title skeleton */}
      <div style={{
        height: '18px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        marginBottom: '4px',
        width: '80%'
      }}></div>
      
      {/* Description skeleton */}
      <div style={{
        height: '13px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        marginBottom: '2px',
        width: '100%'
      }}></div>
      <div style={{
        height: '13px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        marginBottom: '4px',
        width: '70%'
      }}></div>
      
      {/* Instructor skeleton */}
      <div style={{
        height: '11px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        marginBottom: '6px',
        width: '60%'
      }}></div>
      
      {/* Price and preview button row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          height: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          width: '60px'
        }}></div>
        <div style={{
          height: '32px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          width: '80px'
        }}></div>
      </div>
      
      {/* Button skeleton */}
      <div style={{
        height: '40px',
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        width: '100%'
      }}></div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}