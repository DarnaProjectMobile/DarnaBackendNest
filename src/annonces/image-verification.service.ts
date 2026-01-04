import { Injectable, BadRequestException } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu'; // Register CPU backend for Node.js
import * as mobilenet from '@tensorflow-models/mobilenet';
import { createCanvas, loadImage } from 'canvas';
import { readFileSync } from 'fs';

@Injectable()
export class ImageVerificationService {
    private model: mobilenet.MobileNet | null = null;
    private backendInitialized = false;
    private readonly houseRelatedLabels = [
        'apartment building',
        'apartment',
        'house',
        'palace',
        'monastery',
        'church',
        'mosque',
        'library',
        'prison',
        'restaurant',
        'dining room',
        'kitchen',
        'bedroom',
        'bathroom',
        'living room',
        'salon',
        'barbershop',
        'dining table',
        'desk',
        'wardrobe',
        'bathtub',
        'shower',
        'sofa',
        'armchair',
        'table',
        'door',
        'window',
        'doorframe',
        'window screen',
        'window shade',
        'cabin',
        'studio couch',
        'studio',
        'home theater',
        'home cinema',
    ];

    /**
     * Initialize TensorFlow.js backend
     */
    private async initializeBackend(): Promise<void> {
        if (this.backendInitialized) {
            return;
        }

        try {
            // Set CPU backend (registered via @tensorflow/tfjs-backend-cpu import)
            await tf.setBackend('cpu');
            await tf.ready();
            this.backendInitialized = true;
            console.log('TensorFlow.js backend initialized:', tf.getBackend());
        } catch (error) {
            console.error('Failed to initialize TensorFlow.js CPU backend:', error);
            // Try to use whatever backend is available
            try {
                await tf.ready();
                const backend = tf.getBackend();
                this.backendInitialized = true;
                console.log('TensorFlow.js backend initialized (fallback):', backend);
            } catch (e) {
                console.error('Failed to initialize TensorFlow.js:', e);
                throw new Error('Failed to initialize TensorFlow.js backend. The CPU backend should be available via @tensorflow/tfjs-backend-cpu.');
            }
        }
    }

    /**
     * Initialize and load the MobileNet model
     */
    async loadModel(): Promise<void> {
        if (this.model) {
            return; // Model already loaded
        }

        try {
            // Initialize backend first
            await this.initializeBackend();

            // Load MobileNet model (version 2 with alpha 1.0)
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0,
            });
            console.log('MobileNet model loaded successfully');
        } catch (error) {
            console.error('Error loading MobileNet model:', error);
            throw new Error('Failed to load image classification model');
        }
    }

    /**
     * Verify if an image is a house-related image
     * @param imagePath - Path to the image file
     * @returns true if the image is house-related, false otherwise
     */
    async verifyHouseImage(imagePath: string): Promise<boolean> {
        try {
            // Ensure model is loaded
            if (!this.model) {
                await this.loadModel();
            }

            // Load image using canvas
            const imageBuffer = readFileSync(imagePath);
            const image = await loadImage(imageBuffer);

            // Create canvas and draw image (resize to 224x224 for MobileNet)
            const canvas = createCanvas(224, 224);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, 224, 224);

            // Get predictions from MobileNet (pass canvas element)
            const predictions = await this.model!.classify(canvas as any);

            // Check if any prediction matches house-related labels
            const isHouseImage = predictions.some((prediction) => {
                const label = prediction.className.toLowerCase();
                return this.houseRelatedLabels.some((houseLabel) =>
                    label.includes(houseLabel.toLowerCase()),
                );
            });

            // If confidence is low, also check top predictions with lower threshold
            if (!isHouseImage && predictions.length > 0) {
                const topPrediction = predictions[0];
                // Check if the top prediction has reasonable confidence and matches house labels
                if (topPrediction.probability > 0.1) {
                    const label = topPrediction.className.toLowerCase();
                    const matchesHouseLabel = this.houseRelatedLabels.some((houseLabel) =>
                        label.includes(houseLabel.toLowerCase()),
                    );
                    if (matchesHouseLabel) {
                        return true;
                    }
                }
            }

            return isHouseImage;
        } catch (error) {
            console.error('Error verifying house image:', error);
            throw new BadRequestException(
                'Failed to process image. Please ensure it is a valid image file.',
            );
        }
    }

    /**
     * Verify multiple images
     * @param imagePaths - Array of image file paths
     * @returns Array of verification results
     */
    async verifyHouseImages(imagePaths: string[]): Promise<boolean[]> {
        const results = await Promise.all(
            imagePaths.map((path) => this.verifyHouseImage(path)),
        );
        return results;
    }

    /**
     * Verify if all images are house-related
     * @param imagePaths - Array of image file paths
     * @returns true if all images are house-related, false otherwise
     */
    async verifyAllHouseImages(imagePaths: string[]): Promise<boolean> {
        const results = await this.verifyHouseImages(imagePaths);
        return results.every((result) => result === true);
    }
}
