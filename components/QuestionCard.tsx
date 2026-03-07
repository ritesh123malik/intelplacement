'use client';
// components/QuestionCard.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/types';
import { Bookmark, TrendingUp, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { statsService } from '@/lib/stats-service';
import clsx from 'clsx';

interface Props {
  question: Question;
  isBookmarked: boolean;
  userId?: string;
  companyId: string;
}

export default function QuestionCard({ question, isBookmarked: initialBookmarked, userId, companyId }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [addedToReview, setAddedToReview] = useState(false);
  const router = useRouter();

  async function handleAddToReview(e: React.MouseEvent) {
    e.preventDefault();
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);

    const result = await statsService.addToReview(userId, question.id);
    if (result.success) {
      setAddedToReview(true);
      alert('Added to your review queue!');
    } else {
      alert(result.message || result.error || 'Failed to add to queue');
    }
    setLoading(false);
  }

  async function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);

    if (bookmarked) {
      await supabase.from('bookmarks')
        .delete().eq('user_id', userId).eq('question_id', question.id);
      setBookmarked(false);
    } else {
      await supabase.from('bookmarks')
        .insert({ user_id: userId, question_id: question.id });
      setBookmarked(true);
      // Update progress
      await supabase.from('user_progress')
        .upsert({ user_id: userId, company_id: companyId }, { onConflict: 'user_id,company_id' });
    }
    setLoading(false);
  }

  const difficultyClass = question.difficulty === 'Easy' ? 'badge-easy'
    : question.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium';

  return (
    <div className="card p-5 hover:border-gray-300 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`badge ${difficultyClass}`}>{question.difficulty}</span>
            <span className="badge border-gray-200 text-gray-500 text-xs">{question.round}</span>
            {question.topic && (
              <span className="badge border-gray-200 text-gray-600 text-xs">{question.topic}</span>
            )}
            {question.year_reported && (
              <span className="text-gray-500 text-xs font-mono">{question.year_reported}</span>
            )}
          </div>

          <div className="flex items-start gap-2">
            <p className={clsx(
              'text-gray-900 text-sm leading-relaxed flex-1',
              !expanded && 'line-clamp-2'
            )}>
              {question.question}
            </p>
            {question.source_url && (
              <a href={question.source_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 mt-0.5 flex-shrink-0 font-medium" title="View source" aria-label="Open source link">
                <ExternalLink size={14} aria-hidden />
              </a>
            )}
          </div>

          {question.question.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-primary-600 text-xs font-medium mt-2 hover:gap-2 transition-all"
            >
              {expanded ? <><ChevronUp size={12} aria-hidden />Show less</> : <><ChevronDown size={12} aria-hidden />Show more</>}
            </button>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAddToReview}
              disabled={loading || addedToReview || !userId}
              title={!userId ? 'Sign in to review' : addedToReview ? 'Already in queue' : 'Add to Review Queue'}
              aria-label={!userId ? 'Sign in to review' : addedToReview ? 'Already in queue' : 'Add to Review Queue'}
              className={clsx(
                'min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150',
                addedToReview ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:text-purple-600 hover:bg-gray-100',
                (!userId) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {addedToReview ? <CheckCircleIcon className="w-5 h-5" aria-hidden /> : <SparklesIcon className="w-5 h-5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={loading || !userId}
              title={!userId ? 'Sign in to bookmark' : bookmarked ? 'Remove bookmark' : 'Bookmark'}
              aria-label={!userId ? 'Sign in to bookmark' : bookmarked ? 'Remove bookmark' : 'Bookmark'}
              className={clsx(
                'min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150',
                bookmarked ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                (!userId) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Bookmark size={18} className={bookmarked ? 'fill-primary-600' : ''} aria-hidden />
            </button>
          </div>
          {question.frequency > 1 && (
            <div className="flex items-center gap-1 text-gray-500">
              <TrendingUp size={12} aria-hidden />
              <span className="text-xs font-mono">{question.frequency}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
