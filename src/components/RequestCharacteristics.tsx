
import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, Info } from 'lucide-react';

interface RequestCharacteristicsProps {
  characteristics: any;
}

const RequestCharacteristics: React.FC<RequestCharacteristicsProps> = ({ characteristics }) => {
  if (!characteristics) return null;

  const details = characteristics.details || {};
  
  return (
    <Card className="gradient-card border-slate-700/50 fade-in">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          Bid Request Analysis
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Request Type</span>
              <span className="font-medium text-gradient">{characteristics.requestType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Media Format</span>
              <span className="font-medium">{characteristics.mediaFormat}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Impressions</span>
              <span className="font-medium">{characteristics.impressions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Platform</span>
              <span className="font-medium">{characteristics.platform}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Device Type</span>
              <span className="font-medium">{details.deviceType}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Privacy Signals</span>
              <span className="font-medium">
                {Array.isArray(details.privacySignals) 
                  ? details.privacySignals.join(', ') 
                  : details.privacySignals || 'None Detected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Timeout</span>
              <span className="font-medium">{details.timeout}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Currency</span>
              <span className="font-medium">{details.currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Supply Chain</span>
              <span className="font-medium">{details.schainNodes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Bid Floor</span>
              <span className="font-medium text-green-400">{details.bidFloor}</span>
            </div>
          </div>
        </div>

        {details.country && details.country !== 'N/A' && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <Info className="w-4 h-4" />
              <span>Country: {details.country}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RequestCharacteristics;
