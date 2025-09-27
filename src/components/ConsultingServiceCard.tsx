'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { Course } from '@/lib/database/schema';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/lib/auth';

interface ConsultingServiceCardProps {
  course: Course;
}

const CONSULTING_SERVICES = [
  {
    id: '1-on-1-tutoring',
    name: '1-on-1 Tutoring',
    description: 'Personalized one-on-one tutoring sessions',
    duration: '60 minutes',
    price: 500
  },
  {
    id: 'study-guidance',
    name: 'Study Guidance',
    description: 'Structured study plans and academic guidance',
    duration: '45 minutes',
    price: 500
  },
  {
    id: 'writing-support',
    name: 'Writing Support',
    description: 'Essay writing, editing, and academic writing assistance',
    duration: '90 minutes',
    price: 500
  }
];

export default function ConsultingServiceCard({ course }: ConsultingServiceCardProps) {
  const [selectedService, setSelectedService] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();

  const selectedServiceDetails = CONSULTING_SERVICES.find(service => service.id === selectedService);

  const handleAddToCart = async () => {
    if (!user) {
      setMessage('Please log in to add services to cart');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!selectedService) {
      setMessage('Please select a service type');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (isInCart(course.id)) {
      setMessage('Consulting service already in cart');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      // Store selected service details in localStorage for checkout
      const serviceSelection = {
        serviceId: selectedService,
        serviceName: selectedServiceDetails?.name || '',
        serviceDescription: selectedServiceDetails?.description || '',
        duration: selectedServiceDetails?.duration || '',
        price: selectedServiceDetails?.price || 0,
        courseId: course.id,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`consulting-service-${course.id}`, JSON.stringify(serviceSelection));

      // Add the consulting service course to cart using existing system
      const result = await addToCart(course.id);
      
      if (result.success) {
        setMessage(`${selectedServiceDetails?.name} added to cart!`);
        setTimeout(() => setMessage(''), 3000);
        setSelectedService(''); // Reset selection
      } else {
        setMessage(result.error || 'Failed to add to cart');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding consulting service to cart:', error);
      setMessage('Failed to add to cart');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '100%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <Image
          src={course.thumbnail_url}
          alt={course.title}
          width={226}
          height={120}
          style={{
            width: '100%',
            height: '120px',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
        />
      </div>
      
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        color: '#333'
      }}>
        {course.title}
      </h3>
      
      <p style={{ 
        fontSize: '14px', 
        color: '#666', 
        marginBottom: '12px',
        lineHeight: '1.4'
      }}>
        {course.description}
      </p>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#888', 
        marginBottom: '16px' 
      }}>
        Instructor: {course.instructor_name}
      </div>

      {/* Service Selection Dropdown */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Select Service Type:
        </label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="">Choose a service...</option>
          {CONSULTING_SERVICES.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - ${service.price}
            </option>
          ))}
        </select>
      </div>

      {/* Service Details */}
      {selectedServiceDetails && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '4px'
          }}>
            {selectedServiceDetails.name}
          </h4>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '6px'
          }}>
            {selectedServiceDetails.description}
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#374151'
          }}>
            <span>Duration: {selectedServiceDetails.duration}</span>
            <span style={{ fontWeight: '600' }}>
              ${selectedServiceDetails.price}
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleAddToCart}
          disabled={isLoading || (!!user && !selectedService)}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px] w-full
            ${(isLoading || (!!user && !selectedService)) 
              ? 'opacity-50 cursor-not-allowed bg-gray-400' 
              : 'cursor-pointer bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }
            text-white
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Adding...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a1 1 0 001 1h7a1 1 0 001-1v-6M7 13H5" />
              </svg>
              Add to Cart
            </>
          )}
        </button>
        
        {message && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded whitespace-nowrap z-10 shadow-lg">
            {message}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
          </div>
        )}
      </div>
    </div>
  );
}