import { supabase } from '@/lib/supabase';

export interface ReviewRating {
    value: 0 | 1 | 2 | 3;
    label: string;
    color: string;
    icon: string;
    description: string;
}

export const REVIEW_RATINGS: ReviewRating[] = [
    {
        value: 0,
        label: 'Again',
        color: 'red',
        icon: '🔴',
        description: 'Completely forgot - start over'
    },
    {
        value: 1,
        label: 'Hard',
        color: 'orange',
        icon: '🟠',
        description: 'Remembered with difficulty'
    },
    {
        value: 2,
        label: 'Good',
        color: 'green',
        icon: '🟢',
        description: 'Correct with some effort'
    },
    {
        value: 3,
        label: 'Easy',
        color: 'blue',
        icon: '🔵',
        description: 'Effortless recall'
    }
];

export interface DueCard {
    id: string;
    question_id: string;
    question: string;
    difficulty: string;
    company: string;
    leetcode_url: string;
    ease_factor: number;
    interval: number;
    stage: number;
    review_count: number;
    lapses: number;
    last_reviewed_at: string | null;
}

class SpacedRepetitionService {

    // Initialize settings for a new user
    async initializeUserSettings(userId: string) {
        console.log('Initializing settings for user:', userId);

        // First check if settings already exist
        const { data: existingSettings, error: checkError } = await supabase
            .from('spaced_repetition_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (checkError) {
            console.error('Error checking existing settings:', {
                message: checkError.message,
                details: checkError.details,
                hint: checkError.hint,
                code: checkError.code
            });
        }

        if (existingSettings) {
            console.log('Settings already exist for user:', userId);
            return existingSettings;
        }

        // Insert new settings
        const { data, error } = await supabase
            .from('spaced_repetition_settings')
            .insert({
                user_id: userId,
                daily_review_limit: 20,
                new_cards_per_day: 10
            })
            .select()
            .single();

        if (error) {
            console.error('Error initializing settings:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });

            // Try with a different approach - upsert instead of insert
            console.log('Trying upsert as fallback...');
            const { data: upsertData, error: upsertError } = await supabase
                .from('spaced_repetition_settings')
                .upsert({
                    user_id: userId,
                    daily_review_limit: 20,
                    new_cards_per_day: 10
                })
                .select()
                .single();

            if (upsertError) {
                console.error('Upsert also failed:', {
                    message: upsertError.message,
                    details: upsertError.details,
                    hint: upsertError.hint,
                    code: upsertError.code
                });
            } else {
                console.log('Upsert succeeded:', upsertData);
                return upsertData;
            }
        } else {
            console.log('Settings initialized successfully:', data);
        }

        // Initialize streak regardless
        await this.initializeStreak(userId);

        return data;
    }

    // Add this new method
    async initializeStreak(userId: string) {
        const { data: existingStreak } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!existingStreak) {
            const { error } = await supabase
                .from('user_streaks')
                .insert({
                    user_id: userId,
                    current_streak: 0,
                    longest_streak: 0,
                    last_review_date: null,
                    total_reviews: 0
                });

            if (error) {
                console.error('Error initializing streak:', error);
            }
        }
    }

    // Get due cards for a user
    async getDueCards(userId: string, limit?: number): Promise<DueCard[]> {
        // Get user settings
        const { data: settings } = await supabase
            .from('spaced_repetition_settings')
            .select('daily_review_limit, new_cards_per_day')
            .eq('user_id', userId)
            .single();

        const reviewLimit = limit || settings?.daily_review_limit || 20;

        // Get due cards (cards where next_review_at <= now)
        const { data: dueCards, error } = await supabase
            .from('spaced_repetition_cards')
            .select(`
        id,
        question_id,
        ease_factor,
        interval,
        stage,
        review_count,
        lapses,
        last_reviewed_at,
        questions!inner (
          question,
          difficulty,
          source_url,
          companies!inner (
            name
          )
        )
      `)
            .eq('user_id', userId)
            .lte('next_review_at', new Date().toISOString())
            .order('next_review_at', { ascending: true })
            .limit(reviewLimit);

        if (error) {
            console.error('Error fetching due cards:', error);
            return [];
        }

        // Format the response
        return (dueCards || []).map((card: any) => ({
            id: card.id,
            question_id: card.question_id,
            question: card.questions.question,
            difficulty: card.questions.difficulty,
            company: card.questions.companies.name,
            leetcode_url: card.questions.source_url,
            ease_factor: card.ease_factor,
            interval: card.interval,
            stage: card.stage,
            review_count: card.review_count,
            lapses: card.lapses,
            last_reviewed_at: card.last_reviewed_at
        }));
    }

    // Get count of due cards
    async getDueCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('spaced_repetition_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .lte('next_review_at', new Date().toISOString());

        if (error) return 0;
        return count || 0;
    }

    // Add a question to spaced repetition
    async addCard(userId: string, questionId: string) {
        // Check if card already exists
        const { data: existing } = await supabase
            .from('spaced_repetition_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('question_id', questionId)
            .single();

        if (existing) {
            return { success: false, message: 'Already in your review queue' };
        }

        // Add new card
        const { data, error } = await supabase
            .from('spaced_repetition_cards')
            .insert({
                user_id: userId,
                question_id: questionId,
                next_review_at: new Date().toISOString() // Due immediately
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding card:', error);
            return { success: false, message: error.message };
        }

        return { success: true, card: data };
    }

    // Submit a review
    async submitReview(
        userId: string,
        cardId: string,
        questionId: string,
        rating: 0 | 1 | 2 | 3,
        responseTimeMs?: number
    ) {
        console.log('📝 Submitting review:', { userId, cardId, rating });

        // Get the card
        const { data: card, error: cardError } = await supabase
            .from('spaced_repetition_cards')
            .select('*')
            .eq('id', cardId)
            .eq('user_id', userId)
            .single();

        if (cardError || !card) {
            console.error('❌ Card not found:', cardError);
            return { success: false, message: 'Card not found' };
        }

        console.log('✅ Current card state:', card);

        // Calculate new intervals based on SM-2 algorithm
        const result = this.calculateNextReview(card, rating);
        console.log('📊 Calculated next review:', result);

        // Update the card
        const { error: updateError, data: updatedCard } = await supabase
            .from('spaced_repetition_cards')
            .update({
                ease_factor: result.easeFactor,
                interval: result.interval,
                stage: result.stage,
                review_count: card.review_count + 1,
                lapses: result.lapses,
                last_reviewed_at: new Date().toISOString(),
                next_review_at: result.nextReviewDate,
                updated_at: new Date().toISOString()
            })
            .eq('id', cardId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Failed to update card:', updateError);
            return { success: false, message: updateError.message };
        }

        console.log('✅ Card updated successfully:', updatedCard);

        // Record the review
        const { error: reviewError } = await supabase
            .from('spaced_repetition_reviews')
            .insert({
                card_id: cardId,
                user_id: userId,
                question_id: questionId,
                rating: rating,
                response_time_ms: responseTimeMs,
                previous_interval: card.interval,
                new_interval: result.interval
            });

        if (reviewError) {
            console.error('❌ Failed to record review:', reviewError);
        } else {
            console.log('✅ Review recorded successfully');
        }

        // Update streak
        await this.updateStreak(userId);

        // Get updated stats to verify
        const updatedStats = await this.getStats(userId);
        console.log('📊 Updated stats:', updatedStats);

        return {
            success: true,
            nextReviewDate: result.nextReviewDate,
            interval: result.interval,
            updatedStats
        };
    }

    // SM-2 algorithm implementation
    private calculateNextReview(card: any, rating: number) {
        let easeFactor = card.ease_factor;
        let interval = card.interval;
        let lapses = card.lapses;
        let stage = card.stage;

        const now = new Date();
        const nextDate = new Date(now);

        if (rating === 0) { // Again - completely forgot
            lapses += 1;
            interval = 1; // Review tomorrow
            easeFactor = Math.max(1.3, easeFactor - 0.2);
            stage = 1; // Back to learning
        } else if (rating === 1) { // Hard
            interval = Math.max(1, Math.round(interval * 1.2));
            easeFactor = Math.max(1.3, easeFactor - 0.15);
            stage = Math.max(1, stage);
        } else if (rating === 2) { // Good
            if (stage === 0) { // First review
                interval = 1;
                stage = 1;
            } else if (stage === 1) { // Learning
                interval = 4;
                stage = 2;
            } else { // Reviewing
                interval = Math.round(interval * easeFactor);
            }
        } else if (rating === 3) { // Easy
            if (stage === 0) {
                interval = 4;
                stage = 2;
            } else if (stage === 1) {
                interval = 7;
                stage = 2;
            } else {
                interval = Math.round(interval * easeFactor * 1.3);
            }
            easeFactor = easeFactor + 0.15;
        }

        // Cap interval at max (1 year)
        interval = Math.min(interval, 365);
        nextDate.setDate(now.getDate() + interval);

        return {
            easeFactor,
            interval,
            stage,
            lapses,
            nextReviewDate: nextDate.toISOString()
        };
    }

    // Update user streak
    private async updateStreak(userId: string) {
        const today = new Date().toISOString().split('T')[0];

        // Get current streak
        const { data: streak } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!streak) return;

        let currentStreak = streak.current_streak;
        let longestStreak = streak.longest_streak;

        if (!streak.last_review_date) {
            // First review ever
            currentStreak = 1;
        } else {
            const lastDate = new Date(streak.last_review_date);
            const todayDate = new Date(today);
            const diffTime = todayDate.getTime() - lastDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
                // Consecutive day
                currentStreak += 1;
            } else if (diffDays > 1) {
                // Streak broken
                currentStreak = 1;
            }
            // Same day, streak unchanged
        }

        longestStreak = Math.max(longestStreak, currentStreak);

        await supabase
            .from('user_streaks')
            .update({
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_review_date: today,
                total_reviews: streak.total_reviews + 1,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
    }

    // Get review statistics
    async getStats(userId: string) {
        console.log('📊 Getting stats for user:', userId);

        // Get cards with error logging
        const { data: cards, error: cardsError } = await supabase
            .from('spaced_repetition_cards')
            .select('*')
            .eq('user_id', userId);

        if (cardsError) {
            console.error('❌ Error fetching cards:', cardsError);
        } else {
            console.log(`✅ Found ${cards?.length || 0} cards`);
        }

        // Get reviews with error logging
        const { data: reviews, error: reviewsError } = await supabase
            .from('spaced_repetition_reviews')
            .select('*')
            .eq('user_id', userId)
            .order('reviewed_at', { ascending: false })
            .limit(1000);

        if (reviewsError) {
            console.error('❌ Error fetching reviews:', reviewsError);
        } else {
            console.log(`✅ Found ${reviews?.length || 0} reviews`);
        }

        // Get streak with error logging
        const { data: streak, error: streakError } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (streakError && streakError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Error fetching streak:', streakError);
        } else {
            console.log('✅ Streak data:', streak);
        }

        // Get settings with error logging
        const { data: settings, error: settingsError } = await supabase
            .from('spaced_repetition_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('❌ Error fetching settings:', settingsError);
        } else {
            console.log('✅ Settings data:', settings);
        }

        const totalCards = cards?.length || 0;

        // Calculate due cards count
        const dueCount = cards?.filter(card =>
            card.next_review_at && new Date(card.next_review_at) <= new Date()
        ).length || 0;

        console.log(`📊 Due cards count: ${dueCount}`);

        // Calculate retention rate
        const reviewsData = reviews || [];
        const correctReviews = reviewsData.filter(r => r.rating >= 2).length;
        const retentionRate = reviewsData.length > 0
            ? Math.round((correctReviews / reviewsData.length) * 100)
            : 0;

        console.log(`📊 Retention rate: ${retentionRate}% (${correctReviews}/${reviewsData.length})`);

        return {
            totalCards,
            dueCount,
            retentionRate,
            streak: streak || {
                current_streak: 0,
                longest_streak: 0,
                last_review_date: null,
                total_reviews: 0
            },
            settings: settings || {
                daily_review_limit: 20,
                new_cards_per_day: 10
            }
        };
    }

    // Manual stats update
    async recalculateStats(userId: string) {
        console.log('🔄 Recalculating stats for user:', userId);

        // Get all cards
        const { data: cards } = await supabase
            .from('spaced_repetition_cards')
            .select('*')
            .eq('user_id', userId);

        // Get all reviews
        const { data: reviews } = await supabase
            .from('spaced_repetition_reviews')
            .select('*')
            .eq('user_id', userId)
            .order('reviewed_at', { ascending: true });

        if (!cards || !reviews) return;

        // Calculate streak from reviews
        let currentStreak = 0;
        let longestStreak = 0;
        let lastDate: Date | null = null;

        const reviewDates = [...new Set(reviews.map(r =>
            new Date(r.reviewed_at).toISOString().split('T')[0]
        ))].sort();

        for (const dateStr of reviewDates) {
            const date = new Date(dateStr);
            if (lastDate) {
                const diffDays = Math.round((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                } else if (diffDays > 1) {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            longestStreak = Math.max(longestStreak, currentStreak);
            lastDate = date;
        }

        // Update streak in database
        await supabase
            .from('user_streaks')
            .upsert({
                user_id: userId,
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_review_date: lastDate?.toISOString().split('T')[0],
                total_reviews: reviews.length,
                updated_at: new Date().toISOString()
            });

        console.log('✅ Stats recalculated:', {
            currentStreak,
            longestStreak,
            totalReviews: reviews.length
        });
    }
}

export const spacedRepetition = new SpacedRepetitionService();
