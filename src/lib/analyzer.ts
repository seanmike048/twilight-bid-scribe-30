
/**
 * src/lib/analyzer.ts
 * ------------------
 * Comprehensive OpenRTB Bid Request Analyser
 * ------------------------------------------
 * Implements a modular, extensible rule-engine for validating bid requests
 * against OpenRTB 2.6 (living spec) plus partner-specific constraints.
 *
 * Features:
 *  - No runtime dependencies.
 *  - Pure predicate-based rule objects.
 *  - Automatic inventory-type & partner detection.
 *  - Memoised parsing & analysis for idempotent performance.
 */

export enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface Issue {
  id: string;
  severity: Severity;
  message: string;
  path?: string;
  specRef?: string;
}

export interface AnalysisSummary {
  requestType: 'Banner' | 'Video' | 'Audio' | 'Native' | 'Mixed' | 'Unknown';
  mediaFormats: string[];
  impressions: number;
  platform: 'App' | 'Site' | 'Unknown';
  deviceType:
    | 'Mobile/Tablet'
    | 'PC'
    | 'Connected TV'
    | 'Phone'
    | 'Tablet'
    | 'Connected Device'
    | 'Set-top Box'
    | 'Unknown';
  geo: string;
}

export interface AnalysisResult {
  summary: AnalysisSummary;
  issues: Issue[];
  request: any;
  error?: string;
}

// Legacy interface for compatibility
export interface ValidationIssue {
  severity: 'Error' | 'Warning' | 'Info';
  message: string;
  path: string;
}

export interface AnalyseOptions {
  /** Force CTV context (overrides auto-detect) */
  forceCTV?: boolean;
  /** Partner profile, e.g. 'sharethrough' */
  partnerProfile?: 'sharethrough';
}

interface Context {
  root: any;
  inventory: Set<'banner' | 'video' | 'audio' | 'native' | 'dooh'>;
  isCTV: boolean;
  partnerProfile?: 'sharethrough';
}

interface Rule {
  id: string;
  description: string;
  severity: Severity;
  path?: string;
  specRef?: string;
  /** Whether this rule applies in the given context. */
  applies?: (ctx: Context) => boolean;
  /** Returns true if valid. */
  validate: (ctx: Context) => boolean;
}

// Device type mapping (OpenRTB 2.5/2.6)
const DEVICE_TYPE: Record<number, AnalysisSummary['deviceType']> = {
  1: 'Mobile/Tablet',
  2: 'PC',
  3: 'Connected TV',
  4: 'Phone',
  5: 'Tablet',
  6: 'Connected Device',
  7: 'Set-top Box',
};

// parseCache: memoise by exact JSON text
const parseCache = new Map<string, AnalysisResult>();

/** Safe JSON.parse wrapper */
function safeJsonParse(txt: string) {
  try { return { ok: true, value: JSON.parse(txt) }; }
  catch (err) { return { ok: false, error: err as Error }; }
}

/** Recursively find the OpenRTB request object (root.id && imp[]) */
function findBidRequest(obj: any): any | null {
  if (obj && typeof obj === 'object') {
    if (typeof obj.id === 'string' && Array.isArray(obj.imp)) return obj;
    for (const key of Object.keys(obj)) {
      const found = findBidRequest(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

const isString = (v: any): v is string => typeof v === 'string';
const isNonEmptyString = (v: any): v is string => isString(v) && v.trim() !== '';

/* ------------------------------------------------------------------ */
/*                          RULE DEFINITIONS                          */
/* ------------------------------------------------------------------ */

const coreRules: Rule[] = [
  {
    id: 'missing-request',
    description: 'No valid OpenRTB bid request found.',
    severity: Severity.ERROR,
    validate: ({ root }) => !!root,
  },
  {
    id: 'id-required',
    description: 'BidRequest.id must be a non-empty string.',
    severity: Severity.ERROR,
    path: 'id',
    specRef: 'OpenRTB 2.6 §3.2.1',
    applies: ({ root }) => !!root,
    validate: ({ root }) => isNonEmptyString(root.id),
  },
  {
    id: 'imp-required',
    description: 'BidRequest.imp array must have at least one impression.',
    severity: Severity.ERROR,
    path: 'imp',
    specRef: 'OpenRTB 2.6 §3.2.1',
    applies: ({ root }) => !!root,
    validate: ({ root }) => Array.isArray(root.imp) && root.imp.length > 0,
  },
  {
    id: 'app-site-xor',
    description: 'Exactly one of BidRequest.app or BidRequest.site must be present.',
    severity: Severity.ERROR,
    specRef: 'OpenRTB 2.6 §3.2.1',
    applies: ({ root }) => !!root,
    validate: ({ root }) => Boolean((root.app && !root.site) || (!root.app && root.site)),
  },
  {
    id: 'device-recommended',
    description: 'Device object is recommended for targeting; its absence limits functionality.',
    severity: Severity.WARNING,
    path: 'device',
    specRef: 'OpenRTB 2.6 §3.2.18',
    applies: ({ root }) => !!root,
    validate: ({ root }) => !!root.device,
  },
  {
    id: 'device-ua-ip',
    description: 'Device should include ip/ipv6 or ua/sua for device identification.',
    severity: Severity.WARNING,
    path: 'device',
    specRef: 'OpenRTB 2.6 §3.2.18',
    applies: ({ root }) => !!root.device,
    validate: ({ root }) => {
      const d = root.device;
      return !!(
        isNonEmptyString(d.ip) || isNonEmptyString(d.ipv6) ||
        isNonEmptyString(d.ua) || d.sua
      );
    },
  },
  {
    id: 'regs-gdpr',
    description: 'If regs.gdpr is present, it must be 0 or 1.',
    severity: Severity.ERROR,
    path: 'regs.gdpr',
    specRef: 'OpenRTB 2.6 §3.2.3',
    applies: ({ root }) => !!root.regs,
    validate: ({ root }) => root.regs.gdpr === 0 || root.regs.gdpr === 1,
  },
  {
    id: 'gdpr-consent',
    description: 'GDPR=1 but user.ext.consent is missing or empty.',
    severity: Severity.ERROR,
    path: 'user.ext.consent',
    specRef: 'IAB TCF v2.x',
    applies: ({ root }) => root.regs?.gdpr === 1,
    validate: ({ root }) => isNonEmptyString(root.user?.ext?.consent),
  },
];

const bannerRules: Rule[] = [
  {
    id: 'banner-dimensions',
    description: 'Banner impression must define w/h or a non-empty format array.',
    severity: Severity.ERROR,
    path: 'imp[].banner',
    specRef: 'OpenRTB 2.6 §3.2.6',
    applies: ({ inventory }) => inventory.has('banner'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.banner) return true;
        const b = imp.banner;
        if (b.w > 0 && b.h > 0) return true;
        if (Array.isArray(b.format) && b.format.length)
          return b.format.every((f: any) => f.w > 0 && f.h > 0);
        return false;
      }),
  },
];

const videoRules: Rule[] = [
  {
    id: 'video-mimes',
    description: 'Video.mimes must be a non-empty array of strings.',
    severity: Severity.ERROR,
    path: 'imp[].video.mimes',
    specRef: 'OpenRTB 2.6 §3.2.7',
    applies: ({ inventory }) => inventory.has('video'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => !imp.video ||
        (Array.isArray(imp.video.mimes) && imp.video.mimes.length > 0)),
  },
  {
    id: 'video-durations',
    description: 'Video.rqddurs and minduration/maxduration are mutually exclusive.',
    severity: Severity.ERROR,
    path: 'imp[].video',
    applies: ({ inventory }) => inventory.has('video'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.video) return true;
        const v = imp.video;
        const hasRange = v.minduration !== undefined || v.maxduration !== undefined;
        const hasList = Array.isArray(v.rqddurs) && v.rqddurs.length > 0;
        return !(hasRange && hasList);
      }),
  },
];

const nativeRules: Rule[] = [
  {
    id: 'native-json',
    description: 'imp.native.request must be valid JSON.',
    severity: Severity.ERROR,
    path: 'imp[].native.request',
    specRef: 'IAB Native 1.2 §4',
    applies: ({ inventory }) => inventory.has('native'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.native) return true;
        if (!isNonEmptyString(imp.native.request)) return false;
        return safeJsonParse(imp.native.request).ok;
      }),
  },
];

const doohRules: Rule[] = [
  {
    id: 'dooh-qty',
    description: 'imp.qty.multiplier must be a positive number for DOOH.',
    severity: Severity.ERROR,
    path: 'imp[].qty.multiplier',
    applies: ({ inventory }) => inventory.has('dooh'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => !imp.qty || imp.qty.multiplier > 0),
  },
];

const sharethroughRules: Rule[] = [
  {
    id: 'st-pkey',
    description: 'Sharethrough profile: ext.sharethrough.pkey is required.',
    severity: Severity.ERROR,
    path: 'imp[].ext.sharethrough.pkey',
    applies: ({ partnerProfile }) => partnerProfile === 'sharethrough',
    validate: ({ root }) =>
      root.imp.every((imp: any) => isNonEmptyString(imp.ext?.sharethrough?.pkey)),
  },
];

const allRuleSets = [
  coreRules,
  bannerRules,
  videoRules,
  nativeRules,
  doohRules,
  sharethroughRules,
];

/** Primary analyse function */
export function analyse(
  jsonText: string,
  options: AnalyseOptions = {}
): AnalysisResult {
  // Memoised parse
  const cached = parseCache.get(jsonText);
  if (cached) return cached;

  // JSON parse
  const parsed = safeJsonParse(jsonText);
  if (!parsed.ok) {
    const result: AnalysisResult = {
      summary: {
        requestType: 'Unknown', mediaFormats: [], impressions: 0,
        platform: 'Unknown', deviceType: 'Unknown', geo: 'N/A',
      },
      issues: [{ id: 'json-parse', severity: Severity.ERROR,
        message: `Invalid JSON: ${parsed.error.message}` }],
      request: undefined,
      error: `Invalid JSON: ${parsed.error.message}`,
    };
    parseCache.set(jsonText, result);
    return result;
  }

  // Find root bid request
  const root = findBidRequest(parsed.value);

  // Build context
  const ctx: Context = {
    root,
    inventory: new Set(),
    isCTV: Boolean(options.forceCTV),
    partnerProfile: options.partnerProfile,
  };
  if (root && Array.isArray(root.imp)) {
    root.imp.forEach((imp: any) => {
      if (imp.banner) ctx.inventory.add('banner');
      if (imp.video) ctx.inventory.add('video');
      if (imp.audio) ctx.inventory.add('audio');
      if (imp.native) ctx.inventory.add('native');
      if (imp.qty) ctx.inventory.add('dooh');
    });
    // Auto-detect CTV by device.devicetype
    const dt = root.device?.devicetype;
    if (!ctx.isCTV && dt === 3) ctx.isCTV = true;
  }

  // Collect issues
  const issues: Issue[] = [];
  allRuleSets.forEach((rules) => {
    rules.forEach((rule) => {
      if (!rule.applies || rule.applies(ctx)) {
        const valid = rule.validate(ctx);
        if (!valid) {
          issues.push({
            id: rule.id,
            severity: rule.severity,
            message: rule.description,
            path: rule.path,
            specRef: rule.specRef,
          });
        }
      }
    });
  });

  // Derive summary
  const mediaFormats = Array.from(ctx.inventory);
  const requestType: AnalysisSummary['requestType'] =
    mediaFormats.length === 1
      ? (mediaFormats[0].charAt(0).toUpperCase() + mediaFormats[0].slice(1)) as any
      : mediaFormats.length > 1
      ? 'Mixed' : 'Unknown';
  const platform = root?.app ? 'App' : root?.site ? 'Site' : 'Unknown';
  const impressions = Array.isArray(root?.imp) ? root.imp.length : 0;
  const deviceType = DEVICE_TYPE[root?.device?.devicetype] || 'Unknown';
  const geo = root?.device?.geo?.country || 'N/A';

  const summary: AnalysisSummary = {
    requestType, mediaFormats, impressions, platform, deviceType, geo,
  };

  const result: AnalysisResult = { summary, issues, request: root };
  parseCache.set(jsonText, result);
  return result;
}

// Compatibility layer for existing components
export const analyzer = {
  analyze: (jsonText: string): { analysis: AnalysisResult; issues: ValidationIssue[] } => {
    const result = analyse(jsonText);
    
    // Convert issues to legacy format
    const legacyIssues: ValidationIssue[] = result.issues.map(issue => ({
      severity: issue.severity === 'error' ? 'Error' : 
                issue.severity === 'warning' ? 'Warning' : 'Info',
      message: issue.message,
      path: issue.path || 'unknown',
    }));

    return {
      analysis: result,
      issues: legacyIssues,
    };
  }
};
