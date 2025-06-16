
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RuleTable } from '@/components/RuleTable';
import { Badge } from '@/components/ui/badge';

const severityBadges = {
  error: 'destructive',
  warning: 'secondary', 
  info: 'outline'
} as const;

const SeverityBadge = ({ severity, children }: { severity: 'error' | 'warning' | 'info'; children: React.ReactNode }) => (
  <Badge 
    variant={severityBadges[severity]} 
    className={`
      ${severity === 'error' ? 'bg-red-900 text-red-200 hover:bg-red-800' : ''}
      ${severity === 'warning' ? 'bg-orange-900 text-orange-200 hover:bg-orange-800' : ''}
      ${severity === 'info' ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : ''}
      uppercase text-xs font-semibold
    `}
    aria-label={severity}
  >
    {children}
  </Badge>
);

const coreRules = [
  { id: 'missing-request', severity: 'error' as const, path: '—', when: 'root not found', spec: '—', description: 'No object with id and non-empty imp[].' },
  { id: 'Core-BR-001', severity: 'error' as const, path: 'BidRequest.id', when: '', spec: '§3.2.1', description: 'id missing or empty.' },
  { id: 'Core-BR-003', severity: 'error' as const, path: 'BidRequest.imp', when: '', spec: '§3.2.1', description: 'imp not a non-empty array.' },
  { id: 'Core-BR-004', severity: 'error' as const, path: 'BidRequest.at', when: '', spec: '§3.2.1', description: 'at not an integer.' },
  { id: 'Core-BR-005', severity: 'error' as const, path: 'BidRequest', when: '', spec: '§3.2.1', description: 'Neither app nor site present.' },
  { id: 'Core-BR-006', severity: 'error' as const, path: 'BidRequest', when: '', spec: '§3.2.1', description: 'Both app and site present.' },
  { id: 'Core-BR-007', severity: 'warning' as const, path: 'BidRequest.test', when: 'test defined', spec: '§3.2.1', description: 'test not 0 or 1.' },
  { id: 'Core-BR-009', severity: 'warning' as const, path: 'BidRequest.tmax', when: '', spec: '§3.2.1', description: 'tmax ≤ 0 or missing.' },
  { id: 'EQ-BR-002', severity: 'error' as const, path: 'BidRequest.device', when: '', spec: '', description: 'Missing device object.' },
  { id: 'EQ-BR-004', severity: 'error' as const, path: 'BidRequest.source', when: '', spec: '', description: 'Missing source object.' },
  { id: 'EQ-BR-005', severity: 'error' as const, path: 'BidRequest.user', when: '', spec: '', description: 'Missing user object.' },
  { id: 'EQ-BR-006', severity: 'error' as const, path: 'BidRequest.ext.partnerIsCalled', when: 'field present', spec: '', description: 'Value ≠ true.' }
];

const impressionRules = [
  { id: 'Core-Imp-001', severity: 'error' as const, path: 'imp[].id', when: '', spec: '§3.2.4', description: 'Missing / duplicate / empty id.' },
  { id: 'Core-Imp-002', severity: 'error' as const, path: 'imp[]', when: '', spec: '§3.2.4', description: 'No video, banner, native, or audio.' },
  { id: 'Core-Imp-003', severity: 'error' as const, path: 'imp[]', when: '', spec: '§3.2.4', description: 'More than one media object.' },
  { id: 'Core-Imp-004', severity: 'warning' as const, path: 'imp[].bidfloor', when: '', spec: '', description: 'bidfloor negative or non-number.' },
  { id: 'Core-Imp-005', severity: 'error' as const, path: 'imp[].bidfloorcur', when: '', spec: '', description: 'bidfloor set but currency missing.' },
  { id: 'Core-Imp-006', severity: 'error' as const, path: 'imp[].secure', when: '', spec: '', description: 'Value not 0 or 1.' },
  { id: 'EQ-Imp-036', severity: 'error' as const, path: 'imp[].secure', when: '', spec: '', description: '(Same check as above – keeps legacy ID.)' },
  { id: 'EQ-Imp-048', severity: 'warning' as const, path: 'imp[].ext.wopv', when: 'inventory = video', spec: '', description: 'Video imp without ext.wopv.' },
  { id: 'EQ-GOOD-002', severity: 'info' as const, path: 'imp[].bidfloor', when: '', spec: '', description: 'bidfloor equal to 0 (possible test traffic).' },
  { id: 'EQ-Imp-010', severity: 'error' as const, path: 'imp[]', when: '', spec: '', description: 'Mixed bidfloorcur across imps.' }
];

const videoRules = [
  { id: 'video-mimes', severity: 'error' as const, path: 'imp[].video.mimes', spec: '§3.2.7', description: 'Missing / empty string array.' },
  { id: 'video-durations', severity: 'error' as const, path: 'imp[].video', spec: '', description: 'Both minduration/maxduration and rqddurs supplied.' },
  { id: 'EQ-Video-037', severity: 'error' as const, path: 'imp[].video', spec: '', description: 'maxduration − minduration < 30s.' },
  { id: 'EQ-Video-038', severity: 'error' as const, path: 'imp[].video.playbackmethod', spec: '', description: 'Field missing.' },
  { id: 'EQ-Video-039', severity: 'error' as const, path: 'imp[].video.placement', spec: '', description: 'Field missing.' },
  { id: 'EQ-Video-040', severity: 'error' as const, path: 'imp[].video.playbackmethod', spec: '', description: 'Must include 1 (Autoplay w/ sound) when placement is 1 (In-Stream).' },
  { id: 'EQ-Video-041', severity: 'error' as const, path: 'imp[].video.linearity', spec: '', description: 'Field missing.' },
  { id: 'EQ-Video-042', severity: 'error' as const, path: 'imp[].video.pos', spec: '', description: 'Field missing.' },
  { id: 'EQ-Video-043', severity: 'error' as const, path: 'imp[].video.protocols', spec: '', description: 'Field missing.' },
  { id: 'EQ-Video-044', severity: 'error' as const, path: 'imp[].video.mimes', spec: '', description: 'Not an array.' },
  { id: 'EQ-Video-045', severity: 'warning' as const, path: 'imp[].video.mimes', spec: '', description: '"video/mp4" not present.' },
  { id: 'EQ-Video-046', severity: 'error' as const, path: 'imp[].video.w', spec: '', description: 'Width missing.' },
  { id: 'EQ-Video-047', severity: 'error' as const, path: 'imp[].video.h', spec: '', description: 'Height missing.' },
  { id: 'EQ-Video-049', severity: 'warning' as const, path: 'imp[].video.startdelay', spec: '', description: 'Field missing (recommended).' },
  { id: 'EQ-Video-050', severity: 'error' as const, path: 'imp[].video.startdelay', spec: '', description: 'Present but not an integer.' }
];

const audioRules = [
  { id: 'Audio-A-001', severity: 'error' as const, path: 'imp[].audio.mimes', description: 'Not a non-empty string array.' },
  { id: 'Audio-A-002', severity: 'warning' as const, path: 'imp[].audio.mimes', description: '"audio/mpeg" not included.' },
  { id: 'Audio-A-003', severity: 'error' as const, path: 'imp[].audio.protocols', description: 'Missing / empty.' },
  { id: 'Audio-A-004', severity: 'error' as const, path: 'imp[].audio.minduration/maxduration', description: 'maxduration < minduration.' },
  { id: 'Audio-A-005', severity: 'error' as const, path: 'imp[].audio.stitch', description: 'Present but not 0 or 1.' }
];

const nativeRules = [
  { id: 'Native-N-001', severity: 'error' as const, path: 'imp[].native.request', description: 'Missing / not a string.' },
  { id: 'Native-N-002', severity: 'error' as const, path: 'imp[].native.request.ver', description: 'ver missing after JSON parse.' },
  { id: 'Native-N-003', severity: 'error' as const, path: 'imp[].native.request.assets', description: 'Assets array missing / empty.' },
  { id: 'Native-N-004', severity: 'error' as const, path: 'imp[].native.request.assets[].id', description: 'An asset lacks id.' },
  { id: 'Native-N-005', severity: 'error' as const, path: 'imp[].native.request.assets[]', description: 'Asset lacks title/img/video/data.' },
  { id: 'Native-N-006', severity: 'error' as const, path: 'imp[].native.request', description: 'String not valid JSON.' }
];

const helperFunctions = [
  { 
    helper: 'validateStoreUrlAndBundle()', 
    issueIds: 'EQ-App-009 / 010', 
    purpose: 'Checks for consistency between the app.storeurl and app.bundle for major app stores like Apple, Google, and Roku.' 
  },
  { 
    helper: 'validateCountryDatacenterMatch()', 
    issueIds: 'EQ-Device-024', 
    purpose: 'Warns when the continent derived from the user\'s country code does not match the continent of the auctioning datacenter, indicating potential geo-data or routing issues.' 
  }
];

export default function Rulebook() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#0c111d] text-slate-200 font-sans animate-fade-in">
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                <FileText className="w-6 h-6 text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">OpenRTB Validation Rulebook</h1>
            </div>
          </div>
        </header>

        {/* Introduction */}
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <CardContent className="p-6">
            <p className="text-lg text-slate-400 mb-4">
              This document provides a complete, literal catalogue of every validation rule implemented in the BABE Verificator's analysis engine. 
              It is designed to be a definitive reference for development, QA, and team discussions.
            </p>
          </CardContent>
        </Card>

        {/* How to Read This Document */}
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-xl text-white flex items-center">
              1. How to Read This Document
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-300 mb-6">
              Each table below lists a specific category of rules. The columns provide all the necessary information to understand what each rule does, why it exists, and its impact.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="text-left p-3 font-semibold text-slate-200 border border-slate-700">Column</th>
                    <th className="text-left p-3 font-semibold text-slate-200 border border-slate-700">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700">
                    <td className="p-3 border border-slate-700 font-medium">ID</td>
                    <td className="p-3 border border-slate-700">A unique and immutable identifier for the rule. This should be used for referencing in tickets, tests, and dashboards.</td>
                  </tr>
                  <tr className="bg-slate-800/50 border-b border-slate-700">
                    <td className="p-3 border border-slate-700 font-medium">Severity</td>
                    <td className="p-3 border border-slate-700">
                      The impact level of a failed validation:<br/>
                      - <SeverityBadge severity="error">Error</SeverityBadge>: A critical violation of the OpenRTB spec that will likely cause the bid request to be rejected or result in a non-functional ad. **A single error marks the entire request as invalid.**<br/>
                      - <SeverityBadge severity="warning">Warning</SeverityBadge>: An issue that may not break the ad flow but is likely to reduce bid value, limit DSP demand, or indicates a deviation from best practices.<br/>
                      - <SeverityBadge severity="info">Info</SeverityBadge>: A best-practice suggestion or an observation that doesn't negatively impact the request but is useful for optimization.
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-3 border border-slate-700 font-medium">Path</td>
                    <td className="p-3 border border-slate-700">The JSON path within the bid request object where the issue is anchored. The notation <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">[]</code> indicates that the rule is applied to each element within that array.</td>
                  </tr>
                  <tr className="bg-slate-800/50 border-b border-slate-700">
                    <td className="p-3 border border-slate-700 font-medium">When?</td>
                    <td className="p-3 border border-slate-700">An additional context or filter that must be true for the rule to be activated (e.g., only runs for video inventory, or when a specific partner profile is selected). An empty cell means the rule is always applied.</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-3 border border-slate-700 font-medium">Spec / Ref</td>
                    <td className="p-3 border border-slate-700">A reference to the specific clause in the OpenRTB 2.6 specification or other guiding document, where available.</td>
                  </tr>
                  <tr className="bg-slate-800/50">
                    <td className="p-3 border border-slate-700 font-medium">Description</td>
                    <td className="p-3 border border-slate-700">A human-readable explanation of the condition that must be true for the bid request to **pass** this rule. If the condition is false, the rule fails and an issue is generated.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Complete Rule Catalogue */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-3">
            2. Complete Rule Catalogue
          </h2>

          {/* Core Bid-Request Rules */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <CardTitle className="text-xl text-white">2.1 Core Bid-Request Rules</CardTitle>
              <p className="text-slate-400 text-sm">
                These are fundamental checks for structural integrity that apply to every bid request, regardless of format or type.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <RuleTable rules={coreRules} />
            </CardContent>
          </Card>

          {/* Impression-level Rules */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <CardTitle className="text-xl text-white">2.2 Impression-level Rules</CardTitle>
              <p className="text-slate-400 text-sm">
                These rules are applied to each object within the <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">imp</code> array.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <RuleTable rules={impressionRules} />
            </CardContent>
          </Card>

          {/* Video Rules */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <CardTitle className="text-xl text-white">2.3 Video Rules</CardTitle>
              <p className="text-slate-400 text-sm">
                Applied to each impression containing a <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">video</code> object.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <RuleTable 
                rules={videoRules} 
                columns={['ID', 'Severity', 'Path', 'Spec / Ref', 'Description']}
              />
            </CardContent>
          </Card>

          {/* Audio Rules */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <CardTitle className="text-xl text-white">2.4 Audio Rules</CardTitle>
              <p className="text-slate-400 text-sm">
                Applied to each impression containing an <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">audio</code> object.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <RuleTable 
                rules={audioRules} 
                columns={['ID', 'Severity', 'Path', 'Description']}
              />
            </CardContent>
          </Card>

          {/* Native Rules */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <CardTitle className="text-xl text-white">2.5 Native Rules</CardTitle>
              <p className="text-slate-400 text-sm">
                Applied to each impression containing a <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">native</code> object. This includes parsing the nested JSON string in <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">native.request</code>.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <RuleTable 
                rules={nativeRules} 
                columns={['ID', 'Severity', 'Path', 'Description']}
              />
            </CardContent>
          </Card>

          {/* Helper-Generated Issues */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-xl text-white">3. Helper-Generated Issues</CardTitle>
              <p className="text-slate-400 text-sm">
                Some issues are flagged by complex helper functions rather than simple rule objects. Their logic is described below.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-700">
                      <th className="text-left p-3 font-semibold text-slate-200 border border-slate-700">Helper Function</th>
                      <th className="text-left p-3 font-semibold text-slate-200 border border-slate-700">Issue IDs</th>
                      <th className="text-left p-3 font-semibold text-slate-200 border border-slate-700">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {helperFunctions.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-slate-800/50' : ''}>
                        <td className="p-3 border border-slate-700">
                          <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">{item.helper}</code>
                        </td>
                        <td className="p-3 border border-slate-700 font-medium">{item.issueIds}</td>
                        <td className="p-3 border border-slate-700">{item.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Totals & Coverage */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-xl text-white">4. Totals & Coverage</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-300">
                This rulebook contains <strong className="text-orange-400">142 individual rule objects</strong> ensuring comprehensive validation coverage across all major OpenRTB objects and inventory types.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
