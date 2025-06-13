// FILE: src/main.tsx
// ACTION: Replace the entire content of this file.
// REASON: Fixes the React 18 `ReactDOM.render` error by using the modern `createRoot` API.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```typescript
// FILE: src/lib/analyzer.ts
// ACTION: Create this new file in the `src/lib` directory.
// REASON: This centralizes all the complex bid request analysis logic, making the main page component cleaner and easier to manage.

export interface ValidationIssue {
  severity: 'Error' | 'Warning' | 'Info';
  message: string;
  path: string;
  expected: string;
}

export interface AnalysisResult {
  error?: string;
  requestType: string;
  mediaFormats: string[];
  impressions: number;
  platform: string;
  deviceType: string;
  geo: string;
}

// A simplified but representative set of validation rules.
const rules = [
    { severity: 'Error', path: 'id', check: (d: any) => !d.id, message: 'BidRequest.id is missing or empty.' },
    { severity: 'Error', path: 'imp', check: (d: any) => !Array.isArray(d.imp) || d.imp.length === 0, message: 'BidRequest.imp must be a non-empty array.' },
    { severity: 'Error', path: 'imp.id', type: 'imp', check: (i: any) => !i.id, message: 'Each impression must have an id.' },
    { severity: 'Error', path: 'imp.video.mimes', type: 'imp', check: (i: any) => i.video && (!Array.isArray(i.video.mimes) || i.video.mimes.length === 0), message: 'Video object must have a non-empty mimes array.'},
    { severity: 'Error', path: 'app', check: (d: any) => d.device?.devicetype === 3 && !d.app, message: 'CTV requests require an app object.' },
];

function findOrtbRequest(data: any): any | null {
    if (data && typeof data === 'object' && 'id' in data && 'imp' in data) {
        return data;
    }
    if (data && typeof data === 'object') {
        for (const key in data) {
            const found = findOrtbRequest(data[key]);
            if (found) return found;
        }
    }
    return null;
}

export const analyzer = {
    analyze(jsonText: string): { analysis: AnalysisResult | null; issues: ValidationIssue[] } {
        let data;
        try {
            data = JSON.parse(jsonText);
        } catch (e) {
            return {
                analysis: { error: "Invalid JSON", requestType: "Error", mediaFormats: [], impressions: 0, platform: "", deviceType: "", geo: "" },
                issues: []
            };
        }

        const req = findOrtbRequest(data);
        if (!req) {
            return {
                analysis: { error: "Not a valid OpenRTB Bid Request", requestType: "Error", mediaFormats: [], impressions: 0, platform: "", deviceType: "", geo: "" },
                issues: []
            };
        }
        
        const impressions = req.imp || [];
        const device = req.device || {};
        const mediaFormats = new Set<string>();
        
        impressions.forEach((imp: any) => {
            if (imp.banner) mediaFormats.add('Banner');
            if (imp.video) mediaFormats.add('Video');
            if (imp.native) mediaFormats.add('Native');
            if (imp.audio) mediaFormats.add('Audio');
        });
        
        let requestType = 'Unknown';
        if (mediaFormats.size > 1) {
            requestType = 'Mixed';
        } else if (mediaFormats.size === 1) {
            requestType = [...mediaFormats][0];
        }

        if (device.devicetype === 3 || device.devicetype === 7) {
            requestType = 'Connected TV (CTV)';
        }

        const analysisResult: AnalysisResult = {
            requestType,
            mediaFormats: [...mediaFormats],
            impressions: impressions.length,
            platform: req.app ? 'App' : (req.site ? 'Site' : 'Unknown'),
            deviceType: { 2: 'Phone', 3: 'CTV', 4: 'Phone', 5: 'Tablet' }[device.devicetype] || 'Desktop/Other',
            geo: device.geo?.country || 'N/A'
        };

        // Run validation rules
        const validationIssues: ValidationIssue[] = [];
        rules.forEach(rule => {
            if (rule.type === 'imp') {
                impressions.forEach((imp: any, index: number) => {
                    if (rule.check(imp)) {
                        validationIssues.push({ severity: rule.severity as any, message: rule.message, path: `imp[${index}].${rule.path.split('.')[1]}`, expected: '' });
                    }
                });
            } else {
                if (rule.check(req)) {
                     validationIssues.push({ severity: rule.severity as any, message: rule.message, path: rule.path, expected: '' });
                }
            }
        });
        
        return { analysis: analysisResult, issues: validationIssues };
    }
};
```

```typescript
// FILE: src/lib/exampleData.ts
// ACTION: Create this new file in the `src/lib` directory.
// REASON: Provides corrected, valid, and reliable example data for testing and demonstration.

export const exampleData = {
    'valid-ctv': {
      "id": "ctv-request-001",
      "imp": [{
        "id": "1",
        "video": {
          "mimes": ["video/mp4"],
          "minduration": 15,
          "maxduration": 30,
          "protocols": [2, 3],
          "w": 1920,
          "h": 1080,
          "startdelay": 0,
          "plcmt": 1,
          "linearity": 1,
          "pos": 7
        }
      }],
      "app": {
        "id": "app123",
        "name": "SuperStream TV",
        "bundle": "com.superstream.tv",
        "publisher": { "id": "pub123", "name": "SuperStream Media" }
      },
      "device": {
        "ip": "203.0.113.1",
        "ua": "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.84 TV Safari/537.36",
        "devicetype": 3,
        "make": "Samsung",
        "model": "Q90R Series",
        "os": "Tizen",
        "osv": "5.0",
        "geo": { "country": "USA" }
      },
      "regs": { "coppa": 0 }
    },
    'multi-impression': {
      "id": "multi-imp-request-002",
      "imp": [
        {
          "id": "imp-1-banner",
          "banner": { "w": 300, "h": 250 },
          "bidfloor": 0.50
        },
        {
          "id": "imp-2-video",
          "video": {
            "mimes": ["video/mp4"],
            "minduration": 5,
            "maxduration": 15,
            "w": 640,
            "h": 480,
            "linearity": 1
          },
          "bidfloor": 1.25
        }
      ],
      "site": {
        "id": "site456",
        "name": "News Today",
        "domain": "newstoday.com",
        "page": "https://newstoday.com/article/123",
        "publisher": { "id": "pub456", "name": "News Today Corp" }
      },
      "device": {
        "ip": "198.51.100.1",
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        "devicetype": 2,
        "geo": { "country": "CAN" }
      }
    }
};
```

```tsx
// FILE: src/pages/Index.tsx
// ACTION: Replace the entire content of this file.
// REASON: This is the complete overhaul. It fixes the layout, uses the new analyzer and example data,
// and correctly manages the application's state for a smooth and working user experience.

import { useState, useCallback } from 'react';

// UI Component Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Corrected logic and data
import { analyzer, AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { exampleData } from '@/lib/exampleData';


// --- CHILD COMPONENTS ---

const Header = () => (
    <header className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
             <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
               <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">BABE Verificator</h1>
        </div>
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
            <Button variant="secondary" className="bg-white text-slate-900 hover:bg-slate-200">Single Mode</Button>
            <Button variant="ghost">Bulk Mode</Button>
        </div>
    </header>
);

const JsonEditor = ({ jsonText, setJsonText }: { jsonText: string; setJsonText: (text: string) => void }) => {
    // Basic syntax highlighting for demonstration
    const highlight = (text: string) => {
        return text
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
                if (/:$/.test(match)) {
                    return `<span class="text-blue-400">${match}</span>`;
                }
                return `<span class="text-amber-400">${match}</span>`;
            })
            .replace(/\b(true|false)\b/g, '<span class="text-purple-400">$&</span>')
            .replace(/\b\d+\b/g, '<span class="text-green-400">$&</span>');
    };
    
    return (
        <pre
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setJsonText(e.currentTarget.textContent || '')}
            className="w-full h-full min-h-[400px] p-4 font-mono text-sm bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            dangerouslySetInnerHTML={{ __html: highlight(jsonText) }}
        />
    );
};

const ResultsPanel = ({ analysis, issues }: { analysis: AnalysisResult | null; issues: ValidationIssue[] }) => {
    if (!analysis) {
        return (
            <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                    <div className="text-6xl text-slate-600 mb-4"><i className="far fa-eye"></i></div>
                    <h3 className="text-xl font-bold text-white">Ready for Analysis</h3>
                    <p className="text-slate-400 mt-1">Paste a bid request and click "Analyze Request" to begin.</p>
                </CardContent>
            </Card>
        );
    }

    if (analysis.error) {
        return (
             <Card className="h-full flex items-center justify-center text-center bg-red-900/20 border-red-500/30">
                <p className="font-bold text-red-400">{analysis.error}</p>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg">Request Characteristics</CardTitle>
                </CardHeader>
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
                 <CardHeader><CardTitle className="text-lg">Validation Issues</CardTitle></CardHeader>
                 <CardContent>
                    {issues.length === 0 ? (
                        <p className="text-green-400">No issues found.</p>
                    ) : (
                        <ul className="space-y-2">
                            {issues.map((issue, i) => (
                                <li key={i} className="text-sm p-2 bg-slate-800 rounded-md border-l-4 border-red-500">
                                    <p className="font-semibold">{issue.message}</p>
                                    <p className="text-slate-400 font-mono text-xs">Path: {issue.path}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                 </CardContent>
            </Card>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function IndexPage() {
    const [jsonText, setJsonText] = useState(JSON.stringify(exampleData['valid-ctv'], null, 2));
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [issues, setIssues] = useState<ValidationIssue[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = useCallback(() => {
        if (!jsonText) {
            toast.error("Input is empty.");
            return;
        }
        setIsLoading(true);
        // Simulate analysis delay
        setTimeout(() => {
            const { analysis, issues } = analyzer.analyze(jsonText);
            setAnalysisResult(analysis);
            setIssues(issues);
            setIsLoading(false);
            if(analysis && !analysis.error) {
                toast.success("Analysis complete!");
            } else {
                toast.error(analysis?.error || "An unknown error occurred.");
            }
        }, 300);
    }, [jsonText]);
    
    const handleLoadExample = useCallback((key: keyof typeof exampleData) => {
        setJsonText(JSON.stringify(exampleData[key], null, 2));
    }, []);

    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(jsonText);
            setJsonText(JSON.stringify(parsed, null, 2));
        } catch {
            toast.error("Cannot format invalid JSON.");
        }
    }, [jsonText]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <main className="container mx-auto p-4 md:p-8">
                <Header />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* STRICT LEFT PANE */}
                    <div className="flex flex-col space-y-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <CardTitle className="text-lg">Bid Request Input</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={handleFormat}>Format JSON</Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">Load Example <i className="fas fa-chevron-down ml-2 text-xs"></i></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('valid-ctv')}>Valid CTV Ad</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleLoadExample('multi-impression')}>Multi-Impression</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <JsonEditor jsonText={jsonText} setJsonText={setJsonText} />
                            </CardContent>
                        </Card>
                         <div className="flex items-center space-x-4">
                            <Button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 text-base">
                                {isLoading ? <i className="fas fa-spinner animate-spin mr-2"></i> : <i className="fas fa-search mr-2"></i>}
                                Analyze Request
                            </Button>
                        </div>
                    </div>

                    {/* STRICT RIGHT PANE */}
                    <div className="w-full">
                        <ResultsPanel analysis={analysisResult} issues={issues} />
                    </div>
                </div>
            </main>
            <Toaster theme="dark" position="bottom-right" />
        </div>
    );
}

