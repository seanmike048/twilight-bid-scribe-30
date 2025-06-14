
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';
import { FileText, Play, Trash2, ChevronDown } from 'lucide-react';

import { analyzer, AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { exampleBidRequests } from '@/lib/exampleData';
import { ValidationResults } from '@/components/ValidationResults';
import { BulkAnalysis } from '@/components/BulkAnalysis';
import { FileUpload } from '@/components/FileUpload';

const Header = ({ mode, setMode }: { mode: 'single' | 'bulk', setMode: (m: 'single' | 'bulk') => void }) => (
    <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">BABE Verificator</h1>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
            <Button 
              variant={mode === 'single' ? 'secondary' : 'ghost'} 
              className={mode === 'single' ? 'bg-white text-slate-900 hover:bg-slate-200' : ''}
              onClick={() => setMode('single')}
            >
              Single Mode
            </Button>
            <Button 
              variant={mode === 'bulk' ? 'secondary' : 'ghost'}
              className={mode === 'bulk' ? 'bg-white text-slate-900 hover:bg-slate-200' : ''}
              onClick={() => setMode('bulk')}
            >
              Bulk Mode
            </Button>
        </div>
    </header>
);

const JsonEditor = ({ jsonText, onTextChange }: { jsonText: string; onTextChange: (text: string) => void }) => (
    <div className="h-full min-h-[400px] max-h-[500px] overflow-hidden">
        <textarea
            value={jsonText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste your OpenRTB bid request here..."
            className="w-full h-full p-4 font-mono text-sm bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-300 resize-none border border-slate-700 overflow-y-auto"
            spellCheck="false"
        />
    </div>
);

const ExamplesDropdown = ({ onLoadExample }: { onLoadExample: (key: keyof typeof exampleBidRequests) => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
                Load Example <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => onLoadExample('display')}>Display Banner</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('video')}>Video Ad</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('native')}>Native Ad</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('ctv')}>Connected TV</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('audio')}>Audio Ad</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('gdpr')}>GDPR Example</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('error-privacy')}>Privacy Error</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLoadExample('malformed-json')}>Malformed JSON</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

export default function IndexPage() {
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [isLoading, setIsLoading] = useState(false);
    const [jsonText, setJsonText] = useState(exampleBidRequests['display']);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [fileName, setFileName] = useState('');
    const [bulkRequests, setBulkRequests] = useState<any[]>([]);

    const handleAnalyze = useCallback(async () => {
        if (!jsonText.trim()) {
            toast.error("Input is empty.");
            return;
        }
        
        setIsLoading(true);
        
        // Add small delay for better UX
        setTimeout(() => {
            const { analysis, issues } = analyzer.analyze(jsonText);
            setAnalysisResult(analysis);
            setValidationIssues(issues);
            setIsLoading(false);
            
            if (analysis && !analysis.error) {
                toast.success("Analysis complete!", { description: `${issues.length} issue(s) found.` });
            } else {
                toast.error(analysis?.error || "An unknown analysis error occurred.");
            }
        }, 300);
    }, [jsonText]);

    const handleLoadExample = useCallback((key: keyof typeof exampleBidRequests) => {
        setJsonText(exampleBidRequests[key]);
        setAnalysisResult(null);
        setValidationIssues([]);
    }, []);

    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(jsonText);
            setJsonText(JSON.stringify(parsed, null, 2));
        } catch {
            toast.error("Cannot format invalid JSON.");
        }
    }, [jsonText]);

    const handleFileUpload = useCallback((file: File) => {
        setIsLoading(true);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const requests = text.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
                
                setMode('bulk');
                setFileName(file.name);
                setBulkRequests(requests);
                setIsLoading(false);
                
                toast.success(`${requests.length} requests loaded from ${file.name}`);
            } catch (e) {
                setIsLoading(false);
                setAnalysisResult({ 
                    summary: {
                        requestType: 'Unknown', 
                        mediaFormats: [], 
                        impressions: 0, 
                        platform: 'Unknown', 
                        deviceType: 'Unknown', 
                        geo: 'N/A'
                    },
                    issues: [],
                    request: undefined,
                    error: 'Failed to parse log file. Ensure it contains one valid JSON per line.'
                });
                setValidationIssues([]);
                toast.error('Failed to parse log file');
            }
        };
        
        reader.readAsText(file);
    }, []);

    const handleRequestSelection = useCallback((request: any) => {
        setMode('single');
        setJsonText(JSON.stringify(request, null, 2));
        setAnalysisResult(null);
        setValidationIssues([]);
        
        // Auto-analyze the selected request
        setTimeout(() => {
            const { analysis, issues } = analyzer.analyze(JSON.stringify(request, null, 2));
            setAnalysisResult(analysis);
            setValidationIssues(issues);
        }, 100);
    }, []);

    const handleClear = useCallback(() => {
        setJsonText('');
        setAnalysisResult(null);
        setValidationIssues([]);
    }, []);

    const switchMode = useCallback((newMode: 'single' | 'bulk') => {
        setMode(newMode);
        if (newMode === 'single') {
            setJsonText('');
            setAnalysisResult(null);
            setValidationIssues([]);
        } else {
            setBulkRequests([]);
            setFileName('');
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#0c111d] text-slate-200 font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Header mode={mode} setMode={switchMode} />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                        {mode === 'single' ? (
                            <Card className="bg-slate-900 border-slate-800 flex flex-col h-full">
                                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-800">
                                    <CardTitle className="text-lg flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-orange-400" />
                                        Bid Request Input
                                    </CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={handleFormat}>Format</Button>
                                        <ExamplesDropdown onLoadExample={handleLoadExample} />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-2 flex-grow">
                                    <JsonEditor jsonText={jsonText} onTextChange={setJsonText} />
                                </CardContent>
                                <div className="p-4 border-t border-slate-800 flex items-center space-x-4">
                                    <Button 
                                        onClick={handleAnalyze} 
                                        disabled={isLoading || !jsonText} 
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold py-3 text-base"
                                    >
                                        {isLoading ? (
                                            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2" />
                                        ) : (
                                            <Play className="w-5 h-5 mr-2" />
                                        )}
                                        {isLoading ? 'Analyzing...' : 'Analyze Request'}
                                    </Button>
                                    <Button variant="outline" onClick={handleClear}>
                                        <Trash2 className="w-5 h-5"/>
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <FileUpload onFileUpload={handleFileUpload} />
                        )}
                    </div>
                    
                    <div className="lg:col-span-7">
                        {mode === 'single' ? (
                            <ValidationResults 
                                analysis={analysisResult} 
                                issues={validationIssues} 
                                isLoading={isLoading} 
                            />
                        ) : (
                            <BulkAnalysis 
                                data={bulkRequests} 
                                fileName={fileName}
                                onRequestSelect={handleRequestSelection} 
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </div>
            </main>
            <Toaster theme="dark" position="bottom-right" richColors />
        </div>
    );
}
