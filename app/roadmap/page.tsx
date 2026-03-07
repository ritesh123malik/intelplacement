'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function RoadmapPage() {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('entry');
  const [duration, setDuration] = useState('8');
  const [roadmap, setRoadmap] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const companies = [
    { name: 'Google', icon: '🔍', color: 'from-blue-500 to-green-500' },
    { name: 'Microsoft', icon: '💻', color: 'from-blue-600 to-purple-600' },
    { name: 'Amazon', icon: '📦', color: 'from-orange-500 to-yellow-500' },
    { name: 'Flipkart', icon: '🛒', color: 'from-yellow-500 to-orange-500' },
    { name: 'Infosys', icon: '🏢', color: 'from-blue-700 to-indigo-700' },
    { name: 'TCS', icon: '📊', color: 'from-gray-700 to-gray-900' },
    { name: 'Razorpay', icon: '💳', color: 'from-blue-500 to-indigo-600' },
    { name: 'Meesho', icon: '🛍️', color: 'from-pink-500 to-rose-500' },
    { name: 'Atlassian', icon: '🎯', color: 'from-blue-400 to-cyan-400' },
    { name: 'Adobe', icon: '🎨', color: 'from-red-500 to-pink-500' },
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level', years: '0-2 years', icon: '🌱' },
    { value: 'mid', label: 'Mid Level', years: '2-5 years', icon: '🌿' },
    { value: 'senior', label: 'Senior Level', years: '5+ years', icon: '🌳' },
  ];

  const durations = [
    { value: '4', label: '4 Weeks', desc: 'Quick Prep', icon: '⚡' },
    { value: '8', label: '8 Weeks', desc: 'Standard', icon: '📅' },
    { value: '12', label: '12 Weeks', desc: 'Comprehensive', icon: '📚' },
    { value: '16', label: '16 Weeks', desc: 'Deep Dive', icon: '🎯' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRoadmap('');
    setGenerated(false);

    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, experience, duration })
      });

      const data = await res.json();

      if (res.ok) {
        setRoadmap(data.roadmap);
        setGenerated(true);
      } else {
        setError(data.error || 'Failed to generate roadmap');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCompany = companies.find(c => c.name === company);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-4 flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 mr-3" />
              AI Interview Roadmap Generator
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Personalized preparation plans powered by AI. Get a custom roadmap for your dream company.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-24">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Your Preferences</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
                    Target Company
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {companies.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setCompany(c.name)}
                        className={`p-3 rounded-xl border-2 transition-all ${company === c.name
                            ? `border-indigo-500 bg-gradient-to-r ${c.color} text-white shadow-lg scale-105`
                            : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50'
                          }`}
                      >
                        <div className="text-2xl mb-1">{c.icon}</div>
                        <div className="text-xs font-medium">{c.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BriefcaseIcon className="w-4 h-4 inline mr-1" />
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g., SDE, Frontend, Backend"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <ChartBarIcon className="w-4 h-4 inline mr-1" />
                    Experience Level
                  </label>
                  <div className="space-y-2">
                    {experienceLevels.map((exp) => (
                      <label
                        key={exp.value}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition ${experience === exp.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-200'
                          }`}
                      >
                        <input
                          type="radio"
                          name="experience"
                          value={exp.value}
                          checked={experience === exp.value}
                          onChange={(e) => setExperience(e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-2xl mr-3">{exp.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{exp.label}</div>
                          <div className="text-sm text-gray-500">{exp.years}</div>
                        </div>
                        {experience === exp.value && (
                          <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    Preparation Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {durations.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDuration(d.value)}
                        className={`p-3 rounded-xl border-2 transition-all ${duration === d.value
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-200'
                          }`}
                      >
                        <span className="text-2xl block mb-1">{d.icon}</span>
                        <div className="font-medium text-gray-800">{d.label}</div>
                        <div className="text-xs text-gray-500">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={loading || !company || !role}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>Generating Your Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      <span>Generate AI Roadmap</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!generated && !loading && !error && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LightBulbIcon className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Ready to Start?</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Fill in your preferences and let AI create a personalized interview preparation roadmap for you.
                </p>
                <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: '🎯', text: 'Company-specific questions' },
                    { icon: '📚', text: 'Weekly study plan' },
                    { icon: '⚡', text: 'Practice strategies' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="text-sm text-gray-600">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-gray-100">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SparklesIcon className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Crafting Your Roadmap</h3>
                  <p className="text-gray-600">
                    Our AI is analyzing requirements for {company && `${company} `}
                    {role && `as a ${role}...`}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">😕</span>
                </div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">Oops! Something went wrong</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  Try Again
                </button>
              </div>
            )}

            {roadmap && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Roadmap Header */}
                <div className={`bg-gradient-to-r ${selectedCompany?.color || 'from-indigo-600 to-purple-600'
                  } p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-3xl">{selectedCompany?.icon}</span>
                        <h2 className="text-2xl font-bold">{company} - {role}</h2>
                      </div>
                      <div className="flex space-x-4 text-sm opacity-90">
                        <span className="flex items-center">
                          <ChartBarIcon className="w-4 h-4 mr-1" />
                          {experienceLevels.find(e => e.value === experience)?.label}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {duration} Weeks Preparation
                        </span>
                      </div>
                    </div>
                    <BookOpenIcon className="w-12 h-12 opacity-30" />
                  </div>
                </div>

                {/* Roadmap Content */}
                <div className="p-8 prose prose-lg max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xl font-medium text-gray-700 mt-4 mb-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                      li: ({ node, ...props }) => <li className="text-gray-600" {...props} />,
                      p: ({ node, ...props }) => <p className="text-gray-600 mb-4 leading-relaxed" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-indigo-600" {...props} />,
                    }}
                  >
                    {roadmap}
                  </ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-6 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="w-4 h-4" />
                      <span>Generated by AI • Ready to start your preparation?</span>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 transition"
                    >
                      Save Roadmap 📄
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
