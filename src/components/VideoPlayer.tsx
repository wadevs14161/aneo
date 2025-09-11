import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  description: string;
  instructor: string;
}

export default function VideoPlayer({ videoUrl, title, description, instructor }: VideoPlayerProps) {
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: '#333'
      }}>
        {title}
      </h1>
      
      <div style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '20px'
      }}>
        Instructor: {instructor}
      </div>

      <div style={{
        marginBottom: '20px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#000'
      }}>
        <video
          controls
          width="100%"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '500px'
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div style={{
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#444'
      }}>
        <h3 style={{ marginBottom: '10px' }}>Course Description</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}