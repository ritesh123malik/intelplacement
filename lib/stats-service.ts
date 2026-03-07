import { supabase } from '@/lib/supabase';
import { debug } from './debug';

class StatsService {

    // Get all stats for a user
    async getUserStats(userId: string) {
        debug.log('Stats', 'Fetching stats for user', userId);

        try {
            // 1. Get all cards
            const { data: cards, error: cardsError } = await supabase
                .from('spaced_repetition_cards')
                .select('*')
                .eq('user_id', userId);

            if (cardsError) {
                debug.error('Stats', 'Error fetching cards', cardsError);
                return this.getDefaultStats();
            }

            // 2. Get all reviews
            const { data: reviews, error: reviewsError } = await supabase
                .from('spaced_repetition_reviews')
                .select('*')
                .eq('user_id', userId)
                .order('reviewed_at', { ascending: false });

            if (reviewsError) {
                debug.error('Stats', 'Error fetching reviews', reviewsError);
            }

            // 3. Get streak
            const { data: streak, error: streakError } = await supabase
                .from('user_streaks')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            // Calculate stats
            const totalCards = cards?.length || 0;

            // Calculate due cards (next_review_at <= now)
            const now = new Date();
            const dueCards = cards?.filter(card => {
                if (!card.next_review_at) return true;
                return new Date(card.next_review_at) <= now;
            }).length || 0;

            // Calculate retention rate
            let retentionRate = 0;
            if (reviews && reviews.length > 0) {
                const correctReviews = reviews.filter(r => r.rating >= 2).length;
                retentionRate = Math.round((correctReviews / reviews.length) * 100);
            }

            const stats = {
                totalCards,
                dueCount: dueCards,
                retentionRate,
                streak: streak || {
                    current_streak: 0,
                    longest_streak: 0,
                    last_review_date: null,
                    total_reviews: reviews?.length || 0
                },
                recentReviews: reviews?.slice(0, 5) || []
            };

            debug.success('Stats', 'Stats calculated', stats);
            return stats;

        } catch (error) {
            debug.error('Stats', 'Unexpected error', error);
            return this.getDefaultStats();
        }
    }

    // Add a question to review queue
    async addToReview(userId: string, questionId: string) {
        debug.log('Stats', 'Adding question to review', { userId, questionId });

        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from('spaced_repetition_cards')
                .select('id')
                .eq('user_id', userId)
                .eq('question_id', questionId)
                .maybeSingle();

            if (existing) {
                debug.log('Stats', 'Question already in review queue');
                return { success: true, message: 'Already in queue' };
            }

            // Add new card
            const { data, error } = await supabase
                .from('spaced_repetition_cards')
                .insert({
                    user_id: userId,
                    question_id: questionId,
                    next_review_at: new Date().toISOString(), // Due now
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                debug.error('Stats', 'Error adding card', error);
                return { success: false, error: error.message };
            }

            debug.success('Stats', 'Question added to review', data);
            return { success: true, data };

        } catch (error) {
            debug.error('Stats', 'Unexpected error adding card', error);
            return { success: false, error: 'Unexpected error' };
        }
    }

    // Submit a review
    async submitReview(userId: string, cardId: string, questionId: string, rating: number) {
        debug.log('Stats', 'Submitting review', { userId, cardId, rating });

        try {
            // Get current card
            const { data: card, error: cardError } = await supabase
                .from('spaced_repetition_cards')
                .select('*')
                .eq('id', cardId)
                .eq('user_id', userId)
                .single();

            if (cardError) {
                debug.error('Stats', 'Card not found', cardError);
                return { success: false, error: 'Card not found' };
            }

            // Calculate next review date based on rating
            const nextDate = new Date();

            // Simple interval calculation
            switch (rating) {
                case 0: // Again
                    nextDate.setHours(nextDate.getHours() + 1); // 1 hour
                    break;
                case 1: // Hard
                    nextDate.setDate(nextDate.getDate() + 1); // 1 day
                    break;
                case 2: // Good
                    nextDate.setDate(nextDate.getDate() + 3); // 3 days
                    break;
                case 3: // Easy
                    nextDate.setDate(nextDate.getDate() + 7); // 7 days
                    break;
            }

            // Update card
            const { error: updateError } = await supabase
                .from('spaced_repetition_cards')
                .update({
                    review_count: (card.review_count || 0) + 1,
                    last_reviewed_at: new Date().toISOString(),
                    next_review_at: nextDate.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', cardId);

            if (updateError) {
                debug.error('Stats', 'Error updating card', updateError);
                return { success: false, error: updateError.message };
            }

            // Record review
            const { error: reviewError } = await supabase
                .from('spaced_repetition_reviews')
                .insert({
                    card_id: cardId,
                    user_id: userId,
                    question_id: questionId,
                    rating: rating,
                    reviewed_at: new Date().toISOString()
                });

            if (reviewError) {
                debug.error('Stats', 'Error recording review', reviewError);
            }

            // Update streak
            await this.updateStreak(userId);

            debug.success('Stats', 'Review submitted successfully');

            // Get updated stats
            const updatedStats = await this.getUserStats(userId);

            return {
                success: true,
                nextReviewDate: nextDate,
                stats: updatedStats
            };

        } catch (error) {
            debug.error('Stats', 'Unexpected error in submitReview', error);
            return { success: false, error: 'Unexpected error' };
        }
    }

    // Update streak
    async updateStreak(userId: string) {
        const today = new Date().toISOString().split('T')[0];

        // Get current streak
        const { data: streak } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!streak) {
            // Create new streak
            await supabase
                .from('user_streaks')
                .insert({
                    user_id: userId,
                    current_streak: 1,
                    longest_streak: 1,
                    last_review_date: today,
                    total_reviews: 1
                });
        } else {
            // Update existing streak
            const lastDate = streak.last_review_date;
            let newStreak = streak.current_streak;

            if (lastDate) {
                const last = new Date(lastDate);
                const current = new Date(today);
                const diffDays = Math.round((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    newStreak += 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }

            await supabase
                .from('user_streaks')
                .update({
                    current_streak: newStreak,
                    longest_streak: Math.max(streak.longest_streak, newStreak),
                    last_review_date: today,
                    total_reviews: (streak.total_reviews || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);
        }
    }

    // Get default stats
    getDefaultStats() {
        return {
            totalCards: 0,
            dueCount: 0,
            retentionRate: 0,
            streak: {
                current_streak: 0,
                longest_streak: 0,
                last_review_date: null,
                total_reviews: 0
            },
            recentReviews: []
        };
    }
}

export const statsService = new StatsService();
