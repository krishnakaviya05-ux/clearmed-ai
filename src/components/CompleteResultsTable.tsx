import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  HelpCircle,
  Layers
} from 'lucide-react';
import { TestItem, TestStatus } from '../types/report';

interface CompleteResultsTableProps {
  tests: TestItem[];
}

export const CompleteResultsTable: React.FC<CompleteResultsTableProps> = ({ tests }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ABNORMAL' | TestStatus>('ALL');

  const filteredTests = tests.filter((item) => {
    // Search filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.explanation && item.explanation.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ABNORMAL') return item.status === 'HIGH' || item.status === 'LOW';
    return item.status === statusFilter;
  });

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            NORMAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
            <ArrowUpRight className="w-3 h-3 text-rose-600" />
            HIGH
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
            <ArrowDownRight className="w-3 h-3 text-amber-700" />
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-600" />
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <section className="space-y-4" id="complete-test-results-section">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
            <Layers className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Complete Test Results Table
            </h2>
            <p className="text-xs text-slate-600">
              Showing {filteredTests.length} of {tests.length} diagnostic biomarkers
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            id="test-results-search"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5" id="test-filter-tabs">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({tests.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('ABNORMAL')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'ABNORMAL'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          Abnormal ({tests.filter((t) => t.status === 'HIGH' || t.status === 'LOW').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('NORMAL')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'NORMAL'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          Normal ({tests.filter((t) => t.status === 'NORMAL').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('HIGH')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'HIGH'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
          }`}
        >
          High ({tests.filter((t) => t.status === 'HIGH').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('LOW')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'LOW'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          Low ({tests.filter((t) => t.status === 'LOW').length})
        </button>
      </div>

      {/* Desktop Table Layout (hidden on mobile, visible on md+) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse" id="desktop-test-results-table">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">Test</th>
              <th className="py-3.5 px-4">Result</th>
              <th className="py-3.5 px-4">Unit</th>
              <th className="py-3.5 px-4">Reference Range</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 w-1/3">Explanation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {filteredTests.map((item, idx) => (
              <tr 
                key={item.id || idx}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {item.name}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                  {item.result}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono">
                  {item.unit || '—'}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {item.reference_range || '—'}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(item.status)}
                </td>
                <td className="py-3 px-4 text-slate-600 leading-relaxed">
                  {item.explanation || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card Layout (visible on mobile, hidden on md+) */}
      <div className="md:hidden space-y-3" id="mobile-test-results-cards">
        {filteredTests.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
          >
            {/* Header: Test Name and Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Test</p>
                <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
              </div>
              {getStatusBadge(item.status)}
            </div>

            {/* Result & Unit + Reference in a compact 2-column strip */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 text-xs">
              <div>
                <span className="text-slate-600 block text-[11px]">Result:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {item.result} {item.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[11px]">Reference Range:</span>
                <span className="font-medium text-slate-700">
                  {item.reference_range || 'Not specified'}
                </span>
              </div>
            </div>

            {/* Explanation */}
            {item.explanation && (
              <div className="pt-1 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700 block text-[11px]">Explanation:</span>
                <p className="mt-0.5">{item.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-600 text-xs">
          No tests match the current search or filter criteria.
        </div>
      )}
    </section>
  );
};
