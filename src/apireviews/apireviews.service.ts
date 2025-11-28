import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ApireviewsService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });
    }
  }

  // Main method called by the controller
  async analyzeReview(text: string) {
    // Check if OpenAI is configured
    if (!this.openai) {
      throw new InternalServerErrorException('OpenAI API key is not configured');
    }

    try {
      const analysis = await this.analyzeTunisianReview(text);

      // If toxic, block & propose rephrase
      if (analysis.should_block) {
        return {
          status: 'blocked',
          message: 'Avis trop agressif ou insultant.',
          suggestedRephrase: analysis.suggested_rephrase,
          analysis,
        };
      }

      // Otherwise accept it
      return {
        status: 'accepted',
        analysis,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to analyze review: ${error.message}`);
    }
  }

  // Function that calls OpenAI with Tounsi prompt
  private async analyzeTunisianReview(reviewText: string) {
    if (!this.openai) {
      throw new Error('OpenAI is not configured');
    }

    const prompt = `
Tu es une IA pour une plateforme de logement étudiant en Tunisie.

IMPORTANT :
- Les avis sont en dialecte tunisien (Derja / Tounsi), souvent écrits en Arabizi.
- Comprends les insultes, l’ironie, les chiffres (5=kh, 7=h, 3=3yn).
- DOIT répondre UNIQUEMENT en JSON valide.

Retourne exactement :

{
  "sentiment_label": "",
  "sentiment_score": number,
  "summary": "",
  "landlord_risk_level": "",
  "satisfaction_score": number,
  "safety_score": number,
  "is_toxic": boolean,
  "toxicity_level": "",
  "should_block": boolean,
  "suggested_rephrase": ""
}

Règles pour should_block:
- doit être TRUE seulement si phrases TRÈS insultantes, haineuses, vulgaires
- critiques normales comme "dar 5ayba", "ma ya7chemch", "mouch behya" sont AUTORISÉES

Avis étudiant :
"${reviewText}"
`;

    const response = await this.openai.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: 'You output ONLY JSON.' },
        { role: 'user', content: prompt },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI response content is null');
    }
    return JSON.parse(content);
  }
}
