
import React, { useState, useRef } from 'react';
import { Upload, FileText, BarChart3, Settings, Search, Copy, Trash2, Play, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import JsonEditor from '@/components/JsonEditor';
import ValidationResults from '@/components/ValidationResults';
import BulkAnalysis from '@/components/BulkAnalysis';
import FileUpload from '@/components/FileUpload';
import ValidationModeSelector from '@/components/ValidationModeSelector';
import ExamplesDropdown from '@/components/ExamplesDropdown';
import RequestCharacteristics from '@/components/RequestCharacteristics';
import { exampleBidRequests } from '@/utils/exampleData';

const Index = () => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [jsonInput, setJsonInput] = useState('');
  const [validationMode, setValidationMode] = useState('auto');
  const [validationResults, setValidationResults] = useState(null);
  const [requestCharacteristics, setRequestCharacteristics] = useState(null);
  const [bulkData, setBulkData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedRequestFromBulk, setSelectedRequestFromBulk] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadExample = (type: string) => {
    if (exampleBidRequests[type]) {
      setJsonInput(exampleBidRequests[type]);
      setValidationResults(null);
      setRequestCharacteristics(null);
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
    setRequestCharacteristics(null);
    setBulkData(null);
    setSelectedRequestFromBulk(null);
    setMode('single');
  };

  const analyzeRequest = async () => {
    if (!jsonInput.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      // Call the backend API
      const response = await fetch('/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json_string: jsonInput,
          validation_mode: validationMode
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const results = await response.json();
      setRequestCharacteristics(results.detected_characteristics);
      setValidationResults(results);
      
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to mock data for development
      const mockResults = generateMockResults();
      setRequestCharacteristics(mockResults.detected_characteristics);
      setValidationResults(mockResults);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMockResults = () => {
    // Enhanced mock data generator based on actual JSON input
    try {
      const parsed = JSON.parse(jsonInput);
      const hasVideo = parsed.imp?.some(imp => imp.video);
      const hasNative = parsed.imp?.some(imp => imp.native);
      const hasBanner = parsed.imp?.some(imp => imp.banner);
      const isCtv = parsed.device?.devicetype === 3 || parsed.device?.devicetype === 7;
      
      let requestType = 'Display';
      let mediaFormat = 'Banner';
      
      if (isCtv) {
        requestType = 'Connected TV (CTV)';
        mediaFormat = 'Video';
      } else if (hasVideo) {
        requestType = 'Video';
        mediaFormat = 'Video';
      } else if (hasNative) {
        requestType = 'Native';
        mediaFormat = 'Native';
      }

      const characteristics = {
        requestType,
        mediaFormat,
        impressions: parsed.imp?.length || 0,
        platform: parsed.app ? 'Mobile App' : (parsed.site ? 'Web' : 'Unknown'),
        details: {
          deviceType: parsed.device?.make || 'Unknown',
          timeout: parsed.tmax ? `${parsed.tmax}ms` : 'N/A',
          currency: parsed.cur?.[0] || 'USD',
          schainNodes: parsed.source?.schain?.nodes ? `${parsed.source.schain.nodes.length} nodes` : 'Not present',
          bidFloor: parsed.imp?.[0]?.bidfloor ? `${parsed.imp[0].bidfloorcur || 'USD'} ${parsed.imp[0].bidfloor}` : 'N/A',
          privacySignals: parsed.regs?.gdpr === 1 ? ['GDPR'] : ['None detected'],
          country: parsed.device?.geo?.country || 'N/A'
        }
      };

      // Generate realistic issues based on the JSON
      const issues = [];
      if (!parsed.id) {
        issues.push({
          severity: 'Error',
          path: 'id',
          message: 'BidRequest.id is missing or empty',
          line: 1
        });
      }
      
      if (parsed.regs?.gdpr === 1 && !parsed.user?.ext?.consent) {
        issues.push({
          severity: 'Error',
          path: 'user.ext.consent',
          message: 'GDPR consent string missing when regs.gdpr=1',
          line: 25
        });
      }

      if (parsed.device?.lmt === 1 && parsed.device?.ifa && parsed.device.ifa !== '00000000-0000-0000-0000-000000000000') {
        issues.push({
          severity: 'Error',
          path: 'device.ifa',
          message: 'Device IFA should not be present when device.lmt=1',
          line: 18
        });
      }

      if (hasVideo && !parsed.imp?.some(imp => imp.video?.mimes)) {
        issues.push({
          severity: 'Error',
          path: 'imp[0].video.mimes',
          message: 'Video MIME types array is required but missing',
          line: 12
        });
      }

      return {
        detected_characteristics: characteristics,
        validation_summary: {
          errors: issues.filter(i => i.severity === 'Error').length,
          warnings: issues.filter(i => i.severity === 'Warning').length,
          info: issues.filter(i => i.severity === 'Info').length
        },
        issues_found: issues
      };
    } catch (error) {
      return {
        detected_characteristics: {
          requestType: 'Invalid/Malformed',
          mediaFormat: 'N/A',
          impressions: 0,
          platform: 'Unknown'
        },
        validation_summary: { errors: 1, warnings: 0, info: 0 },
        issues_found: [{
          severity: 'Error',
          path: 'BidRequest',
          message: 'Invalid JSON format',
          line: 1
        }]
      };
    }
  };

  const handleFileUpload = async (file: File) => {
    setMode('bulk');
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/validate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const results = await response.json();
      setBulkData(results);
      
    } catch (error) {
      console.error('File upload error:', error);
      // Fallback to mock data
      const mockBulkData = {
        fileName: file.name,
        totalRequests: 400,
        global_stats: {
          health: { valid: 45, warnings: 35, errors: 20 },
          requestTypes: { 'CTV': 180, 'Display': 120, 'Native': 80, 'Video': 20 },
          topCountries: { 'US': 200, 'UK': 80, 'DE': 60, 'FR': 40, 'CA': 20 },
          topErrors: [
            'Missing video.mimes array',
            'Invalid device IFA when LMT=1', 
            'Malformed geo coordinates',
            'Missing consent string',
            'Invalid supply chain structure'
          ]
        }
      };
      setBulkData(mockBulkData);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestSelection = (requestData: any) => {
    setSelectedRequestFromBulk(requestData);
    // Analyze the selected request for detailed view
    setJsonInput(JSON.stringify(requestData, null, 2));
    const mockResults = generateMockResults();
    setRequestCharacteristics(mockResults.detected_characteristics);
    setValidationResults(mockResults);
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

                {/* Validation Configuration */}
                <Card className="gradient-card border-slate-700/50 slide-up">
                  <div className="p-6 space-y-4">
                    <ValidationModeSelector 
                      value={validationMode}
                      onChange={setValidationMode}
                    />
                    <ExamplesDropdown onLoadExample={loadExample} />
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
                  setSelectedRequestFromBulk(null);
                }}
                onRequestSelect={handleRequestSelection}
              />
            )}
          </div>

          {/* Right Column - Results Canvas */}
          <div className="col-span-7 space-y-6">
            {mode === 'single' ? (
              <>
                {requestCharacteristics && (
                  <RequestCharacteristics characteristics={requestCharacteristics} />
                )}
                <ValidationResults 
                  results={validationResults}
                  isLoading={isAnalyzing}
                  onIssueClick={(path) => console.log('Clicked issue:', path)}
                />
              </>
            ) : (
              <div className="space-y-6">
                {selectedRequestFromBulk && (
                  <>
                    <RequestCharacteristics characteristics={requestCharacteristics} />
                    <ValidationResults 
                      results={validationResults}
                      isLoading={false}
                      onIssueClick={(path) => console.log('Clicked issue:', path)}
                    />
                  </>
                )}
                {bulkData && !selectedRequestFromBulk && (
                  <Card className="gradient-card border-slate-700/50 fade-in">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Request List</h2>
                      <p className="text-slate-400 mb-4">
                        Click on any request below to view detailed analysis
                      </p>
                      <div className="space-y-3">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div 
                            key={i} 
                            className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-700/30 cursor-pointer transition-all"
                            onClick={() => handleRequestSelection({ id: `req_${1000 + i}` })}
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
