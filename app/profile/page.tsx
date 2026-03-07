'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LeetCodeConnect from '@/components/leetcode/LeetCodeConnect';
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [formData, setFormData] = useState({
    full_name: '',
    college: '',
    graduation_year: '',
    target_role: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setAuthEmail(user.email || '');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        college: data.college || '',
        graduation_year: data.graduation_year || '',
        target_role: data.target_role || 'SDE'
      });
    }

    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        college: formData.college,
        graduation_year: parseInt(formData.graduation_year) || null,
        target_role: formData.target_role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      setEditing(false);
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-8 pt-24 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white">Your Profile</h1>
          <p className="text-zinc-400">Manage your account and showcase your LeetCode progress</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-[#12121A] rounded-2xl shadow-sm border border-[#2E2E42] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm">
                    {profile?.full_name?.[0] || authEmail?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-xl font-bold truncate">{profile?.full_name || 'Add your name'}</h2>
                    <p className="text-indigo-100/90 text-sm truncate">{authEmail}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {!editing ? (
                  <>
                    <div className="flex items-center text-zinc-300">
                      <BuildingOfficeIcon className="w-5 h-5 mr-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{profile?.college || 'College not specified'}</span>
                    </div>
                    <div className="flex items-center text-zinc-300">
                      <CalendarIcon className="w-5 h-5 mr-3 text-indigo-400 shrink-0" />
                      <span>{profile?.graduation_year || 'Grad year not specified'}</span>
                    </div>
                    <div className="flex items-center text-zinc-300">
                      <ChartBarIcon className="w-5 h-5 mr-3 text-indigo-400 shrink-0" />
                      <span>Target: {profile?.target_role || 'SDE'}</span>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full mt-4 px-4 py-2 border border-[#2563EB] text-[#2563EB] font-medium rounded-lg hover:bg-[#2563EB]/10 transition"
                    >
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full p-2 border border-[#2E2E42] bg-[#0A0A0F] text-white rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="College"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full p-2 border border-[#2E2E42] bg-[#0A0A0F] text-white rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Graduation Year"
                      value={formData.graduation_year}
                      onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                      className="w-full p-2 border border-[#2E2E42] bg-[#0A0A0F] text-white rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <select
                      value={formData.target_role}
                      onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                      className="w-full p-2 border border-[#2E2E42] bg-[#0A0A0F] text-white rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                    >
                      <option value="SDE">Software Engineer (SDE)</option>
                      <option value="Frontend">Frontend Developer</option>
                      <option value="Backend">Backend Developer</option>
                      <option value="Full Stack">Full Stack Developer</option>
                      <option value="Data Science">Data Scientist</option>
                      <option value="ML Engineer">ML Engineer</option>
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateProfile}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 border border-[#2E2E42] text-zinc-300 rounded-lg hover:bg-[#2E2E42]/50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-[#12121A] rounded-2xl shadow-sm border border-[#2E2E42] p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-indigo-400" />
                Platform Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Member since</span>
                  <span className="font-medium text-white">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Questions viewed</span>
                  <span className="font-medium text-white">0</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Bookmarks</span>
                  <span className="font-medium text-white">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* LeetCode Integration Column */}
          <div className="lg:col-span-2">
            <LeetCodeConnect />
          </div>
        </div>
      </div>
    </div>
  );
}
