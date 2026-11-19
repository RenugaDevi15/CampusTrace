import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FlaskConical,
  Play,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type {
  AppRoute,
  QACategorySummary,
  QATestCaseResult,
  QATestExecutionReport,
  QATestStatus,
  TestingCategory,
} from '../types/campus';

interface TestingQAPageProps {
  onNavigate: (route: AppRoute) => void;
}

const TESTING_CATEGORIES: TestingCategory[] = [
  'Unit',
  'Integration',
  'Validation',
  'Functional',
  'System',
];

function StatusBadge({ status }: { status: QATestStatus }) {
  if (status === 'Passed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Passed
      </span>
    );
  }
  if (status === 'Failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-800 border border-red-200 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 text-red-600" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 text-amber-600" />
      Pending
    </span>
  );
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function TestingQAPage({ onNavigate }: TestingQAPageProps) {
  const { profile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [report, setReport] = useState<QATestExecutionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'All' | TestingCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | QATestStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRunLabel, setActiveRunLabel] = useState<string>('Full Automated Suite');

  const fetchLatestReport = async (label?: string, filterCat?: 'All' | TestingCategory) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/test-reports/latest-report.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Test execution report unavailable (HTTP ${response.status}). Run "npm run test:report" to generate it.`);
      }
      const data = (await response.json()) as QATestExecutionReport;
      setReport(data);
      if (filterCat !== undefined) {
        setSelectedCategory(filterCat);
      }
      if (label) {
        setActiveRunLabel(label);
        showToast(`Loaded verified execution results for ${label}.`, 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load test execution report.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && isAdmin) {
      fetchLatestReport();
    } else {
      setLoading(false);
    }
  }, [profile, isAdmin]);

  const filteredResults = useMemo<QATestCaseResult[]>(() => {
    if (!report) return [];
    const q = searchQuery.trim().toLowerCase();
    return report.results.filter((tc) => {
      if (selectedCategory !== 'All' && tc.testingType !== selectedCategory) return false;
      if (statusFilter !== 'All' && tc.status !== statusFilter) return false;
      if (q) {
        const hay = `${tc.testCaseId} ${tc.testingType} ${tc.module} ${tc.testScenario} ${tc.testInput} ${tc.expectedOutput} ${tc.actualOutput}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [report, selectedCategory, statusFilter, searchQuery]);

  const activeScopeStats = useMemo(() => {
    const scopeList = !report
      ? []
      : selectedCategory === 'All'
        ? report.results
        : report.results.filter((r) => r.testingType === selectedCategory);
    const total = scopeList.length;
    const passed = scopeList.filter((r) => r.status === 'Passed').length;
    const failed = scopeList.filter((r) => r.status === 'Failed').length;
    const pending = scopeList.filter((r) => r.status === 'Pending').length;
    const passPercentage = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
    return { total, passed, failed, pending, passPercentage };
  }, [report, selectedCategory]);

  const categorySummaries = useMemo<QACategorySummary[]>(() => {
    if (!report) return [];
    if (report.categories && report.categories.length > 0) return report.categories;
    return TESTING_CATEGORIES.map((testingType) => {
      const subset = report.results.filter((r) => r.testingType === testingType);
      const total = subset.length;
      const passed = subset.filter((r) => r.status === 'Passed').length;
      const failed = subset.filter((r) => r.status === 'Failed').length;
      const pending = subset.filter((r) => r.status === 'Pending').length;
      return {
        testingType,
        total,
        passed,
        failed,
        pending,
        passRate: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
      };
    });
  }, [report]);

  if (!profile || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-xl p-8 text-center">
        <ShieldAlert className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Administrator Access Required</h1>
        <p className="mt-2 text-sm text-slate-600">
          The Testing &amp; Quality Assurance verification suite is restricted to CampusTrace administrators.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleExportCsv = () => {
    if (!report || filteredResults.length === 0) {
      showToast('No test results available to export.', 'error');
      return;
    }
    const headers = [
      'Test Case ID',
      'Testing Type',
      'Module',
      'Test Scenario',
      'Test Input',
      'Expected Output',
      'Actual Output',
      'Status',
      'Duration (ms)',
      'Executed At',
    ];
    const rows = filteredResults.map((tc) => [
      tc.testCaseId,
      tc.testingType,
      tc.module,
      tc.testScenario,
      tc.testInput,
      tc.expectedOutput,
      tc.actualOutput,
      tc.status,
      tc.durationMs,
      report.generatedAt,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campustrace-qa-${selectedCategory.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredResults.length} test cases to CSV.`, 'success');
  };

  const handleExportPdf = () => {
    window.print();
  };

  const formattedExecutionDate = report?.generatedAt
    ? new Date(report.generatedAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Not available';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Quality Assurance Control Center</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Testing &amp; Quality Assurance
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Verified execution audit across Unit, Integration, Validation, Functional, and System testing suites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={() => fetchLatestReport('Full Automated Suite', 'All')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-50 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            Run All Tests
          </button>
          <button
            type="button"
            onClick={() => fetchLatestReport(activeRunLabel)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Report
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!report || filteredResults.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!report}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-blue-700" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Category Execution Buttons */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Execute / Inspect Testing Technique
          </span>
          {report && (
            <span className="text-xs text-slate-500 font-mono">
              Runner: {report.runner} · Executed: {formattedExecutionDate}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setActiveRunLabel('Full Automated Suite');
            }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            All 5 Suites ({report?.totalCases ?? 0})
          </button>
          {TESTING_CATEGORIES.map((category) => {
            const catCount = report?.results.filter((r) => r.testingType === category).length ?? 0;
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  setActiveRunLabel(`${category} Testing Suite`);
                }}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Run {category} Tests ({catCount})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
          Loading latest verified test execution results...
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-800 space-y-2">
          <div className="font-semibold">Unable to Load Test Execution Report</div>
          <p>{loadError}</p>
        </div>
      ) : report ? (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Total Test Cases</div>
              <div className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {activeScopeStats.total}
              </div>
              <div className="mt-1 text-xs text-slate-500 truncate">{activeRunLabel}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Passed</div>
              <div className="mt-2 text-3xl font-bold text-emerald-700 font-mono tabular-nums">
                {activeScopeStats.passed}
              </div>
              <div className="mt-1 text-xs text-emerald-700">Green · Verified OK</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Failed</div>
              <div className="mt-2 text-3xl font-bold text-red-600 font-mono tabular-nums">
                {activeScopeStats.failed}
              </div>
              <div className="mt-1 text-xs text-slate-500">Red · Defects Found</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Pending</div>
              <div className="mt-2 text-3xl font-bold text-amber-600 font-mono tabular-nums">
                {activeScopeStats.pending}
              </div>
              <div className="mt-1 text-xs text-slate-500">Yellow · Skipped / Queued</div>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-medium text-slate-500">Pass Percentage</div>
              <div className="mt-2 text-3xl font-bold text-blue-700 font-mono tabular-nums">
                {activeScopeStats.passPercentage}%
              </div>
              <div className="mt-1 text-xs text-slate-500 truncate">
                {formattedExecutionDate}
              </div>
            </div>
          </div>

          {/* Graphical Chart & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Suite Coverage &amp; Execution Chart
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {report.command}
                </span>
              </div>

              <div className="space-y-4">
                {categorySummaries.map((cat) => {
                  const passedPct = cat.total > 0 ? (cat.passed / cat.total) * 100 : 0;
                  const failedPct = cat.total > 0 ? (cat.failed / cat.total) * 100 : 0;
                  const pendingPct = cat.total > 0 ? (cat.pending / cat.total) * 100 : 0;
                  return (
                    <div key={cat.testingType} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">
                          {cat.testingType} Testing
                        </span>
                        <span className="font-mono tabular-nums text-slate-600">
                          {cat.passed}/{cat.total} Passed ({cat.passRate}%)
                        </span>
                      </div>
                      <div
                        className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex"
                        role="img"
                        aria-label={`${cat.testingType} testing chart: ${cat.passed} passed, ${cat.failed} failed, ${cat.pending} pending`}
                      >
                        {passedPct > 0 && (
                          <div
                            className="h-full bg-emerald-600"
                            style={{ width: `${passedPct}%` }}
                          />
                        )}
                        {failedPct > 0 && (
                          <div
                            className="h-full bg-red-600"
                            style={{ width: `${failedPct}%` }}
                          />
                        )}
                        {pendingPct > 0 && (
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${pendingPct}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Passed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  Failed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Pending
                </span>
              </div>
            </section>

            {/* Execution Metadata & Audit Info */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Execution Audit Metadata
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Genuine automated Vitest &amp; React Testing Library verification output recorded on disk.
                </p>

                <dl className="mt-4 divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500">Test Runner</dt>
                    <dd className="font-mono text-slate-900 text-right">{report.runner}</dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500">Execution Date &amp; Time</dt>
                    <dd className="font-mono text-slate-900 text-right">{formattedExecutionDate}</dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500">Overall Pass Rate</dt>
                    <dd className="font-mono font-semibold text-emerald-700 text-right">
                      {report.passedCases} / {report.totalCases} ({report.passPercentage}%)
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500">Playwright E2E Spec</dt>
                    <dd className="font-mono text-slate-900 text-right">e2e/functional.spec.ts</dd>
                  </div>
                </dl>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Export full QA documentation</span>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800 print:hidden"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
              </div>
            </section>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 print:hidden">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Test Case ID, module, scenario, or expected output..."
                aria-label="Filter test cases"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              aria-label="Filter by test status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | QATestStatus)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Detailed Test Cases Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Executed Test Cases ({filteredResults.length})
              </h2>
              <span className="text-xs text-slate-500">
                Showing {selectedCategory === 'All' ? 'all categories' : `${selectedCategory} testing`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 whitespace-nowrap">Test Case ID</th>
                    <th className="py-3 px-4 whitespace-nowrap">Testing Type</th>
                    <th className="py-3 px-4 whitespace-nowrap">Module</th>
                    <th className="py-3 px-4">Test Scenario</th>
                    <th className="py-3 px-4">Test Input</th>
                    <th className="py-3 px-4">Expected Output</th>
                    <th className="py-3 px-4">Actual Output</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-500">
                        No test cases match the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((tc) => (
                      <tr key={tc.testCaseId} className="hover:bg-slate-50/70 align-top">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {tc.testCaseId}
                        </td>
                        <td className="py-3 px-4 font-medium text-blue-700 whitespace-nowrap">
                          {tc.testingType}
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{tc.module}</td>
                        <td className="py-3 px-4 text-slate-900 min-w-[200px]">{tc.testScenario}</td>
                        <td className="py-3 px-4 text-slate-600 min-w-[180px]">{tc.testInput}</td>
                        <td className="py-3 px-4 text-slate-700 min-w-[180px]">{tc.expectedOutput}</td>
                        <td className="py-3 px-4 text-slate-700 min-w-[180px]">{tc.actualOutput}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={tc.status} />
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-500 text-right whitespace-nowrap">
                          {tc.durationMs} ms
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
