
// FILE: src/lib/analyzer.ts

// --- TYPE DEFINITIONS ---
export interface ValidationIssue {
  severity: 'Error' | 'Warning' | 'Info';
  message: string;
  path: string;
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

// --- CORE ANALYSIS LOGIC ---

// A representative and robust set of validation rules.
const rules = [
    { severity: 'Error', path: 'id', check: (d: any) => !d.id, message: 'BidRequest.id is missing or empty.'},
    { severity: 'Error', path: 'imp', check: (d: any) => !Array.isArray(d.imp) || d.imp.length === 0, message: 'BidRequest.imp must be a non-empty array.'},
    { severity: 'Error', path: 'BidRequest', check: (d: any) => !((d.site && !d.app) || (!d.site && d.app)), message: 'Either a site or an app object must be present, but not both.'},
    { severity: 'Warning', path: 'device', check: (d: any) => !d.device, message: 'Device object is highly recommended.'},
    { severity: 'Error', path: 'device.ip', check: (d: any) => d.device && !d.device.ip && !d.device.ipv6, message: 'Device object requires an IP address (ip or ipv6).'},
    { severity: 'Error', path: 'imp.id', type: 'imp', check: (i: any) => !i.id, message: 'Each impression must have an id.' },
    { severity: 'Error', path: 'imp.video.mimes', type: 'imp', check: (i: any) => i.video && (!Array.isArray(i.video.mimes) || i.video.mimes.length === 0), message: 'Video object must have a non-empty mimes array.'},
    { severity: 'Error', path: 'imp.video.linearity', type: 'imp', check: (i: any) => i.video && i.video.linearity === undefined, message: 'Video linearity is required.'},
    { severity: 'Error', path: 'app', check: (d: any) => d.device?.devicetype === 3 && !d.app, message: 'CTV requests require an app object.'}
];

function findOrtbRequest(data: any): any | null {
    if (data && typeof data === 'object' && 'id' in data && 'imp' in data) return data;
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
                issues: [{ severity: 'Error', message: 'The provided text is not valid JSON.', path: 'root' }]
            };
        }

        const req = findOrtbRequest(data);
        if (!req) {
            return {
                analysis: { error: "Not an OpenRTB Bid Request", requestType: "Error", mediaFormats: [], impressions: 0, platform: "", deviceType: "", geo: "" },
                issues: [{ severity: 'Error', message: 'Could not find a valid OpenRTB BidRequest object (with id and imp).', path: 'root' }]
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
        } else if (impressions.length > 0) {
            requestType = 'Display'; // Default for impressions with no specified type
        }

        if (device.devicetype === 3 || device.devicetype === 7) {
            requestType = 'Connected TV (CTV)';
        }

        const analysisResult: AnalysisResult = {
            requestType,
            mediaFormats: [...mediaFormats],
            impressions: impressions.length,
            platform: req.app ? 'App' : (req.site ? 'Site' : 'Unknown'),
            deviceType: { 1: 'Desktop', 2: 'Phone', 3: 'CTV', 4: 'Phone', 5: 'Tablet', 7: 'Set Top Box' }[device.devicetype] || 'Other',
            geo: device.geo?.country || 'N/A'
        };

        const validationIssues: ValidationIssue[] = [];
        rules.forEach(rule => {
            if (rule.type === 'imp') {
                impressions.forEach((imp: any, index: number) => {
                    if (rule.check(imp)) {
                        validationIssues.push({ severity: rule.severity as any, message: rule.message, path: `imp[${index}].${rule.path.split('.')[1]}` });
                    }
                });
            } else {
                if (rule.check(req)) {
                     validationIssues.push({ severity: rule.severity as any, message: rule.message, path: rule.path });
                }
            }
        });
        
        return { analysis: analysisResult, issues: validationIssues };
    }
};
