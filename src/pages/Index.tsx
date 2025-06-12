import { useCallback, useReducer, memo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Component Imports
import { JsonEditor } from '@/components/JsonEditor';
import { ValidationResults } from '@/components/ValidationResults';
import { RequestCharacteristics } from '@/components/RequestCharacteristics';
import { ExamplesDropdown } from '@/components/ExamplesDropdown';
import { FileUpload } from '@/components/FileUpload';
import { BulkAnalysis } from '@/components/BulkAnalysis';
import { ValidationModeSelector } from '@/components/ValidationModeSelector';

// --- OPTIMIZATION 1: Strong TypeScript Interfaces ---
// Defining clear types for our data makes the entire application more robust and predictable.
interface ValidationIssue {
  severity: 'Error' | 'Warning' | 'Info';
  message: string;
  path: string;
}

interface AnalysisDetail {
  deviceType?: string;
  timeout?: string;
  currency?: string;
  schainNodes?: string;
  bidFloor?: string;
  privacySignals?: string[];
  country?: string;
}

interface AnalysisResult {
  requestType: string;
  mediaFormat: string;
  impressions: number;
  platform: string;
  details: AnalysisDetail;
}

interface BidRequest {
  id: string;
  imp: object[];
  // Add other common bid request fields if needed for typing
}

interface AppState {
  mode: 'single' | 'bulk';
  isLoading: boolean;
  jsonText: string;
  parsedJson: BidRequest | null;
  analysisResult: AnalysisResult | null;
  validationIssues: ValidationIssue[];
  
  // Bulk mode specific state
  bulkRequests: BidRequest[];
  fileName: string;
}

// --- OPTIMIZATION 2: Centralized State Management with useReducer ---
// This reducer manages all state transitions in one place, making the logic cleaner
// than scattering multiple useState calls.
type AppAction =
  | { type: 'SET_MODE'; payload: 'single' | 'bulk' }
  | { type: 'SET_JSON_TEXT'; payload: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'SET_SINGLE_RESULT'; payload: { analysis: AnalysisResult; issues: ValidationIssue[]; json: BidRequest; text: string } }
  | { type: 'SET_BULK_RESULT'; payload: { requests: BidRequest[]; fileName: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR' };

const initialState: AppState = {
  mode: 'single',
  isLoading: false,
  jsonText: '',
  parsedJson: null,
  analysisResult: null,
  validationIssues: [],
  bulkRequests: [],
  fileName: '',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...initialState, mode: action.payload }; // Reset state when switching modes
    case 'SET_JSON_TEXT':
      return { ...state, jsonText: action.payload };
    case 'START_ANALYSIS':
      return { ...state, isLoading: true };
    case 'SET_SINGLE_RESULT':
      return {
        ...state,
        isLoading: false,
        analysisResult: action.payload.analysis,
        validationIssues: action.payload.issues,
        parsedJson: action.payload.json,
        jsonText: action.payload.text,
      };
    case 'SET_BULK_RESULT':
      return {
        ...state,
        mode: 'bulk',
        isLoading: false,
        bulkRequests: action.payload.requests,
        fileName: action.payload.fileName,
        // Clear single-view results
        analysisResult: null,
        validationIssues: [],
        jsonText: '',
      };
    case 'SET_ERROR':
      toast.error(action.payload);
      return { ...state, isLoading: false };
    case 'CLEAR':
        return {
            ...initialState,
            mode: state.mode // Retain the current mode
        };
    default:
      throw new Error('Unhandled action type');
  }
}

// --- Memoized Components for Performance ---
// By wrapping components in React.memo, we prevent them from re-rendering if their props haven't changed.
const MemoizedJsonEditor = memo(JsonEditor);
const MemoizedRequestCharacteristics = memo(RequestCharacteristics);
const MemoizedValidationResults = memo(ValidationResults);
const MemoizedBulkAnalysis = memo(BulkAnalysis);

function IndexPage() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // --- OPTIMIZATION 3: Using useCallback ---
  // This ensures that functions passed down as props don't get recreated on every render,
  // which is essential for React.memo to work effectively.
  const handleAnalyze = useCallback(async () => {
    dispatch({ type: 'START_ANALYSIS' });

    // Simulate API call to the Python backend
    // In a real app, this would be a fetch() call.
    try {
        const response = await fetch('/api/validate', { // Assuming a proxy is set up in vite.config.ts
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json_string: state.jsonText })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Backend analysis failed');
        }
        
        const data = await response.json();

        dispatch({
            type: 'SET_SINGLE_RESULT',
            payload: {
                analysis: data.detected_characteristics,
                issues: data.issues_found,
                json: JSON.parse(state.jsonText), // Keep the parsed JSON
                text: state.jsonText
            }
        });
        toast.success("Analysis complete!");
    } catch (e) {
      if (e instanceof SyntaxError) {
        dispatch({ type: 'SET_ERROR', payload: 'Invalid JSON format. Please check your input.' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    }
  }, [state.jsonText]);
  
  const handleFileUpload = useCallback(async (file: File) => {
    dispatch({ type: 'START_ANALYSIS' });
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/validate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Bulk analysis failed');
        }
        
        const data = await response.json();
        dispatch({ type: 'SET_BULK_RESULT', payload: { requests: data.raw_requests, fileName: file.name } });
        toast.success(`Bulk analysis complete for ${file.name}`);

    } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }, []);

  const handleSetJsonText = useCallback((text: string) => {
    dispatch({ type: 'SET_JSON_TEXT', payload: text });
  }, []);

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const handleSetMode = useCallback((mode: 'single' | 'bulk') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <main className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Twilight Bid Scribe</h1>
          <p className="text-slate-400 mt-1">An integrated platform for OpenRTB bid request analysis and validation.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {state.mode === 'single' ? (
              <div className="card bg-slate-900/50 p-6 space-y-4">
                 <h2 className="text-xl font-semibold flex items-center text-white"><i className="fas fa-keyboard mr-3"></i>Bid Request Input</h2>
                 <MemoizedJsonEditor jsonText={state.jsonText} setJsonText={handleSetJsonText} />
                 <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={handleAnalyze} disabled={state.isLoading} className="btn btn-primary bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed">
                      {state.isLoading ? <i className="fas fa-spinner animate-spin mr-2"></i> : <i className="fas fa-magnifying-glass-chart mr-2"></i>}
                      Analyze
                    </button>
                    <FileUpload onFileUpload={handleFileUpload} />
                 </div>
                 <div className="flex flex-wrap gap-2 items-center">
                    <ExamplesDropdown setJsonText={handleSetJsonText} />
                    <ValidationModeSelector />
                    <button onClick={handleClear} className="btn btn-secondary">Clear</button>
                 </div>
              </div>
            ) : (
              <MemoizedBulkAnalysis
                fileName={state.fileName}
                requests={state.bulkRequests}
                onClear={() => handleSetMode('single')}
              />
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            {state.mode === 'single' && (
              <>
                <MemoizedRequestCharacteristics analysis={state.analysisResult} />
                <MemoizedValidationResults issues={state.validationIssues} jsonText={state.jsonText} />
              </>
            )}
             {state.mode === 'bulk' && state.bulkRequests.length > 0 && (
                <div className="card bg-slate-900/50 p-6">
                    <h2 className="text-xl font-semibold">Bulk Results will be displayed here...</h2>
                    <p className="text-slate-400 mt-2">Functionality to display and select individual requests from the bulk upload can be built out here.</p>
                </div>
            )}
          </div>
        </div>
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

export default IndexPage;
