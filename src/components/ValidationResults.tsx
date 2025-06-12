
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, XCircle, Info, CheckCircle, Eye, Filter } from 'lucide-react';

interface ValidationResultsProps {
  results: any;
  isLoading: boolean;
  onIssueClick: (path: string) => void;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ results, isLoading, onIssueClick }) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="gradient-card border-slate-700/50 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mr-3" />
            <span className="text-lg">Analyzing bid request...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="space-y-6">
        <Card className="gradient-card border-slate-700/50 p-12">
          <div className="text-center text-slate-400">
            <Eye className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-medium mb-2">Ready for Analysis</h3>
            <p>Paste a bid request JSON and click "Analyze Request" to begin validation.</p>
          </div>
        </Card>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'Info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getSeverityCardClass = (severity: string) => {
    switch (severity) {
      case 'Error':
        return 'error-card';
      case 'Warning':
        return 'warning-card';
      case 'Info':
        return 'info-card';
      default:
        return '';
    }
  };

  const filteredIssues = activeFilter === 'All' 
    ? results.issues_found 
    : results.issues_found.filter((issue: any) => issue.severity === activeFilter);

  return (
    <div className="space-y-6">
      {/* Bid Request Analysis Card */}
      <Card className="gradient-card border-slate-700/50 fade-in">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Bid Request Analysis
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Request Type</span>
                <span className="font-medium text-gradient">{results.detected_characteristics.requestType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Media Format</span>
                <span className="font-medium">{results.detected_characteristics.mediaFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Impressions</span>
                <span className="font-medium">{results.detected_characteristics.impressions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform</span>
                <span className="font-medium">{results.detected_characteristics.platform}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Device Type</span>
                <span className="font-medium">{results.detected_characteristics.deviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Privacy Signals</span>
                <span className="font-medium">{results.detected_characteristics.privacySignals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timeout</span>
                <span className="font-medium">{results.detected_characteristics.timeout}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bid Floor</span>
                <span className="font-medium text-green-400">{results.detected_characteristics.bidFloor}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Validation Summary Cards */}
      <div className="grid grid-cols-3 gap-4 slide-up">
        <div className="metric-card">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-3xl font-bold text-red-400">{results.validation_summary.errors}</p>
              <p className="text-slate-400 font-medium">Errors</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-3xl font-bold text-orange-400">{results.validation_summary.warnings}</p>
              <p className="text-slate-400 font-medium">Warnings</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="metric-card">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-3xl font-bold text-blue-400">{results.validation_summary.info}</p>
              <p className="text-slate-400 font-medium">Info</p>
            </div>
            <Info className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Issues Found Card */}
      <Card className="gradient-card border-slate-700/50 slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Filter className="w-5 h-5 mr-2 text-orange-500" />
              Issues Found
            </h2>
            
            <div className="flex space-x-2">
              {['All', 'Error', 'Warning', 'Info'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    activeFilter === filter
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredIssues.map((issue: any, index: number) => (
              <div
                key={index}
                onClick={() => onIssueClick(issue.path)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${getSeverityCardClass(issue.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{issue.severity}</p>
                      <code className="text-xs bg-slate-800/50 px-2 py-1 rounded text-orange-400">
                        {issue.path}
                      </code>
                    </div>
                    <p className="text-slate-300 text-sm">{issue.message}</p>
                    {issue.line && (
                      <p className="text-slate-500 text-xs mt-1">Line {issue.line}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredIssues.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>No {activeFilter.toLowerCase()} issues found!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ValidationResults;
