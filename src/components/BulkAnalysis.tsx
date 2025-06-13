
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, BarChart3, Globe, AlertTriangle } from 'lucide-react';
import { analyzer, AnalysisResult, ValidationIssue } from '@/lib/analyzer';

interface BulkAnalysisProps {
  fileName: string;
  data: any[];
  onRequestSelect: (request: any) => void;
}

export const BulkAnalysis: React.FC<BulkAnalysisProps> = ({ fileName, data, onRequestSelect }) => {
    // In a real app, this analysis would be more sophisticated or passed as props
    const stats = {
        totalRequests: data.length,
        health: { valid: data.filter(r => analyzer.analyze(JSON.stringify(r)).issues.length === 0).length, errors: data.filter(r => analyzer.analyze(JSON.stringify(r)).issues.length > 0).length, warnings: 0 },
        // Add more stats calculation here as needed
    };

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                        <span>Bulk Analysis Summary</span>
                        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><ArrowLeft className="w-4 h-4 mr-2" />New Analysis</Button>
                    </CardTitle>
                    <p className="text-sm text-slate-400 pt-1">File: <span className="font-mono">{fileName}</span></p>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-white">{stats.totalRequests}</p>
                    <p className="text-slate-400">Total Requests Analyzed</p>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                        <div className="bg-green-900/30 p-2 rounded-lg"><p className="font-bold text-green-400">{stats.health.valid}</p><p className="text-xs text-slate-400">Valid</p></div>
                        <div className="bg-orange-900/30 p-2 rounded-lg"><p className="font-bold text-orange-400">{stats.health.warnings}</p><p className="text-xs text-slate-400">Warnings</p></div>
                        <div className="bg-red-900/30 p-2 rounded-lg"><p className="font-bold text-red-400">{stats.health.errors}</p><p className="text-xs text-slate-400">Errors</p></div>
                    </div>
                </CardContent>
            </Card>
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle className="text-lg">Requests List</CardTitle></CardHeader>
                <CardContent className="max-h-96 overflow-y-auto pr-2">
                    <div className="space-y-2">
                        {data.map((req, index) => (
                            <div key={req.id || index} onClick={() => onRequestSelect(req)} className="p-3 bg-slate-800/50 rounded-md hover:bg-slate-700/50 cursor-pointer transition-colors">
                                <p className="font-mono text-sm truncate">{req.id}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
             </Card>
        </div>
    );
};
