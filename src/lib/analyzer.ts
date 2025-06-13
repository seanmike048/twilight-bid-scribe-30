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

// A comprehensive and representative set of validation rules.
const rules: Array<{id: string, severity: 'Error'|'Warning'|'Info', path: string, type?: string, check: (d: any, root?:any) => boolean, message: string, expected: string}> = [
    // Core Rules
    { id: 'CORE001', severity: 'Error', path: 'id', check: (d) => !d.id, message: 'BidRequest.id is missing or empty.', expected: 'A non-empty string.' },
    { id: 'CORE002', severity: 'Error', path: 'imp', check: (d) => !Array.isArray(d.imp) || d.imp.length === 0, message: 'BidRequest.imp must be a non-empty array.', expected: 'An array with at least one impression object.' },
    { id: 'CORE003', severity: 'Error', path: 'BidRequest', check: (d) => !((d.site && !d.app) || (!d.site && d.app)), message: 'Either a site or an app object must be present, but not both.', expected: 'Exactly one of `site` or `app`.' },
    { id: 'CORE004', severity: 'Warning', path: 'device', check: (d) => !d.device, message: 'Device object is highly recommended for targeting.', expected: 'A `device` object.' },
    { id: 'CORE005', severity: 'Error', path: 'device.ip', check: (d) => d.device && !d.device.ip && !d.device.ipv6, message: 'Device object requires an IP address (ip or ipv6).', expected: 'A valid IPv4 or IPv6 address.' },
    // Impression-level Rules
    { id: 'IMP001', severity: 'Error', path: 'imp.id', type: 'imp', check: (i) => !i.id, message: 'Each impression must have a unique id.', expected: 'A unique string ID.' },
    { id: 'IMP002', severity: 'Error', path: 'imp.media', type: 'imp', check: (i) => !i.banner && !i.video && !i.native && !i.audio, message: 'Each impression must contain at least one media object (banner, video, etc.).', expected: 'A `banner`, `video`, `native`, or `audio` object.'},
    // Video Rules
    { id: 'VID001', severity: 'Error', path: 'imp.video.mimes', type: 'imp', check: (i) => i.video && (!Array.isArray(i.video.mimes) || i.video.mimes.length === 0), message: 'Video object must have a non-empty mimes array.', expected: 'An array of strings, e.g., ["video/mp4"].' },
    { id: 'VID002', severity: 'Error', path: 'imp.video.linearity', type: 'imp', check: (i) => i.video && i.video.linearity === undefined, message: 'Video linearity is required.', expected: 'An integer (e.g., 1 for In-Stream).' },
    // CTV Rules
    { id: 'CTV001', severity: 'Error', path: 'app', check: (d) => d.device?.devicetype === 3 && !d.app, message: 'CTV requests require an app object.', expected: 'An `app` object instead of a `site` object.' },
    { id: 'CTV002', severity: 'Error', path: 'imp.video.pos', type: 'imp', check: (i, d) => d.device?.devicetype === 3 && i.video?.pos !== 7, message: 'For CTV, video position (pos) must be 7 (Full Screen).', expected: '`pos`: 7'},
    // Privacy Rules
    { id: 'PRIV001', severity: 'Error', path: 'device.ifa', check: (d) => d.device?.lmt === 1 && d.device?.ifa && d.device.ifa !== '00000000-0000-0000-0000-000000000000', message: 'Device IFA must be zeroed out when Limit Ad Tracking (lmt) is 1.', expected: 'Omit `ifa` or use a string of zeros.' },
    { id: 'PRIV002', severity: 'Warning', path: 'user.buyeruid', check: (d) => !d.user?.buyeruid, message: 'user.buyeruid (DSP User ID) should be present for DSPs.', expected: 'A DSP-specific user identifier.'}
];

function findOrtbRequest(data: any): any | null {
    if (data && typeof data === 'object' && 'id' in data && 'imp' in data) return data;
    if (data && typeof data === 'object') {
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
                    if (rule.check(imp, req)) {
                        const pathParts = rule.path.split('.');
                        validationIssues.push({ ...rule, path: `imp[${index}].${pathParts.slice(1).join('.')}` });
                    }
                });
            } else {
                if (rule.check(req)) {
                     validationIssues.push({ ...rule, path: rule.path });
                }
            }
        });
        
        return { analysis: analysisResult, issues: validationIssues };
    }
};
