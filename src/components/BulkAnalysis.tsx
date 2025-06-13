
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3 } from 'lucide-react';

interface BulkAnalysisProps {
  data: any;
  isLoading: boolean;
  onRequestSelect: (request: any) => void;
}

export default function BulkAnalysis({ data, isLoading, onRequestSelect }: BulkAnalysisProps) {
  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full" />
          <p className="ml-4 text-slate-400">Processing file...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white">Upload a File</h3>
          <p className="text-slate-400 mt-1">Upload a file containing OpenRTB bid requests for bulk analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            File Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-400">Filename</p><p className="font-bold text-white">{data.filename}</p></div>
            <div><p className="text-slate-400">Total Requests</p><p className="font-bold text-lg text-orange-400">{data.totalRequests}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Global Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-700">
              <p className="text-green-400 font-bold text-2xl">{data.stats?.valid || 0}</p>
              <p className="text-slate-400 text-sm">Valid</p>
            </div>
            <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-700">
              <p className="text-orange-400 font-bold text-2xl">{data.stats?.warnings || 0}</p>
              <p className="text-slate-400 text-sm">Warnings</p>
            </div>
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-700">
              <p className="text-red-400 font-bold text-2xl">{data.stats?.errors || 0}</p>
              <p className="text-slate-400 text-sm">Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Request List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.requests?.map((request: any, index: number) => (
              <div
                key={index}
                className="p-3 bg-slate-800 rounded-md hover:bg-slate-700 cursor-pointer transition-colors"
                onClick={() => onRequestSelect(request)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-slate-300">
                    ID: {request.id || `Request ${index + 1}`}
                  </span>
                  <Button variant="outline" size="sm" className="text-xs">
                    Analyze
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {request.imp?.length || 0} impressions • {request.app ? 'App' : 'Site'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
