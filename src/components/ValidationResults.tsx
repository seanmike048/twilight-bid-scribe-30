
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { useState } from 'react';

interface ValidationResultsProps {
  analysis: AnalysisResult | null;
  issues: ValidationIssue[];
  isLoading: boolean;
}

export default function ValidationResults({ analysis, issues, isLoading }: ValidationResultsProps) {
  const [issueFilter, setIssueFilter] = useState<'All' | 'Error' | 'Warning' | 'Info'>('All');
  
  const severityClasses = {
    Error: "border-red-500 bg-red-900/20 text-red-400",
    Warning: "border-orange-500 bg-orange-900/20 text-orange-400",
    Info: "border-blue-500 bg-blue-900/20 text-blue-400"
  };

  const filteredIssues = issueFilter === 'All' ? issues : issues.filter(issue => issue.severity === issueFilter);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800">
        <div className="animate-spin w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full" />
        <p className="mt-4 text-slate-400">Analyzing...</p>
      </Card>
    );
  }
  
  if (!analysis) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800">
        <div className="text-6xl text-slate-600 mb-4"><Eye className="w-16 h-16 mx-auto" /></div>
        <h3 className="text-xl font-bold text-white">Ready for Analysis</h3>
        <p className="text-slate-400 mt-1">Paste a bid request and click "Analyze Request".</p>
      </Card>
    );
  }

  if (analysis.error) {
    return (
       <Card className={`h-full flex flex-col items-center justify-center text-center ${severityClasses.Error}`}>
          <XCircle className="w-12 h-12 mb-4"/>
          <h3 className="text-xl font-bold text-white">{analysis.error}</h3>
          <p className="text-red-400/80 mt-1">Please check the input and try again.</p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader><CardTitle className="text-lg text-white">Request Characteristics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-slate-400">Request Type</p><p className="font-bold text-lg text-orange-400">{analysis.requestType}</p></div>
          <div><p className="text-slate-400">Impressions</p><p className="font-bold text-lg text-white">{analysis.impressions}</p></div>
          <div><p className="text-slate-400">Media Formats</p><p className="font-bold text-white">{analysis.mediaFormats.join(', ') || 'N/A'}</p></div>
          <div><p className="text-slate-400">Platform</p><p className="font-bold text-white">{analysis.platform}</p></div>
          <div><p className="text-slate-400">Device Type</p><p className="font-bold text-white">{analysis.deviceType}</p></div>
          <div><p className="text-slate-400">Geography</p><p className="font-bold text-white">{analysis.geo}</p></div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900 border-slate-800">
         <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Validation Summary</CardTitle>
                <div className="flex items-center space-x-2">
                    {['All', 'Error', 'Warning', 'Info'].map(filter => (
                        <Button
                            key={filter}
                            variant={issueFilter === filter ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIssueFilter(filter as any)}
                            className="text-xs"
                        >
                            {filter} ({filter === 'All' ? issues.length : issues.filter(i => i.severity === filter).length})
                        </Button>
                    ))}
                </div>
            </div>
         </CardHeader>
         <CardContent>
            {filteredIssues.length === 0 ? (
                <div className="text-center py-4 text-green-400 flex items-center justify-center">
                    <CheckCircle className="mr-2"/>
                    {issueFilter === 'All' ? 'No issues found.' : `No ${issueFilter.toLowerCase()} issues found.`}
                </div>
            ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {filteredIssues.map((issue, i) => (
                        <li key={i} className={`text-sm p-3 rounded-md border-l-4 ${severityClasses[issue.severity]}`}>
                            <p className="font-semibold text-white">{issue.message}</p>
                            <p className="text-slate-400 font-mono text-xs mt-1">Path: {issue.path}</p>
                            {issue.expected && <p className="text-slate-500 text-xs mt-1">Expected: {issue.expected}</p>}
                        </li>
                    ))}
                </ul>
            )}
         </CardContent>
      </Card>
    </div>
  );
}
