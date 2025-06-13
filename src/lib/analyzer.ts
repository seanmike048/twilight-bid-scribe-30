
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Monitor, Smartphone, Tv, Speaker, Globe, Shield, Users, Target } from 'lucide-react';
import { BidRequestValidationResult } from '@/utils/bidRequestValidator';

interface BidRequestAnalyzerProps {
  jsonInput: string;
  validationResult: BidRequestValidationResult;
}

export const BidRequestAnalyzer: React.FC<BidRequestAnalyzerProps> = ({
  jsonInput,
  validationResult
}) => {
  const analyzeBidRequest = () => {
    try {
      const bidRequest = JSON.parse(jsonInput);
      
      // Determine request type
      let requestType = 'Unknown';
      let mediaFormat = 'Unknown';
      let platform = 'Unknown';
      let deviceType = 'Unknown';
      let privacySignals: string[] = [];
      let impressionCount = 0;
      
      // Analyze impressions
      if (bidRequest.imp && Array.isArray(bidRequest.imp)) {
        impressionCount = bidRequest.imp.length;
        
        // Determine media format
        const firstImp = bidRequest.imp[0];
        if (firstImp.video) {
          requestType = 'Video Advertising';
          mediaFormat = 'Video';
          
          // Check for CTV specific attributes
          if (bidRequest.device?.devicetype === 5 || 
              firstImp.video?.placement === 1 ||
              firstImp.video?.podid) {
            requestType = 'Connected TV (CTV)';
          }
        } else if (firstImp.native) {
          requestType = 'Native Advertising';
          mediaFormat = 'Native';
        } else if (firstImp.banner) {
          requestType = 'Display Advertising';
          mediaFormat = 'Banner/Display';
        } else if (firstImp.audio) {
          requestType = 'Audio Advertising';
          mediaFormat = 'Audio';
        }
      }
      
      // Analyze platform
      if (bidRequest.app) {
        platform = 'Mobile App';
        if (bidRequest.app.bundle) {
          platform += bidRequest.device?.os ? ` (${bidRequest.device.os})` : '';
        }
      } else if (bidRequest.site) {
        platform = 'Website';
        if (bidRequest.site.domain) {
          platform += ` (${bidRequest.site.domain})`;
        }
      }
      
      // Analyze device type
      const deviceTypeMap: { [key: number]: string } = {
        1: 'Mobile/Tablet',
        2: 'Personal Computer',
        3: 'Connected TV',
        4: 'Phone',
        5: 'Tablet',
        6: 'Connected Device',
        7: 'Set Top Box'
      };
      
      if (bidRequest.device?.devicetype) {
        deviceType = deviceTypeMap[bidRequest.device.devicetype] || 'Unknown';
      }
      
      // Analyze privacy signals
      if (bidRequest.regs?.ext?.gdpr === 1) {
        privacySignals.push('GDPR Applicable');
      }
      if (bidRequest.user?.ext?.consent) {
        privacySignals.push('TCF Consent String');
      }
      if (bidRequest.regs?.ext?.us_privacy) {
        privacySignals.push('CCPA/US Privacy');
      }
      if (bidRequest.regs?.gpp) {
        privacySignals.push('Global Privacy Platform (GPP)');
      }
      if (bidRequest.device?.lmt === 1) {
        privacySignals.push('Limited Ad Tracking');
      }
      
      return {
        requestType,
        mediaFormat,
        platform,
        deviceType,
        privacySignals,
        impressionCount,
        bidRequest
      };
    } catch (error) {
      return {
        requestType: 'Invalid JSON',
        mediaFormat: 'Unknown',
        platform: 'Unknown',
        deviceType: 'Unknown',
        privacySignals: [],
        impressionCount: 0,
        bidRequest: null
      };
    }
  };

  const analysis = analyzeBidRequest();

  const getRequestTypeIcon = (type: string) => {
    if (type.includes('Video') || type.includes('CTV')) {
      return <Tv className="h-5 w-5 text-purple-400" />;
    } else if (type.includes('Native')) {
      return <Target className="h-5 w-5 text-green-400" />;
    } else if (type.includes('Display')) {
      return <Monitor className="h-5 w-5 text-blue-400" />;
    } else if (type.includes('Audio')) {
      return <Speaker className="h-5 w-5 text-yellow-400" />;
    }
    return <Globe className="h-5 w-5 text-gray-400" />;
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType.includes('Mobile') || deviceType.includes('Phone')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (deviceType.includes('TV') || deviceType.includes('Connected')) {
      return <Tv className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="flex items-center gap-2 text-white">
          {getRequestTypeIcon(analysis.requestType)}
          Bid Request Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Request Type */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Request Type</h4>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-base px-3 py-1">
            {analysis.requestType}
          </Badge>
        </div>

        <Separator className="bg-gray-700" />

        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Media Format</h4>
            <div className="text-white font-medium">{analysis.mediaFormat}</div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Impressions</h4>
            <div className="text-white font-medium">{analysis.impressionCount}</div>
          </div>
          
          <div className="col-span-2">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Platform</h4>
            <div className="text-white font-medium">{analysis.platform}</div>
          </div>
          
          <div className="col-span-2">
            <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              {getDeviceIcon(analysis.deviceType)}
              Device Type
            </h4>
            <div className="text-white font-medium">{analysis.deviceType}</div>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Privacy Signals */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy Signals
          </h4>
          {analysis.privacySignals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.privacySignals.map((signal, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-green-500/30 text-green-400 bg-green-500/10"
                >
                  {signal}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">None detected</div>
          )}
        </div>

        {/* Additional Details */}
        {analysis.bidRequest && (
          <>
            <Separator className="bg-gray-700" />
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Additional Details
              </h4>
              <div className="space-y-2 text-sm">
                {analysis.bidRequest.tmax && (
                  <div>
                    <span className="text-gray-400">Timeout:</span>
                    <span className="text-white ml-2">{analysis.bidRequest.tmax}ms</span>
                  </div>
                )}
                {analysis.bidRequest.cur && (
                  <div>
                    <span className="text-gray-400">Currency:</span>
                    <span className="text-white ml-2">{analysis.bidRequest.cur.join(', ')}</span>
                  </div>
                )}
                {analysis.bidRequest.source?.schain && (
                  <div>
                    <span className="text-gray-400">Supply Chain:</span>
                    <span className="text-green-400 ml-2">
                      {analysis.bidRequest.source.schain.nodes?.length || 0} nodes
                    </span>
                  </div>
                )}
                {analysis.bidRequest.imp?.[0]?.bidfloor && (
                  <div>
                    <span className="text-gray-400">Bid Floor:</span>
                    <span className="text-white ml-2">
                      ${analysis.bidRequest.imp[0].bidfloor}
                      {analysis.bidRequest.imp[0].bidfloorcur && 
                        ` ${analysis.bidRequest.imp[0].bidfloorcur}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};