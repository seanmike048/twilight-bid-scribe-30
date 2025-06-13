
// FILE: src/lib/analyzer.ts
// This module contains all the core logic for parsing, analyzing,
// and validating OpenRTB bid requests.

// --- TYPE DEFINITIONS ---
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

// --- VALIDATION RULES ---
// A representative and robust set of rules based on project documentation.
// This can be expanded with all 120+ rules.
const rules = [
    { severity: 'Error', path: 'id', check: (d: any) => !d.id, message: 'BidRequest.id is missing or empty.', expected: 'A non-empty string.' },
    { severity: 'Error', path: 'imp', check: (d: any) => !Array.isArray(d.imp) || d.imp.length === 0, message: 'BidRequest.imp must be a non-empty array.', expected: 'An array with at least one impression object.' },
    { severity: 'Error', path: 'BidRequest', check: (d: any) => !( (d.site && !d.app) || (!d.site && d.app) ), message: 'Either a site or an app object must be present, but not both.', expected: 'Exactly one of `site` or `app`.' },
    { severity: 'Warning', path: 'device', check: (d: any) => !d.device, message: 'Device object is highly recommended for targeting.', expected: 'A `device` object.' },
    { severity: 'Error', path: 'device.ip', check: (d: any) => d.device && !d.device.ip && !d.device.ipv6, message: 'Device object requires an IP address (ip or ipv6).', expected: 'A valid IPv4 or IPv6 address.' },
    { severity: 'Error', path: 'user.ext.consent', check: (d: any) => d.regs?.gdpr === 1 && !d.user?.ext?.consent, message: 'GDPR consent string missing when regs.gdpr=1.', expected: 'A valid TCFv2+ string.' },
    { severity: 'Error', path: 'imp.id', type: 'imp', check: (i: any) => !i.id, message: 'Each impression must have a unique id.', expected: 'A unique string ID.' },
    { severity: 'Error', path: 'imp.video.mimes', type: 'imp', check: (i: any) => i.video && (!Array.isArray(i.video.mimes) || i.video.mimes.length === 0), message: 'Video object must have a non-empty mimes array.', expected: 'An array of strings, e.g., ["video/mp4"].' },
    { severity: 'Error', path: 'imp.video.linearity', type: 'imp', check: (i: any) => i.video && i.video.linearity === undefined, message: 'Video linearity is required.', expected: 'An integer (e.g., 1 for In-Stream).' },
    { severity: 'Error', path: 'app', check: (d: any) => d.device?.devicetype === 3 && !d.app, message: 'CTV requests require an app object.', expected: 'An `app` object instead of a `site` object.' },
    { severity: 'Error', path: 'device.ifa', check: (d: any) => d.device?.lmt === 1 && d.device?.ifa && d.device.ifa !== '00000000-0000-0000-0000-000000000000', message: 'Device IFA must be zeroed out when Limit Ad Tracking (lmt) is 1.', expected: 'Omit `ifa` or use a string of zeros.' },
];


function findOrtbRequest(data: any): any | null {
    if (data && typeof data === 'object' && 'id' in data && 'imp' in data) {
        return data;
    }
    if (data && typeof data === 'object') {
        // Look for a nested bid request
        for (const key in data) {
            if (typeof data[key] === 'object' && data[key] !== null) {
                const found = findOrtbRequest(data[key]);
                if (found) return found;
            }
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
            const errorMsg = 'Invalid JSON format. The input could not be parsed.';
            return {
                analysis: { error: errorMsg, requestType: "Error", mediaFormats: [], impressions: 0, platform: "", deviceType: "", geo: "" },
                issues: [{ severity: 'Error', message: errorMsg, path: 'JSON root', expected: 'Well-formed JSON' }]
            };
        }

        const req = findOrtbRequest(data);
        if (!req) {
             const errorMsg = 'Not a valid OpenRTB Bid Request. Missing required `id` or `imp` fields at the root.';
            return {
                analysis: { error: errorMsg, requestType: "Error", mediaFormats: [], impressions: 0, platform: "", deviceType: "", geo: "" },
                issues: [{ severity: 'Error', message: errorMsg, path: 'BidRequest', expected: 'An object with `id` and `imp` keys.' }]
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
            requestType = 'Display';
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
                        validationIssues.push({ severity: rule.severity as any, message: rule.message, path: `imp[${index}].${rule.path.split('.')[1]}`, expected: rule.expected });
                    }
                });
            } else {
                if (rule.check(req)) {
                     validationIssues.push({ severity: rule.severity as any, message: rule.message, path: rule.path, expected: rule.expected });
                }
            }
        });
        
        return { analysis: analysisResult, issues: validationIssues };
    }
};
