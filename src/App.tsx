
import { useReducer, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster, toast } from '@/components/ui/sonner';
import { analyzer, AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { exampleData } from '@/lib/exampleData';

// --- TYPE DEFINITIONS for State Management ---
interface AppState {
  isLoading: boolean;
  jsonText: string;
  analysisResult: AnalysisResult | null;
  validationIssues: ValidationIssue[];
}

type AppAction =
  | { type: 'START_ANALYSIS' }
  | { type: 'SET_ANALYSIS_RESULT'; payload: { analysis: AnalysisResult | null; issues: ValidationIssue[] } }
  | { type: 'SET_JSON_TEXT'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR' };

const initialState: AppState = {
  isLoading: false,
  jsonText: JSON.stringify(exampleData['valid-ctv'], null, 2),
  analysisResult: null,
  validationIssues: [],
};

// --- STATE MANAGEMENT REDUCER ---
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return { ...state, isLoading: true };
    case 'SET_ANALYSIS_RESULT':
      return { ...state, isLoading: false, analysisResult: action.payload.analysis, validationIssues: action.payload.issues };
    case 'SET_JSON_TEXT':
        return {...state, jsonText: action.payload, analysisResult: null, validationIssues: []};
    case 'SET_ERROR':
      toast.error(action.payload);
      return { ...state, isLoading: false, analysisResult: { error: action.payload, requestType: "Error", mediaFormats: [], impressions: 0, platform: "", deviceType: "", geo: "" } };
    case 'CLEAR':
      return { ...initialState, jsonText: '' };
    default:
      throw new Error('Unhandled action type');
  }
}

// --- UI SUB-COMPONENTS ---
const Header = () => (
    <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">BABE Verificator</h1>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
            <Button variant="secondary" className="bg-white text-slate-900 hover:bg-slate-200 pointer-events-none">Single Mode</Button>
            <Button variant="ghost">Bulk Mode</Button>
        </div>
    </header>
);

const JsonEditor = ({ jsonText, onTextChange }: { jsonText: string; onTextChange: (text: string) => void }) => (
    <textarea
        value={jsonText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste your OpenRTB bid request here..."
        className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-300 resize-none border border-slate-700"
        spellCheck="false"
    />
);

const ResultsPanel = ({ analysis, issues }: { analysis: AnalysisResult | null; issues: ValidationIssue[] }) => {
    if (!analysis) {
        return (
            <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                    <div className="text-6xl text-slate-600 mb-4">👁️</div>
                    <h3 className="text-xl font-bold text-white">Ready for Analysis</h3>
                    <p className="text-slate-400 mt-1">Paste a bid request and click "Analyze" to begin.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle className="text-lg">Request Characteristics</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-slate-400">Request Type</p><p className="font-bold text-lg text-amber-400">{analysis.requestType}</p></div>
                    <div><p className="text-slate-400">Impressions</p><p className="font-bold text-lg">{analysis.impressions}</p></div>
                    <div><p className="text-slate-400">Media Formats</p><p className="font-bold">{analysis.mediaFormats.join(', ')}</p></div>
                    <div><p className="text-slate-400">Platform</p><p className="font-bold">{analysis.platform}</p></div>
                    <div><p className="text-slate-400">Device Type</p><p className="font-bold">{analysis.deviceType}</p></div>
                    <div><p className="text-slate-400">Geography</p><p className="font-bold">{analysis.geo}</p></div>
                </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
                 <CardHeader><CardTitle className="text-lg">Validation Issues ({issues.length})</CardTitle></CardHeader>
                 <CardContent>
                    {issues.length === 0 ? (
                        <div className="text-center py-4 text-green-400 flex items-center justify-center">✅ No issues found.</div>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {issues.map((issue, i) => (
                                <li key={i} className={`text-sm p-3 rounded-md border-l-4 ${issue.severity === 'Error' ? 'border-red-500 bg-red-900/20' : 'border-amber-500 bg-amber-900/20'}`}>
                                    <p className="font-semibold">{issue.message}</p>
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
export default function App() {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const handleAnalyze = useCallback(() => {
        if (!state.jsonText) {
            toast.error("Input is empty.");
            return;
        }
        dispatch({ type: 'START_ANALYSIS' });
        setTimeout(() => {
            const { analysis, issues } = analyzer.analyze(state.jsonText);
            if (analysis && !analysis.error) {
                dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { analysis, issues } });
                toast.success("Analysis complete!");
            } else {
                dispatch({ type: 'SET_ERROR', payload: analysis?.error || "An unknown error occurred." });
            }
        }, 300); // Simulate network latency
    }, [state.jsonText]);

    const handleLoadExample = useCallback((key: keyof typeof exampleData) => {
        const text = JSON.stringify(exampleData[key], null, 2);
        dispatch({ type: 'SET_JSON_TEXT', payload: text });
    }, []);
    
    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(state.jsonText);
            dispatch({ type: 'SET_JSON_TEXT', payload: JSON.stringify(parsed, null, 2) });
        } catch {
            toast.error("Cannot format invalid JSON.");
        }
    }, [state.jsonText]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <main className="container mx-auto p-4 md:p-8">
                <Header />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                        <Card className="bg-slate-900 border-slate-800">
                             <CardHeader className="flex flex-row items-center justify-between py-4">
                                <CardTitle className="text-lg">Bid Request Input</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={handleFormat}>Format JSON</Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">Load Example</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('valid-ctv')}>Valid CTV Ad</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('multi-impression')}>Multi-Impression</DropdownMenuItem>
                                             <DropdownMenuItem onSelect={() => handleLoadExample('error-missing-id')}>Missing ID Error</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <JsonEditor jsonText={state.jsonText} onTextChange={(text) => dispatch({ type: 'SET_JSON_TEXT', payload: text })} />
                            </CardContent>
                        </Card>
                         <div className="flex items-center space-x-4">
                            <Button onClick={handleAnalyze} disabled={state.isLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 text-base">
                                {state.isLoading ? '⚡ Analyzing...' : '🔍 Analyze Request'}
                            </Button>
                            <Button variant="outline" onClick={() => dispatch({ type: 'CLEAR' })}>🗑️</Button>
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <ResultsPanel analysis={state.analysisResult} issues={state.validationIssues} />
                    </div>
                </div>
            </main>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    );
}
