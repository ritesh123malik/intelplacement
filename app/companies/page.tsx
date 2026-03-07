'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MagnifyingGlassIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '@/components/Breadcrumbs';
import CompanyCard from '@/components/CompanyCard';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    setCompanies(data || []);
    setLoading(false);
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Companies' }]} className="mb-6" />

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2 tracking-tight">
            Companies
          </h1>
          <p className="text-gray-600 text-base">
            Browse interview questions from top tech companies
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              aria-label="Search companies"
            />
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="card text-center py-12">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden />
            <p className="text-gray-600 font-medium">
              No companies found matching &quot;{searchTerm}&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}

        <div className="mt-8 card py-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredCompanies.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{companies.length}</span> companies
          </p>
        </div>
      </div>
    </div>
  );
}
