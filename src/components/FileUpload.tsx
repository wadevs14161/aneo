'use client'
import { useState, useRef } from 'react';
import config from '../../config.json';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  fileType: 'video' | 'thumbnail';
  currentUrl?: string;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export default function FileUpload({ 
  onUploadComplete, 
  fileType, 
  currentUrl, 
  accept,
  maxSize,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // Now stores uploaded MB
  const [totalSize, setTotalSize] = useState(0); // Total file size in MB
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [xhrInstance, setXhrInstance] = useState<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAccept = fileType === 'video' 
    ? 'video/mp4,video/mpeg,video/quicktime,video/x-msvideo'
    : 'image/jpeg,image/png,image/webp';

  const defaultMaxSize = fileType === 'video' ? 500 : 5; // MB

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File) => {
    const maxSizeBytes = (maxSize || defaultMaxSize) * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      throw new Error(`File too large. Maximum size is ${maxSize || defaultMaxSize}MB.`);
    }

    const acceptedTypes = (accept || defaultAccept).split(',').map(type => type.trim());
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
    }
  };

  const cancelUpload = () => {
    if (xhrInstance) {
      xhrInstance.abort();
      setUploading(false);
      setProgress(0);
      setTotalSize(0);
      setError('Upload canceled by user.');
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setError('');
      setProgress(0);
      setTotalSize((file.size / 1024 / 1024)); // Set total size in MB

      validateFile(file);

      if (fileType === 'thumbnail') {
        // Thumbnails still go through the API for local storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        onUploadComplete(result.url);
        setProgress(0);
        setTotalSize(0);
        setUploading(false);
        return;
      }

      // For videos: Get presigned URL and upload directly to S3
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      // Step 1: Get presigned URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { signedUrl, publicUrl } = await response.json();

      // Step 2: Upload directly to S3 using presigned URL
      const xhr = new XMLHttpRequest();
      setXhrInstance(xhr); // Store the instance for cancellation

      // Track upload progress with MB display
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadedMB = (event.loaded / 1024 / 1024).toFixed(1);
          const totalMB = (event.total / 1024 / 1024).toFixed(1);
          setProgress(parseFloat(uploadedMB)); // Store uploaded MB for display
        }
      });

      // Handle upload completion
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during S3 upload'));
        };
      });

      const bucketName = config.S3_BUCKET_NAME;
      if (!bucketName) {
        throw new Error('S3_BUCKET_NAME is not defined in config.json');
      }

      const acceleratedSignedUrl = signedUrl.replace(
        /https:\/\/.*\.s3\..*\.amazonaws\.com/,
        `https://${bucketName}.s3-accelerate.amazonaws.com`
      );

      // Upload directly to S3 using the accelerated endpoint
      xhr.open('PUT', acceleratedSignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

      await uploadPromise;

      // Upload complete
      onUploadComplete(publicUrl);
      setProgress(0);
      setTotalSize(0);
      setUploading(false);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    uploadFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept || defaultAccept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading {fileType}...</p>
              <p className="text-xs text-gray-500">
                {progress.toFixed(1)} MB / {totalSize.toFixed(1)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 text-gray-400">
              {fileType === 'video' ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drop your {fileType} here, or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {fileType === 'video' 
                  ? `Max ${maxSize || defaultMaxSize}MB • MP4, MPEG, MOV, AVI`
                  : `Max ${maxSize || defaultMaxSize}MB • JPEG, PNG, WebP`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current File Display */}
      {currentUrl && !uploading && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-green-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-green-800">
                {fileType === 'video' ? 'Video uploaded' : 'Thumbnail uploaded'}
              </span>
            </div>
            <button
              onClick={openFileDialog}
              className="text-xs text-green-700 hover:text-green-800 font-medium"
            >
              Replace
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-red-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Cancel Upload Button */}
      {uploading && (
        <div className="mt-3">
          <button
            onClick={cancelUpload}
            className="w-full bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition-all hover:bg-red-700"
          >
            Cancel Upload
          </button>
        </div>
      )}
    </div>
  );
}