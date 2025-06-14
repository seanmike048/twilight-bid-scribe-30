import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, BarChart3, Globe, AlertTriangle, CheckCircle, PieChart } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, XAxis, YAxis, Tooltip, Bar, Legend } from 'recharts';
import { analyzer } from '@/lib/analyzer';

interface BulkAnalysisProps {
  fileName: string;
  data: any[];
  onRequestSelect: (request: any) => void;
  isLoading: boolean;
}

const COLORS = {
  valid: '#22c55e', // green-500
  warnings: '#f97316', // orange-500
  errors: '#ef4444', // red-500
};

export const BulkAnalysis: React.FC<BulkAnalysisProps> = ({ 
  fileName, 
  data, 
  onRequestSelect, 
  isLoading 
}) => {
  const analysisStats = useMemo(() => {
    if (!data.length) return null;
    
    const requestStats = data.map((req, index) => {
      const { analysis, issues } = analyzer.analyze(JSON.stringify(req));
      const errors = issues.filter(i => i.severity === 'Error').length;
      return {
        index,
        request: req,
        analysis,
        issues,
        errors,
        warnings: issues.filter(i => i.severity === 'Warning').length,
        hasIssues: issues.length > 0,
        status: errors > 0 ? 'errors' : issues.length > 0 ? 'warnings' : 'valid'
      };
    });

    const health = {
      valid: requestStats.filter(s => s.status === 'valid').length,
      warnings: requestStats.filter(s => s.status === 'warnings').length,
      errors: requestStats.filter(s => s.status === 'errors').length,
    };
    const healthData = [
      { name: 'Valid', value: health.valid, fill: COLORS.valid },
      { name: 'Warnings', value: health.warnings, fill: COLORS.warnings },
      { name: 'Errors', value: health.errors, fill: COLORS.errors },
    ].filter(d => d.value > 0);

    const requestTypes = requestStats.reduce((acc, stat) => {
      const type = stat.analysis?.summary?.requestType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const requestTypesData = Object.entries(requestTypes).map(([name, value]) => ({ name, count: value }));

    const countries = requestStats.reduce((acc, stat) => {
      const country = stat.request?.device?.geo?.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topCountries = Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, count: value }));

    return {
      totalRequests: data.length,
      health,
      healthData,
      requestTypesData,
      topCountries,
      requestStats
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800">
        <div className="animate-spin w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full" />
        <p className="mt-4 text-slate-400">Processing bulk data...</p>
      </Card>
    );
  }

  if (!analysisStats || !data.length) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800 min-h-[500px]">
        <FileText className="w-12 h-12 mb-4 text-slate-600" />
        <h3 className="text-xl font-bold text-white">Ready for Bulk Analysis</h3>
        <p className="text-slate-400 mt-1">Upload a file containing bid requests (one JSON per line).</p>
      </Card>
    );
  }
  
  const { totalRequests, healthData, requestTypesData, topCountries, requestStats } = analysisStats;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Bulk Analysis: <span className="text-amber-400 font-mono">{fileName}</span></span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </CardTitle>
          <p className="text-sm text-slate-400 pt-1">
            {totalRequests} Total Requests Analyzed
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center"><PieChart className="w-4 h-4 mr-2" />Overall Health</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={healthData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {healthData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}}/>
                <Legend/>
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
           <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center"><BarChart3 className="w-4 h-4 mr-2" />Request Types</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestTypesData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} stroke="#94a3b8" fontSize={12} />
                  <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155'}} />
                  <Bar dataKey="count" fill="#f97316" barSize={15} />
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg">Requests List</CardTitle>
          <p className="text-sm text-slate-400">Click on any request to analyze it individually</p>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-42rem)] overflow-y-auto pr-2">
          <div className="space-y-2">
            {requestStats.map((stat, index) => (
              <div 
                key={stat.request.id || index} 
                onClick={() => onRequestSelect(stat.request)} 
                className="p-3 bg-slate-800/50 rounded-md hover:bg-slate-700/50 cursor-pointer transition-colors flex justify-between items-center"
              >
                <div className="flex-1 overflow-hidden">
                  <p className="font-mono text-sm text-white truncate">
                    ID: {stat.request.id || `Request ${index + 1}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Type: {stat.analysis?.summary?.requestType || 'Unknown'} &bull; Platform: {stat.analysis?.summary?.platform || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  {stat.status === 'errors' && <Badge variant="destructive">{stat.errors} Errors</Badge>}
                  {stat.status === 'warnings' && <Badge variant="secondary" className="bg-orange-400/20 text-orange-400">{stat.warnings} Warnings</Badge>}
                  {stat.status === 'valid' && <Badge variant="secondary" className="bg-green-400/20 text-green-400">Valid</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
