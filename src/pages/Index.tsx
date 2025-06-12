
import React, { useState, useRef } from 'react';
import { Upload, FileText, BarChart3, Settings, Search, Copy, Trash2, Play, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import JsonEditor from '@/components/JsonEditor';
import ValidationResults from '@/components/ValidationResults';
import BulkAnalysis from '@/components/BulkAnalysis';
import FileUpload from '@/components/FileUpload';

const Index = () => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [jsonInput, setJsonInput] = useState('');
  const [validationResults, setValidationResults] = useState(null);
  const [bulkData, setBulkData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleRequests = {
    'Valid Display': `{
  "id": "1234567890",
  "imp": [{
    "id": "1",
    "banner": {
      "w": 300,
      "h": 250,
      "pos": 1
    },
    "bidfloor": 0.25
  }],
  "device": {
    "ua": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  },
  "site": {
    "page": "https://example.com"
  }
}`,
    'Valid CTV': `{
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
  "device": {
    "devicetype": 3,
    "make": "Roku",
    "model": "Ultra",
    "ifa": "12345678-1234-1234-1234-123456789012"
  },
  "app": {
    "bundle": "com.roku.channel"
  }
}`,
    'Malformed JSON': `{
  "id": "broken-request",
  "imp": [{
    "id": "1",
    "banner": {
      "w": 300,
      "h": 250,
    }
  }],
  "device": {
    "ua": "Mozilla/5.0...",
    "ip": 
  }
}`
  };

  const loadExample = (type: string) => {
    if (sampleRequests[type]) {
      setJsonInput(sampleRequests[type]);
      setValidationResults(null);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (error) {
      console.log('Cannot format invalid JSON');
    }
  };

  const clearAll = () => {
    setJsonInput('');
    setValidationResults(null);
    setBulkData(null);
    setMode('single');
  };

  const analyzeRequest = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call with realistic delay
    setTimeout(() => {
      const mockResults = {
        detected_characteristics: {
          requestType: 'Connected TV (CTV)',
          mediaFormat: 'Video',
          impressions: 1,
          platform: 'Mobile App (RokuOS)',
          deviceType: 'Tablet',
          privacySignals: 'None Detected',
          timeout: '120ms',
          currency: 'USD',
          supplyChain: '1 nodes',
          bidFloor: '$0.25 USD'
        },
        validation_summary: {
          errors: 4,
          warnings: 2,
          info: 0
        },
        issues_found: [
          {
            severity: 'Error',
            path: 'imp[0].video.mimes',
            message: 'Video MIME types array is required but missing',
            line: 12
          },
          {
            severity: 'Error',
            path: 'device.ifa',
            message: 'Device IFA should not be present when device.lmt=1',
            line: 18
          },
          {
            severity: 'Warning',
            path: 'imp[0].video.placement',
            message: 'video.placement is deprecated, use video.plcmt instead',
            line: 15
          },
          {
            severity: 'Warning',
            path: 'user.ext.consent',
            message: 'GDPR consent string missing when regs.gdpr=1',
            line: 25
          }
        ]
      };
      
      setValidationResults(mockResults);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleFileUpload = (file: File) => {
    setMode('bulk');
    setIsAnalyzing(true);
    
    // Simulate file processing
    setTimeout(() => {
      const mockBulkData = {
        fileName: file.name,
        totalRequests: 400,
        global_stats: {
          health_chart: {
            valid: 45,
            withWarnings: 35,
            withErrors: 20
          },
          request_types: {
            'CTV': 180,
            'Display': 120,
            'Native': 80,
            'Video': 20
          },
          privacy_coverage: {
            'GDPR': 280,
            'CCPA': 150,
            'GPP': 90
          },
          top_errors: [
            'Missing video.mimes array',
            'Invalid device IFA when LMT=1',
            'Malformed geo coordinates',
            'Missing consent string',
            'Invalid supply chain structure'
          ]
        }
      };
      
      setBulkData(mockBulkData);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">BABE Verificator</h1>
                  <p className="text-sm text-slate-400">NextGen OpenRTB Analysis</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setMode('single')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    mode === 'single' 
                      ? 'bg-orange-500 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Mode
                </button>
                <button
                  onClick={() => setMode('bulk')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    mode === 'bulk' 
                      ? 'bg-orange-500 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bulk Mode
                </button>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 h-full">
          {/* Left Column - Control Panel */}
          <div className="col-span-5 space-y-6">
            {mode === 'single' ? (
              <>
                {/* JSON Input Card */}
                <Card className="gradient-card border-slate-700/50 fade-in">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-orange-500" />
                        Bid Request Input
                      </h2>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={formatJson}>
                          Format JSON
                        </Button>
                        <select
                          className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm"
                          onChange={(e) => loadExample(e.target.value)}
                          value=""
                        >
                          <option value="">Load Example...</option>
                          {Object.keys(sampleRequests).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <JsonEditor 
                      value={jsonInput}
                      onChange={setJsonInput}
                      placeholder="Paste your OpenRTB bid request JSON here..."
                    />
                    
                    <div className="flex space-x-3 mt-4">
                      <Button 
                        onClick={analyzeRequest}
                        disabled={!jsonInput.trim() || isAnalyzing}
                        className="btn-primary flex-1"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Analyze Request
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={clearAll}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Upload Section */}
                <Card className="gradient-card border-slate-700/50 slide-up">
                  <div className="p-6">
                    <h3 className="text-md font-medium mb-3 flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-orange-500" />
                      Switch to Bulk Analysis
                    </h3>
                    <FileUpload onFileUpload={handleFileUpload} />
                  </div>
                </Card>
              </>
            ) : (
              <BulkAnalysis 
                data={bulkData} 
                isLoading={isAnalyzing}
                onReturnToSingle={() => {
                  setMode('single');
                  setBulkData(null);
                }}
              />
            )}
          </div>

          {/* Right Column - Results Canvas */}
          <div className="col-span-7">
            {mode === 'single' ? (
              <ValidationResults 
                results={validationResults}
                isLoading={isAnalyzing}
                onIssueClick={(path) => console.log('Clicked issue:', path)}
              />
            ) : (
              <div className="space-y-6">
                {bulkData && (
                  <Card className="gradient-card border-slate-700/50 fade-in">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Filtered Requests</h2>
                      <div className="space-y-3">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div 
                            key={i} 
                            className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-700/30 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm">ID: req_{1000 + i}</span>
                              <div className="flex space-x-4 text-sm text-slate-400">
                                <span>Type: {['CTV', 'Display', 'Native'][i % 3]}</span>
                                <span>Country: {['US', 'UK', 'DE', 'FR'][i % 4]}</span>
                                <span className="text-red-400">Errors: {Math.floor(Math.random() * 5)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json,.log"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
    </div>
  );
};

export default Index;
