import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../reviews/entities/review.entity';
import { ReviewSummaryResponse } from './dto/summary-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReviewsSummaryService {
    private readonly openRouterApiKey: string;
    private readonly openRouterBaseUrl = 'https://openrouter.ai/api/v1';

    constructor(
        @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
        private readonly configService: ConfigService,
    ) {
        this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    }

    async generateSummary(propertyId: string): Promise<ReviewSummaryResponse> {
        // Fetch reviews from database using ObjectId
        const reviews = await this.reviewModel.find({ property: new Types.ObjectId(propertyId) });

        if (reviews.length === 0) {
            throw new NotFoundException('No reviews found for this property');
        }

        // If no API key, fall back to rule-based analysis
        if (!this.openRouterApiKey) {
            return this.generateRuleBasedSummary(reviews);
        }

        // Use OpenRouter AI for analysis
        try {
            return await this.generateAISummary(reviews);
        } catch (error) {
            console.error('OpenRouter API error, falling back to rule-based:', error.message);
            return this.generateRuleBasedSummary(reviews);
        }
    }

    private async generateAISummary(reviews: any[]): Promise<ReviewSummaryResponse> {
        const comments = reviews.map(r => r.comment);
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        // Build the prompt
        const systemPrompt = `You are an AI that analyzes multiple property reviews and produces a structured summary in JSON only.

INPUT:
You will receive an array of reviews for a rental property. Each review is a plain text string. Your task is to analyze all reviews together.

INSTRUCTIONS:
- Output ONLY valid JSON.
- Follow exactly the structure shown below.
- Do NOT add commentary outside JSON.
- Perform sentiment analysis, frequency analysis, pros/cons extraction, and improvement suggestions.
- Identify common themes by detecting the most repeated keywords.
- Identify pros and cons by summarizing positive and negative review parts.

OUTPUT FORMAT (MANDATORY):

{
  "summary": "Short written summary that combines all reviews. Include total reviews, average sentiment (categorical + numeric), common topics mentioned, and general impression.",
  "pros": [
    "List of short user-friendly pros extracted from the reviews"
  ],
  "cons": [
    "List of short user-friendly cons extracted from the reviews"
  ],
  "sentimentScore": number (from -1 to 1),
  "commonThemes": [
    "keywords or topics that appear frequently"
  ],
  "improvements": [
    "Suggestions for property improvements"
  ]
}

RULES:
- sentimentScore must be between -1 (very negative), 0 (neutral), and 1 (very positive)
- commonThemes should contain concise keywords only
- pros and cons must be written as bullet-style sentences
- JSON must be valid and parseable`;

        const userPrompt = `USER REVIEWS (${reviews.length} total, average rating: ${avgRating.toFixed(1)}/5):

${comments.map((comment, i) => `${i + 1}. ${comment}`).join('\n\n')}

Analyze these reviews and return ONLY the JSON response.`;

        // Call OpenRouter API
        const response = await fetch(`${this.openRouterBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://darna-app.com',
                'X-Title': 'Darna Review Analyzer',
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Parse AI response
        let parsedResponse: ReviewSummaryResponse;
        try {
            parsedResponse = JSON.parse(aiResponse);
        } catch (parseError) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                parsedResponse = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        return parsedResponse;
    }

    private generateRuleBasedSummary(reviews: any[]): ReviewSummaryResponse {
        const comments = reviews.map(r => r.comment);

        // --- SIMPLE SENTIMENT SCORING ---
        const positiveWords = ['good', 'great', 'excellent', 'clean', 'amazing', 'perfect', 'friendly', 'nice', 'beautiful', 'comfortable', 'spacious', 'quiet', 'helpful', 'recommend', 'love', 'wonderful'];
        const negativeWords = ['bad', 'dirty', 'poor', 'terrible', 'noisy', 'rude', 'small', 'uncomfortable', 'broken', 'old', 'expensive', 'disappointing', 'worst', 'avoid'];

        let score = 0;
        const prosSet = new Set<string>();
        const consSet = new Set<string>();

        for (const comment of comments) {
            const text = comment.toLowerCase();

            positiveWords.forEach(w => {
                if (text.includes(w)) {
                    prosSet.add(comment);
                    score++;
                }
            });

            negativeWords.forEach(w => {
                if (text.includes(w)) {
                    consSet.add(comment);
                    score--;
                }
            });
        }

        const pros = Array.from(prosSet).slice(0, 5);
        const cons = Array.from(consSet).slice(0, 5);
        const sentimentScore = Math.max(-1, Math.min(1, score / comments.length));

        // --- Extract Common Themes ---
        const themeCount: Record<string, number> = {};
        const themes = ['clean', 'location', 'host', 'price', 'quiet', 'wifi', 'kitchen', 'bathroom', 'bedroom', 'parking', 'transport', 'neighborhood', 'view', 'amenities'];

        themes.forEach(theme => {
            const count = comments.filter(c => c.toLowerCase().includes(theme)).length;
            if (count > 0) themeCount[theme] = count;
        });

        const commonThemes = Object.keys(themeCount)
            .sort((a, b) => themeCount[b] - themeCount[a])
            .slice(0, 5);

        // --- Suggested Improvements ---
        const improvements: string[] = [];
        if (cons.length > 0) improvements.push('Address issues mentioned in negative feedback');
        if (themeCount['wifi'] && consSet.size > 0) improvements.push('Improve Wi-Fi quality and reliability');
        if (themeCount['clean'] && consSet.size > 0) improvements.push('Enhance cleaning consistency');
        if (themeCount['noisy'] || themeCount['quiet']) improvements.push('Consider soundproofing or noise reduction measures');
        if (sentimentScore < 0) improvements.push('Focus on overall customer satisfaction and service quality');
        if (improvements.length === 0) improvements.push('Maintain current high standards');

        // --- Summary Paragraph ---
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const sentimentText = sentimentScore > 0.3 ? 'positive' : sentimentScore < -0.3 ? 'negative' : 'mixed';

        const summary = `
This property has ${reviews.length} review${reviews.length > 1 ? 's' : ''} with an average rating of ${avgRating.toFixed(1)}/5.
The overall sentiment is ${sentimentText} (score: ${sentimentScore.toFixed(2)}).
${commonThemes.length > 0 ? `Guests frequently mention: ${commonThemes.join(', ')}.` : 'Various topics are discussed in the reviews.'}
${pros.length > 0 ? `Positive highlights include cleanliness, location, and hospitality.` : ''}
${cons.length > 0 ? `Some areas for improvement have been noted.` : ''}
`.trim();

        return {
            summary,
            pros,
            cons,
            sentimentScore,
            commonThemes,
            improvements: improvements.slice(0, 5),
        };
    }
}
