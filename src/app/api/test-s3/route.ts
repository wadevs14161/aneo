import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getCurrentProfile } from '@/lib/auth';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('S3 Test: Testing AWS connection...');
    console.log('S3 Test: Config:', {
      region: process.env.AWS_REGION,
      bucket: process.env.S3_BUCKET_NAME,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    });

    // Test connection by listing objects (limited to 1)
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME!,
      MaxKeys: 1
    });

    const result = await s3Client.send(listCommand);
    
    console.log('S3 Test: Connection successful!');
    
    return NextResponse.json({
      success: true,
      message: 'AWS S3 connection successful',
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      objectCount: result.KeyCount || 0
    });

  } catch (error) {
    console.error('S3 Test Error:', error);
    
    let errorMessage = 'S3 connection test failed';
    
    if (error instanceof Error) {
      console.error('S3 Test Error details:', {
        message: error.message,
        name: error.name
      });
      
      if (error.message.includes('InvalidAccessKeyId')) {
        errorMessage = 'Invalid AWS Access Key ID';
      } else if (error.message.includes('SignatureDoesNotMatch')) {
        errorMessage = 'Invalid AWS Secret Access Key';
      } else if (error.message.includes('NoSuchBucket')) {
        errorMessage = 'S3 bucket not found';
      } else if (error.message.includes('AccessDenied')) {
        errorMessage = 'Access denied to S3 bucket';
      } else {
        errorMessage = `S3 error: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        bucket: process.env.S3_BUCKET_NAME,
        region: process.env.AWS_REGION
      },
      { status: 500 }
    );
  }
}