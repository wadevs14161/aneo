'use client'

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  description?: string;
  instructor?: string;
  className?: string;
}

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  description, 
  instructor,
  className = "" 
}: VideoPlayerProps) {
  // Debug: Log video props
  console.log('🎥 VideoPlayer props:', { videoUrl, title, description, instructor });

  if (!videoUrl) {
    console.log('❌ No video URL provided');
    return (
      <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Video not available</p>
      </div>
    );
  }

  console.log('✅ Video URL available:', videoUrl);

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Video Player */}
      <div className="mb-8">
        <video 
          className="w-full aspect-video rounded-lg shadow-lg"
          controls
          preload="metadata"
          // poster="/video-placeholder.jpg" // Removed: Add poster image when available
        >
          <source src={videoUrl} type="video/mp4" />
          <p className="text-red-500">
            Your browser does not support the video tag. 
            <a href={videoUrl} className="underline ml-1">Download the video</a>
          </p>
        </video>
      </div>

      {/* Course Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        
        {description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
        )}
        
        {instructor && (
          <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
            <span className="font-medium">Instructor: {instructor}</span>
          </div>
        )}
      </div>
    </div>
  );
}