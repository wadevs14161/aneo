import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@/lib/supabase/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import config from '../../../../config.json';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Starting upload process...');
    
    // Check if user is admin using server-side auth
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('Upload API: No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('Upload API: User profile:', { id: profile?.id, role: profile?.role });
    
    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      console.log('Upload API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string; // 'video' or 'thumbnail'

    console.log('Upload API: Received file:', { 
      name: file?.name, 
      size: file?.size, 
      type: file?.type, 
      fileType 
    });

    if (!file) {
      console.log('Upload API: No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (fileType === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid video format. Please upload MP4, MPEG, MOV, or AVI files.' 
      }, { status: 400 });
    }
    
    if (fileType === 'thumbnail' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid image format. Please upload JPEG, PNG, or WebP files.' 
      }, { status: 400 });
    }

    // Validate file size (500MB for videos, 5MB for images)
    const maxVideoSize = 500 * 1024 * 1024; // 500MB
    const maxImageSize = 5 * 1024 * 1024;   // 5MB
    
    if (fileType === 'video' && file.size > maxVideoSize) {
      return NextResponse.json({ 
        error: 'Video file too large. Maximum size is 500MB.' 
      }, { status: 400 });
    }
    
    if (fileType === 'thumbnail' && file.size > maxImageSize) {
      return NextResponse.json({ 
        error: 'Image file too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    
    // Convert file to buffer
    console.log('Upload API: Converting file to buffer...');
    const startBufferTime = Date.now();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const bufferTime = Date.now() - startBufferTime;
    console.log('Upload API: File converted to buffer in', bufferTime, 'ms, size:', buffer.length);

    let publicUrl: string;
    let fileName: string;

    if (fileType === 'thumbnail') {
      // Store thumbnails locally in courses directory
      fileName = `${timestamp}-${randomId}.${fileExtension}`;
      const coursesDir = join(process.cwd(), 'public', 'courses');
      const filePath = join(coursesDir, fileName);

      console.log('Upload API: Storing thumbnail locally:', filePath);

      // Ensure courses directory exists
      await mkdir(coursesDir, { recursive: true });
      
      // Save file locally
      await writeFile(filePath, buffer);
      
      // Return local URL
      publicUrl = `/courses/${fileName}`;
      console.log('Upload API: Thumbnail saved locally successfully!');

    } else {
      // For videos, return presigned URL for direct S3 upload
      fileName = `videos/${timestamp}-${randomId}.${fileExtension}`;
      
      console.log('Upload API: Generating presigned URL for:', fileName);

      // Create presigned URL for direct upload
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileName,
        ContentType: file.type,
        Metadata: {
          'uploaded-by': profile.id,
          'upload-timestamp': timestamp.toString(),
          'original-filename': file.name,
        },
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
      publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      // Return presigned URL for client-side upload
      return NextResponse.json({
        success: true,
        uploadType: 'presigned',
        signedUrl,
        publicUrl,
        filename: fileName,
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('S3 upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Upload failed. Please try again.';
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Check for specific AWS errors
      if (error.message.includes('InvalidAccessKeyId')) {
        errorMessage = 'AWS credentials are invalid. Please check your access key.';
      } else if (error.message.includes('SignatureDoesNotMatch')) {
        errorMessage = 'AWS credentials signature mismatch. Please check your secret key.';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'S3 bucket not found. Please check your bucket name.';
      } else if (error.message.includes('AccessDenied')) {
        errorMessage = 'Access denied to S3 bucket. Please check your permissions.';
      } else if (error.message.includes('NetworkingError')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        // Include the actual error message for debugging
        errorMessage = `Upload failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Generate presigned URL for large file uploads (alternative method)
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin using server-side auth
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Only allow presigned URLs for video uploads (thumbnails are handled locally)
    if (fileType !== 'video') {
      return NextResponse.json({ 
        error: 'Presigned URLs are only supported for video uploads. Thumbnails are handled locally.' 
      }, { status: 400 });
    }

    // Generate unique filename (consistent with POST route)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `videos/${timestamp}-${randomId}.${fileExtension}`;

    // Create presigned URL for upload (removed ACL for consistency)
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: uniqueFileName,
      ContentType: 'video/mp4', // More specific content type
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    // Construct the public URL that will be available after upload
    const publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    return NextResponse.json({
      signedUrl,
      publicUrl,
      fileName: uniqueFileName,
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}