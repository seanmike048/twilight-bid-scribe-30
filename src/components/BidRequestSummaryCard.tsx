import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tv, Monitor, Shield, Tablet, Smartphone, FileSearch,
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

interface DetailItemProps {
  label: string;
  value?: string | number;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, children, icon }) => {
  if (!value && !children) return null;
  return (
    <div>
      <p className="text-sm text-slate-400 flex items-center">{icon}{label}</p>
      {value && <p className="font-semibold text-base text-white break-words">{value}</p>}
      {children}
    </div>
  );
};

const getDeviceIcon = (deviceType: string = "") => {
    const lowerDeviceType = deviceType.toLowerCase();
    if (lowerDeviceType.includes('phone') || lowerDeviceType.includes('mobile')) return <Smartphone className="w-4 h-4 mr-2 text-slate-400" />;
    if (lowerDeviceType.includes('tablet')) return <Tablet className="w-4 h-4 mr-2 text-slate-400" />;
    if (lowerDeviceType.includes('connected tv') || lowerDeviceType.includes('ctv')) return <Tv className="w-4 h-4 mr-2 text-slate-400" />;
    return <Monitor className="w-4 h-4 mr-2 text-slate-400" />;
};


export const BidRequestSummaryCard: React.FC<{ summary: AnalysisSummary }> = ({ summary }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 w-full">
      <CardHeader className="flex flex-row items-center gap-3 pb-4">
        <FileSearch className="w-6 h-6 text-amber-400" />
        <CardTitle className="text-lg text-white font-semibold">Bid Request Analysis</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4 space-y-4 text-sm">
        <div>
          <p className="text-sm text-slate-400">Request Type</p>
          <Badge className="bg-orange-500 text-white mt-1 font-semibold rounded-md px-2 py-0.5 h-auto text-sm">
            {summary.requestType}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Media Format" value={Array.isArray(summary.mediaFormats) && summary.mediaFormats.length > 0 ? summary.mediaFormats.join(', ') : 'N/A'} />
          <DetailItem label="Impressions" value={summary.impressions && summary.impressions > 0 ? summary.impressions : 'N/A'} />
          <DetailItem label="Platform" value={summary.platform || 'N/A'} />
          <DetailItem label="Device Type" value={summary.deviceType} icon={getDeviceIcon(summary.deviceType)} />
          <DetailItem label="Timeout" value={summary.timeoutMs ? `${summary.timeoutMs}ms` : 'N/A'} />
          <DetailItem label="Currency" value={summary.currency || 'N/A'} />
          <DetailItem label="Bid Floor" value={summary.bidFloor || 'N/A'} />
          <DetailItem label="Supply Chain" value={summary.schainNodes !== undefined ? `${summary.schainNodes} nodes` : 'N/A'} />
        </div>
        
        <Separator className="bg-slate-700" />
        
        <DetailItem label="Privacy Signals" icon={<Shield className="w-4 h-4 mr-2 text-slate-400" />}>
          <p className="font-semibold text-base text-white break-words">
            {summary.privacySignals && summary.privacySignals.length > 0 ? summary.privacySignals.join(', ') : 'None detected'}
          </p>
        </DetailItem>
        
      </CardContent>
    </Card>
  );
};
