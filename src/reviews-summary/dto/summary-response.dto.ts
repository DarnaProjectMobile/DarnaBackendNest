export class ReviewSummaryResponse {
    summary: string;
    pros: string[];
    cons: string[];
    sentimentScore: number; // -1 → 1
    commonThemes: string[];
    improvements: string[];
}
