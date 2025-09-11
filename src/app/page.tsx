"use client";
import React from "react";
import CourseGrid from '@/components/CourseGrid';

// Sample course data - replace with real data from your database
const sampleCourses = [
  {
    id: '1',
    title: 'Karaoke for Beginners',
    description: 'Learn the fundamentals of Karaoke including song selection, microphone techniques, and stage presence. Perfect for beginners who want to start singing confidently in front of an audience.',
    category: 'Party',
    thumbnail: '/courses/thumbnail_ktv.png', // Replace with actual course thumbnails
    price: 99.99,
    instructor: 'John Smith'
  },
  {
    id: '2',
    title: 'Tennis Basics',
    description: 'Learn the fundamentals of Tennis including rules, techniques, and strategies. Perfect for beginners who want to start playing confidently.',
    category: 'Sport',
    thumbnail: '/courses/thumbnail_tennis_women.png',
    price: 149.99,
    instructor: 'Sarah Johnson'
  },
  {
    id: '3',
    title: 'Tennis Advanced Techniques',
    description: 'Take your Tennis skills to the next level with advanced techniques and strategies.',
    category: 'Sport',
    thumbnail: '/courses/thumbnail_tennis_men.png',
    price: 199.99,
    instructor: 'Mike Chen'
  },
  {
    id: '4',
    title: 'Dog Training 101',
    description: 'Learn the basics of dog training including obedience, commands, and behavior modification. Perfect for new dog owners.',
    category: 'Life',
    thumbnail: '/courses/thumbnail_dog.png',
    price: 99.99,
    instructor: 'Emily Davis'
  }
];

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", backgroundColor: "#f8f9fa" }}>
      <div style={{ padding: '20px' }}>
        <CourseGrid courses={sampleCourses} />
      </div>
    </main>
  );
}
