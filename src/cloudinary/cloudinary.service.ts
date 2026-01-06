import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary Service
 * Handles image uploads, deletions, and URL generation
 * All operations are cloud-based - no local disk storage
 */
@Injectable()
export class CloudinaryService {
    /**
     * Upload file buffer to Cloudinary
     * @param file - Express.Multer.File object from multer
     * @param folder - Cloudinary folder name (e.g., 'users', 'chat', 'visites')
     * @returns Promise<UploadApiResponse> - Contains secure_url, public_id, etc.
     */
    async uploadImage(
        file: Express.Multer.File,
        folder: string = 'uploads',
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const resourceType = this.getResourceType(file.mimetype);
            const allowedFormats = this.getAllowedFormats(resourceType);
            
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder, // Organize images in folders
                    allowed_formats: allowedFormats,
                    resource_type: resourceType,
                    transformation: resourceType === 'image' ? [
                        { quality: 'auto' }, // Automatic quality optimization
                        { fetch_format: 'auto' }, // Automatic format selection
                    ] : undefined, // No transformations for non-image files
                },
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Upload failed: No result returned'));
                    }
                },
            );

            // Write the file buffer to the upload stream
            uploadStream.end(file.buffer);
        });
    }

    /**
     * Determine resource type based on file mimetype
     * @param mimetype - File mimetype
     * @returns Resource type for Cloudinary
     */
    private getResourceType(mimetype: string): 'image' | 'video' | 'raw' | 'auto' {
        if (mimetype.startsWith('image/')) {
            return 'image';
        } else if (mimetype === 'application/pdf') {
            return 'raw'; // PDFs are treated as raw files in Cloudinary
        } else {
            return 'auto'; // Auto-detect for other file types
        }
    }

    /**
     * Get allowed formats based on resource type
     * @param resourceType - Cloudinary resource type
     * @returns Array of allowed formats
     */
    private getAllowedFormats(resourceType: string): string[] {
        if (resourceType === 'image') {
            return ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        } else if (resourceType === 'raw') {
            return ['pdf'];
        } else {
            return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']; // Allow both images and PDFs
        }
    }

    /**
     * Delete file from Cloudinary by public_id
     * @param publicId - Cloudinary public_id (returned from upload)
     * @returns Promise with deletion result
     */
    async deleteImage(publicId: string): Promise<any> {
        return cloudinary.uploader.destroy(publicId);
    }

    /**
     * Get optimized image URL from Cloudinary
     * @param publicId - Cloudinary public_id
     * @param transformations - Optional transformations (width, height, crop, etc.)
     * @returns Optimized image URL
     */
    getImageUrl(publicId: string, transformations?: any): string {
        return cloudinary.url(publicId, {
            secure: true,
            ...transformations,
        });
    }
}