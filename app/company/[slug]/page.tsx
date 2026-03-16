'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Link as LinkIcon,
  ArrowLeft,
  Search,
  Trophy,
  Users,
  ShieldCheck,
  Layout,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Zap,
  ExternalLink,
  Clock,
  ArrowRight,
  Plus,
  MessageSquare,
  Star,
  Quote,
  ArrowUpRight
} from 'lucide-react';
import AIFloatingButton from '@/components/ai/AIFloatingButton';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function CompanyPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'experiences' | 'intel'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();

    setCompany(companyData);

    if (companyData) {
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('company_id', companyData.id)
        .order('frequency', { ascending: false });

      setQuestions(qData || []);

      // Fetch real experiences
      const { data: expData } = await supabase
        .from('interview_experiences')
        .select(`
                    *,
                    profiles:user_id(full_name, avatar_url, college)
                `)
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      setExperiences(expData || []);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">Initializing_Intel_Link</p>
      </div>
    </div>
  );

  if (!company) return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-4">
      <ShieldCheck size={48} className="text-[var(--brand-danger)] mb-4 opacity-50" />
      <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Tactical Data Unavailable</h1>
      <Link href="/companies" className="btn-secondary-lg !py-3 !px-6 !text-xs">
        Abort Mission & Return
      </Link>
    </div>
  );

  const filteredQuestions = questions.filter((q: any) =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] pb-20">
      {/* Tactical Header */}
      <div className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-110"
          style={{ backgroundImage: `url(${company.logo_url})`, filter: 'blur(80px) brightness(0.3)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-base)]/50 to-[var(--bg-base)]" />

        <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12 relative z-10">
          <Link href="/companies" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors mb-8 w-fit group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Command Center
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div className="flex items-center gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-32 h-32 bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] rounded-[2rem] p-6 shadow-2xl overflow-hidden"
              >
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain filter brightness-110" />
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-2"
                >
                  <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-[var(--brand-primary)]/20 animate-pulse">Alpha_Target_Verified</span>
                  {company.verified && <ShieldCheck size={16} className="text-[var(--brand-primary)]" />}
                </motion.div>
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">{company.name}</h1>
                <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-[var(--brand-primary)]" /> {company.hq || 'Global Operations'}</div>
                  <div className="flex items-center gap-2"><Building2 size={14} className="text-[var(--brand-primary)]" /> {company.industry || 'Tech Core'}</div>
                  <a href={company.website} target="_blank" className="flex items-center gap-2 hover:text-white transition-colors"><LinkIcon size={14} className="text-[var(--brand-primary)]" /> Field Ops Portal</a>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/quiz" className="btn-primary-lg !py-4 !px-8 flex items-center gap-3">
                <Zap size={18} />
                Start Simulation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Infiltration Tabs */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2.5rem] p-2 flex flex-wrap gap-2 shadow-2xl mb-12 backdrop-blur-xl">
          {(['overview', 'questions', 'experiences', 'intel'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab
                ? 'bg-white text-black shadow-xl'
                : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[3rem]">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                    <Briefcase className="text-[var(--brand-primary)]" />
                    Mission Briefing
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-lg font-medium">
                    {company.description || `${company.name} is a high-priority target in the ${company.industry || 'technology'} sector. Field agents report consistent growth and a focus on ${company.specialties || 'innovation and technical excellence'}.`}
                  </p>
                  <div className="grid grid-cols-2 mt-12 gap-8 ring-1 ring-[var(--border-subtle)] p-8 rounded-3xl">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-2">Technical_Difficulty</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-[var(--brand-danger)] shadow-[0_0_10px_rgba(var(--brand-danger-rgb),0.5)]' : 'bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-2">Hire_Velocity</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-[var(--brand-success)] shadow-[0_0_10px_rgba(var(--brand-success-rgb),0.5)]' : 'bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass-card p-8 bg-brand-gradient border border-[var(--brand-primary)]/20 rounded-[2.5rem] text-white">
                  <TrendingUp className="mb-6 opacity-30" size={48} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Target_Stats</h4>
                  <div className="text-4xl font-black tracking-tighter mb-4">ACTIVE OPS</div>
                  <p className="text-sm font-bold opacity-80 leading-snug">Current recruitment cycle is at peak capacity. Prepare your tactical assets for immediate deployment.</p>
                  <button className="w-full mt-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-transform">View Open Roles</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[3rem] p-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Tactical Database</h3>
                  <p className="text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest">{questions.length} Encrypted Challenges Recovered</p>
                </div>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="text"
                    placeholder="Decrypt challenge by name or topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-2xl text-white outline-none focus:border-[var(--brand-primary)] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredQuestions.map((q: any, i: number) => (
                  <div
                    key={q.id}
                    onClick={() => {
                      if (q.source_url) {
                        window.open(q.source_url, '_blank');
                      } else {
                        const searchQuery = encodeURIComponent(`${q.question} ${company.name} interview question`);
                        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                      }
                    }}
                    className="group p-6 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between hover:border-[var(--brand-primary)]/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-black text-[var(--text-muted)] font-mono">#{String(i + 1).padStart(3, '0')}</span>
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-[var(--brand-primary)] transition-colors uppercase tracking-tight">{q.question}</h4>
                        <div className="flex gap-4 mt-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{q.topic || 'General Algo'}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${q.difficulty === 'Hard' ? 'text-[var(--brand-danger)]' : q.difficulty === 'Medium' ? 'text-amber-500' : 'text-[var(--brand-success)]'}`}>{q.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'experiences' && (
            <motion.div
              key="experiences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Agent Reports</h3>
                  <p className="text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest">Live Intel from Recently Deployed Assets</p>
                </div>
                <Link href={`/experiences/add?company_id=${company.id}`} className="btn-primary-lg !py-4 !px-8 flex items-center gap-3">
                  <Plus size={18} />
                  File Experience Report
                </Link>
              </div>

              {experiences.length === 0 ? (
                <div className="glass-card p-12 text-center text-[var(--text-muted)]">
                  <MessageSquare size={48} className="mx-auto opacity-20 mb-6" />
                  <p className="font-black uppercase tracking-widest">No strategic reports in current archive</p>
                </div>
              ) : experiences.map((exp) => (
                <div key={exp.id} className="glass-card p-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[3rem] relative overflow-hidden group">
                  <Quote className="absolute top-8 right-8 text-[var(--brand-primary)]/5" size={120} />
                  <div className="flex flex-col md:flex-row gap-10 relative z-10">
                    <div className="w-full md:w-64 space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Target_Role</p>
                        <p className="text-sm font-black text-white uppercase">{exp.role}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Threat_Level</p>
                          <p className={`text-xs font-black uppercase ${exp.difficulty === 'Hard' ? 'text-[var(--brand-danger)]' : exp.difficulty === 'Medium' ? 'text-amber-500' : 'text-[var(--brand-success)]'}`}>{exp.difficulty}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Created</p>
                          <p className="text-xs font-black uppercase text-[var(--text-muted)]">{new Date(exp.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-[var(--brand-primary)]/10 rounded-xl flex items-center justify-center text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{exp.profiles?.full_name || 'Anonymous Strategist'}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{exp.profiles?.college || 'Verified LNMIT Agent'}</p>
                        </div>
                      </div>
                      <p className="text-[var(--text-secondary)] text-lg leading-relaxed font-medium">
                        {exp.content}
                      </p>
                      <Link
                        href={`/experiences/${exp.id}`}
                        className="inline-flex items-center gap-2 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] hover:text-white transition-colors"
                      >
                        Read Full Intel <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'intel' && (
            <motion.div
              key="intel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { title: 'Compensation Data', icon: TrendingUp, desc: 'Detailed CTC breakdowns and bonus structures recovered from the field.' },
                { title: 'Culture Protocol', icon: Users, desc: 'Internal operational dynamics and team communication structures.' },
                { title: 'Growth Vectors', icon: Zap, desc: 'Career progression paths and sector dominance strategies.' },
                { title: 'Benefit Packages', icon: Trophy, desc: 'Full list of perk-loadouts available to deployed assets.' }
              ].map((item, i) => (
                <div key={i} className="glass-card p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2.5rem] hover:border-[var(--brand-primary)]/50 transition-all group">
                  <div className="w-14 h-14 bg-[var(--brand-primary)]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="text-[var(--brand-primary)]" size={28} />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-4">{item.title}</h4>
                  <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed mb-6">{item.desc}</p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] hover:text-white transition-colors flex items-center gap-2">
                    Request Decryption <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AIFloatingButton />
    </div>
  );
}
