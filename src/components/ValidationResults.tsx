import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, Info, CheckCircle, Eye } from 'lucide-react';
import { AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { BidRequestSummaryCard } from './BidRequestSummaryCard';

interface Props {
  analysis: AnalysisResult | null;
  issues: ValidationIssue[];
  isLoading: boolean;
}

export const ValidationResults: React.FC<Props> = ({ analysis, issues, isLoading }) => {
  const [filter, setFilter] = useState<'All' | 'Error' | 'Warning' | 'Info'>('All');

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800 min-h-[500px]">
        <div className="animate-spin w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full" />
        <p className="mt-4 text-slate-400">Analyzing bid request...</p>
      </Card>
    );
  }
    
  if (!analysis) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800 min-h-[500px]">
        <div className="text-6xl text-slate-600 mb-4">
          <Eye />
        </div>
        <h3 className="text-xl font-bold text-white">Ready for Analysis</h3>
        <p className="text-slate-400 mt-1">Paste a bid request and click "Analyze" to get started.</p>
      </Card>
    );
  }

  if (analysis.error) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-red-900/20 border-red-500/30 min-h-[500px]">
        <XCircle className="w-12 h-12 mb-4 text-red-400"/>
        <h3 className="text-xl font-bold text-white">Analysis Error</h3>
        <p className="text-red-400/80 mt-1 max-w-md">{analysis.error}</p>
        <p className="text-slate-400 text-sm mt-2">Please check the input and try again.</p>
      </Card>
    );
  }
  
  const filteredIssues = issues.filter(issue => filter === 'All' || issue.severity === filter);
  const summary = {
    errors: issues.filter(i => i.severity === 'Error').length,
    warnings: issues.filter(i => i.severity === 'Warning').length,
    info: issues.filter(i => i.severity === 'Info').length,
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'Warning': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'Info': return <Info className="w-4 h-4 text-blue-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'Error': return 'border-red-500 bg-red-900/20 text-red-100';
      case 'Warning': return 'border-orange-500 bg-orange-900/20 text-orange-100';
      case 'Info': return 'border-blue-500 bg-blue-900/20 text-blue-100';
      default: return 'border-slate-500 bg-slate-900/20 text-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Bid Request Summary (updated) */}
      <BidRequestSummaryCard summary={analysis.summary} />

      {/* Validation Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Error Card */}
        <Card className="bg-red-900/20 p-4 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-400">{summary.errors}</p>
              <p className="text-sm text-slate-400">Errors</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
        {/* Warning Card */}
        <Card className="bg-orange-900/20 p-4 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-400">{summary.warnings}</p>
              <p className="text-sm text-slate-400">Warnings</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
        {/* Info Card */}
        <Card className="bg-blue-900/20 p-4 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-400">{summary.info}</p>
              <p className="text-sm text-slate-400">Info</p>
            </div>
            <Info className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Issues Found */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-white">Validation Issues</CardTitle>
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg">
              {(['All', 'Error', 'Warning', 'Info'] as const).map(f => (
                <Button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  variant={filter === f ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`px-3 ${filter === f ? 'bg-slate-600' : ''}`}
                >
                  {f}
                  {f === 'All' && issues.length > 0 && (
                    <span className="ml-1 text-xs bg-slate-700 px-1 rounded">{issues.length}</span>
                  )}
                  {f === 'Error' && summary.errors > 0 && (
                    <span className="ml-1 text-xs bg-red-900 px-1 rounded">{summary.errors}</span>
                  )}
                  {f === 'Warning' && summary.warnings > 0 && (
                    <span className="ml-1 text-xs bg-orange-900 px-1 rounded">{summary.warnings}</span>
                  )}
                  {f === 'Info' && summary.info > 0 && (
                    <span className="ml-1 text-xs bg-blue-900 px-1 rounded">{summary.info}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <div className="text-center py-8 text-green-400 flex items-center justify-center">
              <CheckCircle className="mr-2"/>
              {filter === 'All' 
                ? "No issues found! This bid request is fully compliant." 
                : `No ${filter.toLowerCase()} issues found.`}
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {filteredIssues.map((issue, i) => (
                <div 
                  key={i} 
                  className={`text-sm p-4 rounded-md border-l-4 ${getSeverityStyles(issue.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <p className="font-semibold">{issue.message}</p>
                      <p className="text-xs opacity-70 font-mono mt-1">
                        Path: {issue.path}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
