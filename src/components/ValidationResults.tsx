import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, Info, CheckCircle, Eye } from 'lucide-react';
import { AnalysisResult, ValidationIssue } from '@/lib/analyzer';

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
            <p className="mt-4 text-slate-400">Analyzing...</p>
        </Card>
    );
  }
    
  if (!analysis) {
      return (
          <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800 min-h-[500px]">
              <div className="text-6xl text-slate-600 mb-4"><Eye /></div>
              <h3 className="text-xl font-bold text-white">Ready for Analysis</h3>
              <p className="text-slate-400 mt-1">Paste a bid request and click "Analyze".</p>
          </Card>
      );
  }

  if (analysis.error) {
      return (
           <Card className="h-full flex flex-col items-center justify-center text-center bg-red-900/20 border-red-500/30 min-h-[500px]">
              <XCircle className="w-12 h-12 mb-4 text-red-400"/>
              <h3 className="text-xl font-bold text-white">{analysis.error}</h3>
              <p className="text-red-400/80 mt-1">Please check the input and try again.</p>
          </Card>
      );
  }
  
  const filteredIssues = issues.filter(issue => filter === 'All' || issue.severity === filter);
  const summary = {
      errors: issues.filter(i => i.severity === 'Error').length,
      warnings: issues.filter(i => i.severity === 'Warning').length,
      info: issues.filter(i => i.severity === 'Info').length,
  };

  return (
      <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-lg text-white">Bid Request Analysis</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  <div><p className="text-slate-400">Request Type</p><p className="font-bold text-lg text-orange-400">{analysis.requestType}</p></div>
                  <div><p className="text-slate-400">Impressions</p><p className="font-bold text-lg text-white">{analysis.impressions}</p></div>
                  <div><p className="text-slate-400">Media Formats</p><p className="font-bold text-white">{analysis.mediaFormats.join(', ')}</p></div>
                  <div><p className="text-slate-400">Platform</p><p className="font-bold text-white">{analysis.platform}</p></div>
                  <div><p className="text-slate-400">Device Type</p><p className="font-bold text-white">{analysis.deviceType}</p></div>
                  <div><p className="text-slate-400">Geography</p><p className="font-bold text-white">{analysis.geo}</p></div>
              </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-red-900/20 p-4 border border-red-500/30"><p className="text-2xl font-bold text-red-400">{summary.errors}</p><p className="text-sm text-slate-400">Errors</p></Card>
              <Card className="bg-orange-900/20 p-4 border border-orange-500/30"><p className="text-2xl font-bold text-orange-400">{summary.warnings}</p><p className="text-sm text-slate-400">Warnings</p></Card>
              <Card className="bg-blue-900/20 p-4 border border-blue-500/30"><p className="text-2xl font-bold text-blue-400">{summary.info}</p><p className="text-sm text-slate-400">Info</p></Card>
          </div>

          <Card className="bg-slate-900 border-slate-800">
               <CardHeader>
                   <div className="flex justify-between items-center">
                       <CardTitle className="text-lg text-white">Issues Found</CardTitle>
                       <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg">
                           {(['All', 'Error', 'Warning', 'Info'] as const).map(f => (
                               <Button key={f} onClick={() => setFilter(f)} variant={filter === f ? 'secondary' : 'ghost'} size="sm" className={`px-3 ${filter === f ? 'bg-slate-600' : ''}`}>
                                   {f}
                               </Button>
                           ))}
                       </div>
                   </div>
                </CardHeader>
               <CardContent>
                  {filteredIssues.length === 0 ? (
                      <div className="text-center py-8 text-green-400 flex items-center justify-center"><CheckCircle className="mr-2"/>No {filter !== 'All' ? filter : ''} issues found.</div>
                  ) : (
                      <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {filteredIssues.map((issue, i) => (
                              <li key={i} className={`text-sm p-3 rounded-md border-l-4 ${issue.severity === 'Error' ? 'border-red-500 bg-red-900/20' : issue.severity === 'Warning' ? 'border-orange-500 bg-orange-900/20' : 'border-blue-500 bg-blue-900/20'}`}>
                                  <p className="font-semibold text-white">{issue.message}</p>
                                  <p className="text-slate-400 font-mono text-xs mt-1">Path: {issue.path}</p>
                              </li>
                          ))}
                      </ul>
                  )}
               </CardContent>
          </Card>
      </div>
  );
};
