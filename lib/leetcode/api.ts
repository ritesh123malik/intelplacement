// lib/leetcode/api.ts
// Service to fetch LeetCode data (using public APIs)

export interface LeetCodeProfile {
    username: string;
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    acceptanceRate: number;
    ranking: number;
    reputation: number;
    streak: number;
    contributions?: any;
    submissionCalendar?: any;
}

export interface LeetCodeSubmission {
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'accepted' | 'attempted';
    timestamp: number;
    runtime?: number;
    memory?: number;
    language?: string;
}

class LeetCodeAPI {
    private baseUrl = 'https://leetcode.com/graphql';

    // Fetch user profile using GraphQL
    async fetchUserProfile(username: string): Promise<LeetCodeProfile | null> {
        try {
            const response = await fetch('/api/leetcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (!response.ok || !data.data?.matchedUser) {
                return null;
            }

            const user = data.data.matchedUser;
            const stats = user.submitStats.acSubmissionNum;

            const calendar = JSON.parse(user.submissionCalendar || '{}');
            const streak = this.calculateStreak(calendar);

            return {
                username: user.username,
                totalSolved: stats.find((s: any) => s.difficulty === 'All')?.count || 0,
                easySolved: stats.find((s: any) => s.difficulty === 'Easy')?.count || 0,
                mediumSolved: stats.find((s: any) => s.difficulty === 'Medium')?.count || 0,
                hardSolved: stats.find((s: any) => s.difficulty === 'Hard')?.count || 0,
                acceptanceRate: this.calculateAcceptanceRate(user.submitStats),
                ranking: user.profile?.ranking || 0,
                reputation: user.profile?.reputation || 0,
                streak,
                contributions: user.contributions,
                submissionCalendar: user.submissionCalendar
            };
        } catch (error) {
            console.error('Error fetching LeetCode profile:', error);
            return null;
        }
    }

    // Fetch recent submissions
    async fetchRecentSubmissions(username: string, limit: number = 20): Promise<LeetCodeSubmission[]> {
        try {
            const query = `
        query recentSubmissions($username: String!, $limit: Int) {
          recentSubmissionList(username: $username, limit: $limit) {
            title
            titleSlug
            timestamp
            statusDisplay
            lang
            runtime
            memory
          }
        }
      `;

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    variables: { username, limit }
                })
            });

            const data = await response.json();

            if (!data.data?.recentSubmissionList) {
                return [];
            }

            // Fetch difficulty for each submission
            const submissions = await Promise.all(
                data.data.recentSubmissionList.map(async (sub: any) => {
                    const difficulty = await this.fetchQuestionDifficulty(sub.titleSlug);
                    return {
                        title: sub.title,
                        titleSlug: sub.titleSlug,
                        difficulty: difficulty || 'Medium',
                        status: sub.statusDisplay === 'Accepted' ? 'accepted' : 'attempted',
                        timestamp: parseInt(sub.timestamp) * 1000,
                        runtime: sub.runtime ? parseInt(sub.runtime) : undefined,
                        memory: sub.memory ? parseInt(sub.memory) : undefined,
                        language: sub.lang
                    };
                })
            );

            return submissions;
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return [];
        }
    }

    // Fetch question difficulty
    private async fetchQuestionDifficulty(titleSlug: string): Promise<string | null> {
        try {
            const query = `
        query questionTitle($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            difficulty
          }
        }
      `;

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    variables: { titleSlug }
                })
            });

            const data = await response.json();
            return data.data?.question?.difficulty || null;
        } catch {
            return null;
        }
    }

    // Calculate streak from submission calendar
    private calculateStreak(calendar: Record<string, number>): number {
        const timestamps = Object.keys(calendar).map(Number).sort((a, b) => a - b);
        if (timestamps.length === 0) return 0;

        let currentStreak = 1;
        let maxStreak = 1;
        const oneDay = 24 * 60 * 60 * 1000;

        for (let i = 1; i < timestamps.length; i++) {
            const diff = (timestamps[i] - timestamps[i - 1]) * 1000;
            if (diff <= oneDay * 1.5) { // Allow some flexibility
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        // Check if streak is current (last submission within last 2 days)
        const lastSubmission = timestamps[timestamps.length - 1] * 1000;
        const isCurrent = (Date.now() - lastSubmission) <= oneDay * 2;

        return isCurrent ? maxStreak : 0;
    }

    private calculateAcceptanceRate(submitStats: any): number {
        const total = submitStats.acSubmissionNum.find((s: any) => s.difficulty === 'All')?.submissions || 0;
        const accepted = submitStats.acSubmissionNum.find((s: any) => s.difficulty === 'All')?.count || 0;
        return total > 0 ? (accepted / total) * 100 : 0;
    }

    // Validate if username exists
    async validateUsername(username: string): Promise<boolean> {
        const profile = await this.fetchUserProfile(username);
        return profile !== null;
    }
}

export const leetcodeAPI = new LeetCodeAPI();
