
// FILE: src/pages/Index.tsx

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Play, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { analyzer, AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { exampleBidRequests } from '@/lib/exampleData';

// --- UI SUB-COMPONENTS (Self-Contained for clarity) ---

const Header = ({ mode, setMode }: { mode: string, setMode: (m: 'single' | 'bulk') => void }) => (
    <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">BABE Verificator</h1>
                    <p className="text-sm text-slate-400">NextGen OpenRTB Analysis</p>
                </div>
            </div>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'single' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Single Mode
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all text-slate-400 hover:text-white"
              onClick={() => toast.info("Bulk Mode coming soon!")}
            >
              Bulk Mode
            </button>
        </div>
    </header>
);

const JsonEditor = ({ jsonText, onTextChange }: { jsonText: string; onTextChange: (text: string) => void }) => {
    return (
        <div className="relative bg-slate-900 rounded-lg border border-slate-700 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
            <textarea
                value={jsonText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Paste your OpenRTB bid request here..."
                className="w-full h-full min-h-[400px] lg:min-h-[500px] p-4 font-mono text-sm bg-transparent rounded-md focus:outline-none text-slate-300 resize-none"
                spellCheck="false"
            />
        </div>
    );
};

const ResultsPanel = ({ analysis, issues, isLoading }: { analysis: AnalysisResult | null; issues: ValidationIssue[]; isLoading: boolean }) => {
    const severityClasses = {
        Error: "border-red-500 bg-red-900/20 text-red-400",
        Warning: "border-orange-500 bg-orange-900/20 text-orange-400",
        Info: "border-blue-500 bg-blue-900/20 text-blue-400"
    };

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
                    <div><p className="text-slate-400">Media Formats</p><p className="font-bold text-white">{analysis.mediaFormats.join(', ')}</p></div>
                    <div><p className="text-slate-400">Platform</p><p className="font-bold text-white">{analysis.platform}</p></div>
                    <div><p className="text-slate-400">Device Type</p><p className="font-bold text-white">{analysis.deviceType}</p></div>
                    <div><p className="text-slate-400">Geography</p><p className="font-bold text-white">{analysis.geo}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
                 <CardHeader><CardTitle className="text-lg text-white">Validation Summary</CardTitle></CardHeader>
                 <CardContent>
                    {issues.length === 0 ? (
                        <div className="text-center py-4 text-green-400 flex items-center justify-center"><CheckCircle className="mr-2"/>No issues found.</div>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {issues.map((issue, i) => (
                                <li key={i} className={`text-sm p-3 rounded-md border-l-4 ${severityClasses[issue.severity]}`}>
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


// --- MAIN APP COMPONENT ---
export default function IndexPage() {
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [jsonText, setJsonText] = useState(exampleBidRequests['valid-ctv']);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [issues, setIssues] = useState<ValidationIssue[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = useCallback(() => {
        if (!jsonText.trim()) {
            toast.error("Input is empty. Please paste a bid request.");
            return;
        }
        setIsLoading(true);
        // Simulate analysis delay for UX
        setTimeout(() => {
            const { analysis, issues } = analyzer.analyze(jsonText);
            setAnalysisResult(analysis);
            setIssues(issues);
            setIsLoading(false);
            if(analysis && !analysis.error) {
                toast.success("Analysis complete!", {
                    description: `${issues.length} issue(s) found.`
                });
            } else {
                toast.error(analysis?.error || "An unknown analysis error occurred.");
            }
        }, 500); 
    }, [jsonText]);
    
    const handleLoadExample = useCallback((key: keyof typeof exampleBidRequests) => {
        setJsonText(exampleBidRequests[key]);
        setAnalysisResult(null);
        setIssues([]);
    }, []);

    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(jsonText);
            setJsonText(JSON.stringify(parsed, null, 2));
            toast.info("JSON has been formatted.");
        } catch {
            toast.error("Cannot format invalid JSON.");
        }
    }, [jsonText]);

    const handleClear = useCallback(() => {
        setJsonText('');
        setAnalysisResult(null);
        setIssues([]);
    }, []);


    return (
        <div className="min-h-screen bg-[#0c111d] text-slate-200">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Header mode={mode} setMode={setMode} />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
                                <CardTitle className="text-lg">Bid Request Input</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={handleFormat}>Format JSON</Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">Load Example</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('valid-ctv')}>Valid CTV Ad</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('valid-multi-impression')}>Multi-Impression</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('error-privacy')}>Privacy Error</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('malformed-json')}>Malformed JSON</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2 pt-0">
                                <JsonEditor jsonText={jsonText} onTextChange={setJsonText} />
                            </CardContent>
                        </Card>
                         <div className="flex items-center space-x-4">
                            <Button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold py-3 text-base">
                                {isLoading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                                {isLoading ? 'Analyzing...' : 'Analyze Request'}
                            </Button>
                            <Button variant="outline" onClick={handleClear} className="border-slate-700 hover:bg-slate-800"><Trash2 className="w-5 h-5"/></Button>
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <ResultsPanel analysis={analysisResult} issues={issues} isLoading={isLoading} />
                    </div>
                </div>
            </main>
        </div>
    );
}
