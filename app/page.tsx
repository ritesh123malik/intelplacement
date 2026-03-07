'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const features = [
    {
      icon: <BookOpenIcon className="w-6 h-6 text-primary-600" aria-hidden />,
      title: 'LeetCode Questions',
      description: 'Access 15,000+ company-specific questions curated from top technical interviews.',
    },
    {
      icon: <SparklesIcon className="w-6 h-6 text-accent-purple" aria-hidden />,
      title: 'AI Roadmaps',
      description: 'Personalized preparation roadmaps generated dynamically by our language models.',
    },
    {
      icon: <ChartBarIcon className="w-6 h-6 text-amber-500" aria-hidden />,
      title: 'Dynamic Analytics',
      description: 'Track your algorithmic progress globally against peers via GitHub-style heatmaps.',
    },
    {
      icon: <ClockIcon className="w-6 h-6 text-blue-500" aria-hidden />,
      title: 'System Design Checks',
      description: 'Build robust whiteboards natively and receive real-time AI architectural feedback.',
    },
    {
      icon: <AcademicCapIcon className="w-6 h-6 text-orange-500" aria-hidden />,
      title: 'Aptitude Engine',
      description: 'Timed online assessments targeting deep CS fundamentals with automated scoring.',
    },
    {
      icon: <UserGroupIcon className="w-6 h-6 text-emerald-500" aria-hidden />,
      title: 'Application Kanban',
      description: 'Drag and drop your real job pipelines through localized company-based funnels.',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-purple pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur border border-white/30 text-sm text-white font-medium mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" aria-hidden />
              Placement Intel for LNMIIT
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-6 text-white text-on-gradient"
            >
              Master The Interview.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed text-on-gradient"
            >
              15,000+ company-wise questions, AI roadmaps, spaced repetition, and system design practice — all in one place.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/companies" className="inline-flex">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary-700 hover:bg-gray-100 border-0 shadow-lg [text-shadow:none]"
                >
                  Browse Companies
                </Button>
              </Link>
              <Link href="/auth/signup" className="inline-flex">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-white/10 text-white border-white/40 hover:bg-white/20">
                  Get Started Free
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-container mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <GlassCard className="p-8" glowColor="none" hoverEffect={false}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">15K+</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">663</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">4</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Branches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1">Free</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">To Start</div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Everything you need to crack placements
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Company-wise questions, AI roadmaps, CGPA calculator, quizzes, and more.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="h-full p-6" glowColor="purple">
                <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
