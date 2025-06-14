
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tv, Speaker, Image, Clapperboard, Layout, Monitor, FileCode, Shield 
} from 'lucide-react';

interface AnalysisSummary {
  requestType: string;
  mediaFormats: string[];
  impressions: number;
  platform: string;
  deviceType: string;
  geo: string;
  timeoutMs?: number;
  currency?: string;
  schainNodes?: number;
  bidFloor?: string;
  privacySignals?: string[];
}

interface StatProps {
  label: string;
  value: string | number | undefined;
  className?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, className }) => {
  if (!value || value === '—' || value === undefined || value === null || value === '') return null;
  return (
    <div className={className}>
      <p className="text-slate-400">{label}</p>
      <p className="font-bold text-lg text-white break-words">{value}</p>
    </div>
  );
};

const requestTypeIcon = (requestType: string) => {
  switch (requestType) {
    case "Banner": return <Image className="w-6 h-6 text-amber-400" />;
    case "Video": return <Clapperboard className="w-6 h-6 text-amber-400" />;
    case "Audio": return <Speaker className="w-6 h-6 text-amber-400" />;
    case "Native": return <Layout className="w-6 h-6 text-amber-400" />;
    case "Connected TV (CTV)": return <Tv className="w-6 h-6 text-amber-400" />;
    case "DOOH": return <Monitor className="w-6 h-6 text-amber-400" />;
    default: return <FileCode className="w-6 h-6 text-amber-400" />;
  }
};

export const BidRequestSummaryCard: React.FC<{ summary: AnalysisSummary }> = ({ summary }) => {
  // Prepare field values (hide any row whose output is falsy/undefined)
  const stats = [
    { label: "Media Format", value: Array.isArray(summary.mediaFormats) && summary.mediaFormats.length > 0 ? summary.mediaFormats.join(', ') : undefined },
    { label: "Platform", value: summary.platform },
    { label: "Device Type", value: summary.deviceType },
    { label: "Impressions", value: summary.impressions && summary.impressions > 0 ? summary.impressions : undefined },
    { label: "Geography", value: summary.geo },
    { label: "Timeout", value: summary.timeoutMs ? `${summary.timeoutMs} ms` : undefined },
    { label: "Currency", value: summary.currency },
    { label: "Supply Chain", value: summary.schainNodes ? `${summary.schainNodes} nodes` : undefined, className: summary.schainNodes ? "text-green-400" : "" },
    { label: "Bid Floor", value: summary.bidFloor },
  ];

  // Card grid (filter out empty stats, preserve 3col structure)
  const statGrid = stats.filter(s => !!s.value);

  return (
    <Card className="bg-slate-900 border-slate-800 max-w-xl w-full mx-auto">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <span>{requestTypeIcon(summary.requestType)}</span>
        <CardTitle className="text-lg text-white font-semibold mr-1 flex-1">Bid Request Analysis</CardTitle>
        <Badge className="bg-orange-500 text-white ml-2 font-semibold rounded-md px-3 py-1 h-auto">
          {summary.requestType}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 pb-2 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
        {statGrid.map((stat, idx) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} className={stat.className} />
        ))}
      </CardContent>
      {summary.privacySignals && summary.privacySignals.length > 0 && (
        <CardFooter className="flex items-center gap-2 pt-0 pb-2 text-green-300">
          <Shield className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">Privacy Signals:</span>
          <span className="text-xs font-mono">{summary.privacySignals.join(', ')}</span>
        </CardFooter>
      )}
    </Card>
  );
};
