
import React, { useState, useCallback, useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';
import { FileText, Play, Trash2, ChevronDown } from 'lucide-react';

import { analyzer, AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { exampleBidRequests } from '@/utils/exampleData';
import { ValidationResults } from '@/components/ValidationResults';
import { BulkAnalysis } from '@/components/BulkAnalysis';
import { FileUpload } from '@/components/FileUpload';

// --- STATE MANAGEMENT ---
type AppState = {
  mode: 'single' | 'bulk';
  isLoading: boolean;
  jsonText: string;
  analysisResult: AnalysisResult | null;
  validationIssues: ValidationIssue[];
  fileName: string;
  bulkRequests: any[];
};

type AppAction =
  | { type: 'SET_MODE'; payload: 'single' | 'bulk' }
  | { type: 'START_ANALYSIS' }
  | { type: 'SET_SINGLE_RESULT'; payload: { analysis: AnalysisResult | null; issues: ValidationIssue[] } }
  | { type: 'SET_JSON_TEXT'; payload: string }
  | { type: 'SET_BULK_DATA'; payload: { fileName: string; requests: any[] } }
  | { type: 'CLEAR_SINGLE' };

const initialState: AppState = {
  mode: 'single',
  isLoading: false,
  jsonText: exampleBidRequests['valid-ctv'],
  analysisResult: null,
  validationIssues: [],
  fileName: '',
  bulkRequests: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...initialState, jsonText: '', mode: action.payload };
    case 'START_ANALYSIS':
      return { ...state, isLoading: true };
    case 'SET_JSON_TEXT':
      return { ...state, jsonText: action.payload, analysisResult: null, validationIssues: [] };
    case 'SET_SINGLE_RESULT':
      return { ...state, isLoading: false, analysisResult: action.payload.analysis, validationIssues: action.payload.issues };
    case 'SET_BULK_DATA':
      return { ...state, isLoading: false, mode: 'bulk', fileName: action.payload.fileName, bulkRequests: action.payload.requests, jsonText: '', analysisResult: null, validationIssues: [] };
    case 'CLEAR_SINGLE':
       return { ...state, jsonText: '', analysisResult: null, validationIssues: [] };
    default:
      return state;
  }
}


// --- MAIN PAGE ---
export default function IndexPage() {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const handleAnalyze = useCallback(() => {
        if (!state.jsonText.trim()) {
            toast.error("Input is empty.");
            return;
        }
        dispatch({ type: 'START_ANALYSIS' });
        setTimeout(() => {
            const { analysis, issues } = analyzer.analyze(state.jsonText);
            dispatch({ type: 'SET_SINGLE_RESULT', payload: { analysis, issues } });
            if (analysis && !analysis.error) {
                toast.success("Analysis complete!", { description: `${issues.length} issue(s) found.` });
            } else {
                toast.error(analysis?.error || "An unknown analysis error occurred.");
            }
        }, 300);
    }, [state.jsonText]);

    const handleLoadExample = useCallback((key: keyof typeof exampleBidRequests) => {
        dispatch({ type: 'SET_JSON_TEXT', payload: JSON.stringify(exampleBidRequests[key], null, 2) });
    }, []);

    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(state.jsonText);
            dispatch({ type: 'SET_JSON_TEXT', payload: JSON.stringify(parsed, null, 2) });
        } catch {
            toast.error("Cannot format invalid JSON.");
        }
    }, [state.jsonText]);

    const handleFileUpload = useCallback((file: File) => {
        dispatch({ type: 'START_ANALYSIS' });
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const requests = text.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
                dispatch({ type: 'SET_BULK_DATA', payload: { fileName: file.name, requests } });
                toast.success(`${requests.length} requests loaded from ${file.name}`);
            } catch (e) {
                 dispatch({ type: 'SET_SINGLE_RESULT', payload: { analysis: { error: 'Failed to parse log file. Ensure it contains one valid JSON per line.' }, issues: [] } });
            }
        };
        reader.readAsText(file);
    }, []);

    const handleSelectRequestFromBulk = useCallback((request: any) => {
        dispatch({ type: 'SET_MODE', payload: 'single' });
        // Use a timeout to ensure the UI switches before setting the text and analyzing
        setTimeout(() => {
            dispatch({ type: 'SET_JSON_TEXT', payload: JSON.stringify(request, null, 2) });
        }, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#0c111d] text-slate-200 font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Header mode={state.mode} setMode={(m) => dispatch({ type: 'SET_MODE', payload: m })} />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 flex flex-col space-y-4">
                        {state.mode === 'single' ? (
                            <Card className="bg-slate-900 border-slate-800 flex flex-col h-full">
                                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-800">
                                    <CardTitle className="text-lg flex items-center"><FileText className="w-5 h-5 mr-2 text-orange-400" />Bid Request Input</CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={handleFormat}>Format</Button>
                                        <ExamplesDropdown onLoadExample={handleLoadExample} />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-2 flex-grow">
                                    <JsonEditor jsonText={state.jsonText} onTextChange={(text) => dispatch({ type: 'SET_JSON_TEXT', payload: text })} />
                                </CardContent>
                                <div className="p-4 border-t border-slate-800 flex items-center space-x-4">
                                    <Button onClick={handleAnalyze} disabled={state.isLoading || !state.jsonText} className="w-full bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold py-3 text-base">
                                        {state.isLoading ? <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                                        {state.isLoading ? 'Analyzing...' : 'Analyze Request'}
                                    </Button>
                                    <Button variant="outline" onClick={() => dispatch({ type: 'CLEAR_SINGLE' })}><Trash2 className="w-5 h-5"/></Button>
                                </div>
                            </Card>
                        ) : (
                            <BulkAnalysis data={state.bulkRequests} fileName={state.fileName} onRequestSelect={handleSelectRequestFromBulk} />
                        )}
                    </div>
                    <div className="lg:col-span-7">
                        <ValidationResults analysis={state.analysisResult} issues={state.validationIssues} isLoading={state.isLoading} />
                    </div>
                </div>
            </main>
            <Toaster theme="dark" position="bottom-right" richColors />
        </div>
    );
}
