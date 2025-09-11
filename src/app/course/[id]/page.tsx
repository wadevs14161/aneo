'use client';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';

// Sample courses data (you can move this to a separate file later)
const sampleCourses = [
  {
    id: '1',
    title: 'Karaoke for Beginners',
    description: 'Learn the fundamentals of Karaoke including song selection, microphone techniques, and stage presence. Perfect for beginners who want to start singing confidently in front of an audience.',
    category: 'Party',
    thumbnail: '/courses/thumbnail_ktv.png',
    price: 99.99,
    instructor: 'John Smith',
    videoUrl: 'https://d36ld0px64xgzw.cloudfront.net/ktv.mp4'
  },
  {
    id: '2',
    title: 'Tennis Basics',
    description: 'Learn the fundamentals of Tennis including rules, techniques, and strategies. Perfect for beginners who want to start playing confidently.',
    category: 'Sport',
    thumbnail: '/courses/thumbnail_tennis_women.png',
    price: 149.99,
    instructor: 'Sarah Johnson',
    videoUrl: 'https://d36ld0px64xgzw.cloudfront.net/tennis-women.mp4'
  },
  {
    id: '3',
    title: 'Tennis Advanced Techniques',
    description: 'Take your Tennis skills to the next level with advanced techniques and strategies.',
    category: 'Sport',
    thumbnail: '/courses/thumbnail_tennis_men.png',
    price: 199.99,
    instructor: 'Mike Chen',
    videoUrl: 'https://d36ld0px64xgzw.cloudfront.net/tennis-men.mp4'
  },
  {
    id: '4',
    title: 'Dog Training 101',
    description: 'Learn the basics of dog training including obedience, commands, and behavior modification. Perfect for new dog owners.',
    category: 'Life',
    thumbnail: '/courses/thumbnail_dog.png',
    price: 99.99,
    instructor: 'Emily Davis',
    videoUrl: 'https://d36ld0px64xgzw.cloudfront.net/dog.mp4'
  }
];

export default function CoursePage() {
  const params = useParams();
  const courseId = params?.id as string;
  
  if (!courseId) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#f8f9fa',
        minHeight: '50vh'
      }}>
        <h2>Invalid course</h2>
        <p>No course ID provided.</p>
      </div>
    );
  }
  
  const course = sampleCourses.find(c => c.id === courseId);
  
  if (!course) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#f8f9fa',
        minHeight: '50vh'
      }}>
        <h2>Course not found</h2>
        <p>The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px 0',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <VideoPlayer
        videoUrl={course.videoUrl}
        title={course.title}
        description={course.description}
        instructor={course.instructor}
      />
    </div>
  );
}