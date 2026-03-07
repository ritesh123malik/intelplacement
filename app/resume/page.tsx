'use client';
// app/resume/page.tsx

import { useState, useRef } from 'react';
import { Upload, FileText, Star, CheckCircle, AlertCircle, XCircle, Zap, RotateCw } from 'lucide-react';
import clsx from 'clsx';

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  missing_keywords: string[];
}

export default function ResumePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  function handleFileSelect(f: File) {
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5MB.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  }

  async function analyzeResume() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/resume', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const data = await res.json();
      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  const scoreColor = !result ? '' : result.score >= 75 ? 'text-green' : result.score >= 50 ? 'text-gold' : 'text-red';
  const scoreBg = !result ? '' : result.score >= 75 ? 'bg-green' : result.score >= 50 ? 'bg-gold' : 'bg-red';

  return (
    <div className="min-h-screen bg-bg noise">
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-10">
          <p className="section-label mb-2">AI Analysis</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-1">Resume Scorer</h1>
          <p className="text-text-secondary">Upload your PDF resume. Get an AI score, gap analysis, and specific improvements in 30 seconds.</p>
        </div>

        {/* Upload zone */}
        <div
          className={clsx(
            'card p-10 text-center border-dashed cursor-pointer transition-all duration-200 mb-6',
            dragging && 'border-blue bg-blue-dim',
            file && 'border-green/40 bg-green-dim/30',
            !file && !dragging && 'hover:border-border-strong'
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-green-dim rounded-2xl flex items-center justify-center">
                <FileText size={26} className="text-green" />
              </div>
              <div>
                <p className="font-display font-bold">{file.name}</p>
                <p className="text-text-muted text-sm">{(file.size / 1024).toFixed(0)} KB — PDF</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                className="text-red text-xs hover:underline flex items-center gap-1"
              >
                <XCircle size={12} /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center">
                <Upload size={26} className="text-text-muted" />
              </div>
              <div>
                <p className="font-display font-bold">Drop your resume here</p>
                <p className="text-text-muted text-sm mt-1">or click to browse — PDF only, max 5MB</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-dim border border-red/20 text-red text-sm rounded-lg px-4 py-3 mb-6">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {file && !result && (
          <button
            onClick={analyzeResume}
            disabled={loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2.5 mb-6"
          >
            {loading ? (
              <><RotateCw size={18} className="animate-spin" />Analyzing your resume...</>
            ) : (
              <><Zap size={18} />Analyze with AI</>
            )}
          </button>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-6 stagger-children">
            {/* Score hero */}
            <div className="card p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-blue/5 via-transparent to-transparent" />
              <div className="relative z-10">
                <p className="section-label mb-4">ATS Compatibility Score</p>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#1E1E2E" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none"
                      stroke={result.score >= 75 ? '#10B981' : result.score >= 50 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="8"
                      strokeDasharray={`${(result.score / 100) * 326.7} 326.7`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-display font-extrabold text-4xl ${scoreColor}`}>{result.score}</span>
                    <span className="text-text-muted text-xs font-mono">/ 100</span>
                  </div>
                </div>
                <p className="text-text-secondary max-w-md mx-auto leading-relaxed">{result.summary}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="card p-6">
                <h3 className="font-display font-bold flex items-center gap-2 mb-4">
                  <CheckCircle size={18} className="text-green" />
                  What's working well
                </h3>
                <ul className="flex flex-col gap-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="w-5 h-5 bg-green-dim rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green text-xs">✓</span>
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="card p-6">
                <h3 className="font-display font-bold flex items-center gap-2 mb-4">
                  <AlertCircle size={18} className="text-gold" />
                  Areas to improve
                </h3>
                <ul className="flex flex-col gap-2">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="w-5 h-5 bg-gold-dim rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-gold text-xs font-bold">{i + 1}</span>
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing keywords */}
            {result.missing_keywords.length > 0 && (
              <div className="card p-6">
                <h3 className="font-display font-bold mb-1">Missing Keywords</h3>
                <p className="text-text-muted text-sm mb-4">Add these to improve ATS matching for SDE roles.</p>
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((kw, i) => (
                    <span key={i} className="badge border-red/30 text-red bg-red-dim text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Re-analyze */}
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <RotateCw size={15} />
              Analyze another resume
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
