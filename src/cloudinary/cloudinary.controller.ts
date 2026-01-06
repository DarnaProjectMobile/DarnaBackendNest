import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';

/**
 * Cloudinary Controller
 * Example endpoints demonstrating image upload to Cloudinary
 * 
 * KEY POINTS:
 * - Uses memoryStorage() - NO disk storage
 * - Returns Cloudinary URL immediately
 * - Works perfectly on Render (no timeouts)
 * - Images are permanently stored in Cloudinary
 */
@ApiTags('Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    /**
     * Upload a single image to Cloudinary
     * 
     * USAGE:
     * - POST /cloudinary/upload
     * - Content-Type: multipart/form-data
     * - Field name: 'file'
     * - File: Any image (jpg, png, webp, gif)
     * 
     * IMPORTANT:
     * - The field name MUST match 'file' in FileInterceptor('file')
     * - File is stored in memory (file.buffer) then uploaded to Cloudinary
     * - NO local disk storage
     * - Returns secure_url for immediate use
     */
    @Post('upload')
    @ApiOperation({
        summary: 'Upload image to Cloudinary',
        description: 'Uploads an image directly to Cloudinary cloud storage. No local disk storage is used. Returns a public URL that works permanently.'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Image file to upload',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (jpg, png, webp, gif)',
                },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Image uploaded successfully',
        schema: {
            example: {
                message: 'Image uploaded successfully',
                url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/uploads/abc123.jpg',
                publicId: 'uploads/abc123',
                format: 'jpg',
                width: 1920,
                height: 1080,
                bytes: 245678,
            }
        }
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No file provided' })
    @UseInterceptors(FileInterceptor('file', {
        // CRITICAL: Use memoryStorage to avoid disk writes
        // File will be available in file.buffer
        storage: require('multer').memoryStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max file size
        },
        fileFilter: (req, file, callback) => {
            // Only accept images
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Only image files are allowed'), false);
            }
            callback(null, true);
        },
    }))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        // COMMON MISTAKE #1: Not checking if file exists
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // COMMON MISTAKE #2: File buffer is undefined
        // This happens if you don't use memoryStorage()
        if (!file.buffer) {
            throw new BadRequestException('File buffer is empty. Ensure memoryStorage is configured.');
        }

        // Upload to Cloudinary
        const result = await this.cloudinaryService.uploadImage(file, 'uploads');

        // IMPORTANT: result.secure_url is the public image URL
        // This is what you save in your database
        return {
            message: 'Image uploaded successfully',
            url: result.secure_url, // ✅ Use this URL in your frontend/mobile app
            publicId: result.public_id, // Save this to delete the image later
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
        };
    }

    /**
     * Upload image to a specific folder
     * Example: Upload user profile image
     */
    @Post('upload/profile')
    @ApiOperation({ summary: 'Upload user profile image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', {
        storage: require('multer').memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for profiles
    }))
    async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const result = await this.cloudinaryService.uploadImage(file, 'users');

        return {
            message: 'Profile image uploaded successfully',
            url: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Upload chat image
     */
    @Post('upload/chat')
    @ApiOperation({ summary: 'Upload chat image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', {
        storage: require('multer').memoryStorage(),
    }))
    async uploadChatImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const result = await this.cloudinaryService.uploadImage(file, 'chat');

        return {
            message: 'Chat image uploaded successfully',
            url: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Upload visit confirmation image
     */
    @Post('upload/visite')
    @ApiOperation({ summary: 'Upload visit confirmation image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', {
        storage: require('multer').memoryStorage(),
    }))
    async uploadVisiteImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const result = await this.cloudinaryService.uploadImage(file, 'visites');

        return {
            message: 'Visit image uploaded successfully',
            url: result.secure_url,
            publicId: result.public_id,
        };
    }
}
