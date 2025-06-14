
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, BarChart3, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzer } from '@/lib/analyzer';

interface BulkAnalysisProps {
  fileName: string;
  data: any[];
  onRequestSelect: (request: any) => void;
  isLoading: boolean;
}

export const BulkAnalysis: React.FC<BulkAnalysisProps> = ({ 
  fileName, 
  data, 
  onRequestSelect, 
  isLoading 
}) => {
  const analysisStats = useMemo(() => {
    if (!data.length) return null;
    
    // Analyze each request
    const requestStats = data.map((req, index) => {
      const { analysis, issues } = analyzer.analyze(JSON.stringify(req));
      return {
        index,
        request: req,
        analysis,
        issues,
        errors: issues.filter(i => i.severity === 'Error').length,
        warnings: issues.filter(i => i.severity === 'Warning').length,
        hasIssues: issues.length > 0
      };
    });

    // Calculate overall health
    const health = {
      valid: requestStats.filter(s => !s.hasIssues).length,
      errors: requestStats.filter(s => s.errors > 0).length,
      warnings: requestStats.filter(s => s.warnings > 0 && s.errors === 0).length
    };

    // Calculate request types
    const requestTypes = requestStats.reduce((acc, stat) => {
      const type = stat.analysis?.summary?.requestType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate top countries
    const countries = requestStats.reduce((acc, stat) => {
      const country = stat.request?.device?.geo?.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountries = Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalRequests: data.length,
      health,
      requestTypes,
      topCountries,
      requestStats
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800 min-h-[500px]">
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

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Bulk Analysis Summary</span>
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
            File: <span className="font-mono">{fileName}</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-4xl font-bold text-white">{analysisStats.totalRequests}</p>
            <p className="text-slate-400">Total Requests Analyzed</p>
          </div>
          
          {/* Health Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-900/30 p-3 rounded-lg text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="font-bold text-green-400 text-xl">{analysisStats.health.valid}</p>
              <p className="text-xs text-slate-400">Valid</p>
            </div>
            <div className="bg-orange-900/30 p-3 rounded-lg text-center">
              <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-1" />
              <p className="font-bold text-orange-400 text-xl">{analysisStats.health.warnings}</p>
              <p className="text-xs text-slate-400">Warnings</p>
            </div>
            <div className="bg-red-900/30 p-3 rounded-lg text-center">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <p className="font-bold text-red-400 text-xl">{analysisStats.health.errors}</p>
              <p className="text-xs text-slate-400">Errors</p>
            </div>
          </div>

          {/* Request Types */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Request Types
            </h4>
            <div className="space-y-2">
              {Object.entries(analysisStats.requestTypes).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{type}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-800 rounded-full h-2 mr-2">
                      <div 
                        className="bg-orange-400 h-2 rounded-full" 
                        style={{ width: `${(count / analysisStats.totalRequests) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Top Countries
            </h4>
            <div className="space-y-2">
              {analysisStats.topCountries.map(([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{country}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-800 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ width: `${(count / analysisStats.totalRequests) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg">Requests List</CardTitle>
          <p className="text-sm text-slate-400">Click on any request to analyze it individually</p>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto pr-2">
          <div className="space-y-2">
            {analysisStats.requestStats.map((stat, index) => (
              <div 
                key={stat.request.id || index} 
                onClick={() => onRequestSelect(stat.request)} 
                className="p-3 bg-slate-800/50 rounded-md hover:bg-slate-700/50 cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-orange-400"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-white truncate">
                      ID: {stat.request.id || `Request ${index + 1}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Type: {stat.analysis?.summary?.requestType || 'Unknown'} • 
                      Platform: {stat.analysis?.summary?.platform || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {stat.errors > 0 && (
                      <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs">
                        {stat.errors} errors
                      </span>
                    )}
                    {stat.warnings > 0 && (
                      <span className="bg-orange-900/30 text-orange-400 px-2 py-1 rounded text-xs">
                        {stat.warnings} warnings
                      </span>
                    )}
                    {!stat.hasIssues && (
                      <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs">
                        Valid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
