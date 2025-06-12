
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, BarChart3, Globe, AlertTriangle, Filter, Map } from 'lucide-react';

interface BulkAnalysisProps {
  data: any;
  isLoading: boolean;
  onReturnToSingle: () => void;
  onRequestSelect?: (request: any) => void;
}

const BulkAnalysis: React.FC<BulkAnalysisProps> = ({ 
  data, 
  isLoading, 
  onReturnToSingle,
  onRequestSelect 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="gradient-card border-slate-700/50 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mr-3" />
            <span className="text-lg">Processing bulk file...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card className="gradient-card border-slate-700/50 p-12">
          <div className="text-center text-slate-400">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-medium mb-2">Upload File for Bulk Analysis</h3>
            <p>Drop a file or click to upload your bid request logs.</p>
          </div>
        </Card>
      </div>
    );
  }

  const healthStats = data.global_stats?.health || {};
  const total = healthStats.valid + healthStats.warnings + healthStats.errors;

  return (
    <div className="space-y-6">
      {/* File Summary Card */}
      <Card className="gradient-card border-slate-700/50 fade-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-500" />
              File Summary
            </h2>
            <Button variant="outline" size="sm" onClick={onReturnToSingle}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Single Mode
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">File</span>
              <span className="font-medium font-mono text-sm">{data.fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Requests</span>
              <span className="font-bold text-gradient text-lg">{data.totalRequests}</span>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4">
            <Button className="btn-primary flex-1">
              Re-Analyze
            </Button>
            <Button variant="outline" onClick={onReturnToSingle}>
              Clear File
            </Button>
          </div>
        </div>
      </Card>

      {/* Overall Health Card */}
      <Card className="gradient-card border-slate-700/50 slide-up">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
            Overall Health
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-2xl font-bold text-green-400">
                {total > 0 ? Math.round((healthStats.valid / total) * 100) : 0}%
              </p>
              <p className="text-slate-400 text-sm">Valid</p>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <p className="text-2xl font-bold text-orange-400">
                {total > 0 ? Math.round((healthStats.warnings / total) * 100) : 0}%
              </p>
              <p className="text-slate-400 text-sm">With Warnings</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-2xl font-bold text-red-400">
                {total > 0 ? Math.round((healthStats.errors / total) * 100) : 0}%
              </p>
              <p className="text-slate-400 text-sm">With Errors</p>
            </div>
          </div>

          {/* Request Type Distribution */}
          {data.global_stats?.requestTypes && (
            <div className="mb-6">
              <h4 className="font-medium mb-3">Request Type Distribution</h4>
              <div className="space-y-2">
                {Object.entries(data.global_stats.requestTypes).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm">{type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                          style={{ width: `${(count / data.totalRequests) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geographic Distribution */}
          {data.global_stats?.topCountries && (
            <div className="mb-6">
              <h4 className="font-medium mb-3 flex items-center">
                <Map className="w-4 h-4 mr-2 text-blue-500" />
                Top Countries
              </h4>
              <div className="space-y-2">
                {Object.entries(data.global_stats.topCountries).map(([country, count]: [string, any]) => (
                  <div key={country} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-sm">{country}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${(count / data.totalRequests) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Errors */}
          {data.global_stats?.topErrors && (
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                Top 5 Validation Errors
              </h4>
              <div className="space-y-2">
                {data.global_stats.topErrors.map((error: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-red-500/5 border border-red-500/20 rounded">
                    <span className="text-red-400 font-medium text-sm">#{index + 1}</span>
                    <span className="text-sm flex-1">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Advanced Filters Card */}
      <Card className="gradient-card border-slate-700/50 slide-up">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-orange-500" />
            Advanced Filters
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Device Type</label>
                <select className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm">
                  <option>All Types</option>
                  <option>Mobile</option>
                  <option>Desktop</option>
                  <option>Connected TV</option>
                  <option>Tablet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm">
                  <option>All Countries</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Germany</option>
                  <option>France</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Request Type</label>
                <select className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm">
                  <option>All Types</option>
                  <option>CTV</option>
                  <option>Display</option>
                  <option>Native</option>
                  <option>Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Validation Status</label>
                <select className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm">
                  <option>All Requests</option>
                  <option>Valid Only</option>
                  <option>With Warnings</option>
                  <option>With Errors</option>
                </select>
              </div>
            </div>
          </div>
          
          <Button className="btn-primary w-full mt-4">
            Apply Filters
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BulkAnalysis;
