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

// Store URL patterns and validation data
const STORE_URL_PATTERNS = {
  ios: {
    patterns: [
      /^https:\/\/apps\.apple\.com\/.*\/app\/.*\/id(\d+)$/,
      /^https:\/\/apps\.apple\.com\/app\/id(\d+)$/,
      /^https:\/\/apps\.apple\.com\/us\/app\/id(\d+)$/
    ],
    bundlePattern: /^\d+$/,
    platform: 'iOS/tvOS'
  },
  android: {
    patterns: [
      /^https:\/\/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)$/
    ],
    bundlePattern: /^[a-zA-Z0-9._]+$/,
    platform: 'Android/AndroidTV'
  },
  roku: {
    patterns: [
      /^https:\/\/channelstore\.roku\.com\/details\/([a-zA-Z0-9]+)\/.*$/,
      /^https:\/\/channelstore\.roku\.com\/details\/(\d+)\/?$/
    ],
    bundlePattern: /^\d+$/,
    platform: 'Roku OS'
  }
};

// Data center mappings
const DATA_CENTERS = [
  { id: 2, name: "Telecity", continent: null, technical: "", city: "" },
  { id: 3, name: "Equinix", technical: "eqx", continent: "Europe", city: "St Denis, Paris Area, FR" },
  { id: 4, name: "Interxion5", technical: "itx5", continent: "Europe", city: "Velizy, Paris Area, FR" },
  { id: 5, name: "Terremark", technical: "tmk", continent: "Americas", city: "Miami, Florida, US" },
  { id: 10, name: "USW1", technical: "usw1", continent: "Americas", city: "Los Angeles, CA, US" },
  { id: 11, name: "EUW1", technical: "euw1", continent: "Europe", city: "Amsterdam, NL" },
  { id: 12, name: "USE1", technical: "use1", continent: "Americas", city: "Washington, US" },
  { id: 13, name: "APAC1", technical: "apac1", continent: "Asia", city: "Singapore, SG" },
  { id: 14, name: "EUW2", technical: "euw2", continent: "Europe", city: "Gravelines, hauts-de-france, FR" },
  { id: 16, name: "USE2", technical: "use2", continent: "Americas", city: "Warrenton, VA, US" }
];

// Country to continent mapping
const COUNTRY_CONTINENT_MAP: { [key: string]: string } = {
  "USA": "Americas", "DEU": "Europe", "FRA": "Europe", "GBR": "Europe", "CHN": "Asia", "JPN": "Asia"
  // ... additional countries omitted for brevity
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

// Validation helpers
const isString = (v: any): v is string => typeof v === 'string';
const isNonEmptyString = (v: any): v is string => isString(v) && v.trim() !== '';

const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

const isValidIPv6 = (ip: string): boolean => {
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  return ipv6Regex.test(ip);
};

const containsMacros = (text: string): boolean => {
  return /[\{\[][a-zA-Z_][a-zA-Z0-9_]*[\}\]]/.test(text);
};

const isTruncatedIP = (ip: string): boolean => {
  return ip.endsWith('.0') || ip.includes('xxx') || ip.includes('***');
};

const isTruncatedIPv6 = (ipv6: string): boolean => {
  return ipv6.includes('::') && ipv6.length < 15;
};

const validateStoreUrlAndBundle = (storeUrl: string, bundle: string, issues: Issue[]) => {
  for (const [platform, config] of Object.entries(STORE_URL_PATTERNS)) {
    for (const pattern of config.patterns) {
      const match = storeUrl.match(pattern);
      if (match) {
        const extractedId = match[1];
        if (!config.bundlePattern.test(bundle) || extractedId !== bundle) {
          issues.push({
            id: 'EQ-App-009',
            severity: Severity.ERROR,
            message: `Store URL and bundle mismatch for ${platform}`,
            path: 'BidRequest.app',
            specRef: `${platform} store pattern`
          });
        }
        return;
      }
    }
  }
  
  issues.push({
    id: 'EQ-App-010',
    severity: Severity.ERROR,
    message: 'Store URL does not match any known platform pattern',
    path: 'BidRequest.app.storeurl'
  });
};

const validateCountryDatacenterMatch = (country: string, datacenterId: number | undefined, issues: Issue[]) => {
  if (!datacenterId || !COUNTRY_CONTINENT_MAP[country]) return;

  const datacenter = DATA_CENTERS.find(dc => dc.id === datacenterId);
  if (!datacenter || !datacenter.continent) return;

  const countryContinent = COUNTRY_CONTINENT_MAP[country];
  
  if (datacenter.continent !== countryContinent) {
    issues.push({
      id: 'EQ-Device-024',
      severity: Severity.WARNING,
      message: 'Country continent mismatch with datacenter continent',
      path: 'BidRequest.device.geo.country'
    });
  }
};

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
    id: 'Core-BR-001',
    description: 'BidRequest.id must be present and be a non-empty string',
    severity: Severity.ERROR,
    path: 'BidRequest.id',
    specRef: 'OpenRTB 2.6 §3.2.1',
    applies: ({ root }) => !!root,
    validate: ({ root }) => isNonEmptyString(root.id),
  },
  {
    id: 'Core-BR-003',
    description: 'BidRequest.imp must be a non-empty array',
    severity: Severity.ERROR,
    path: 'BidRequest.imp',
    specRef: 'OpenRTB 2.6 §3.2.1',
    applies: ({ root }) => !!root,
    validate: ({ root }) => Array.isArray(root.imp) && root.imp.length > 0,
  },
  {
    id: 'Core-BR-005',
    description: 'Exactly one of BidRequest.app or BidRequest.site must be present',
    severity: Severity.ERROR,
    specRef: 'OpenRTB 2.6 §3.2.1',
    applies: ({ root }) => !!root,
    validate: ({ root }) => Boolean((root.app && !root.site) || (!root.app && root.site)),
  },
];

const impressionRules: Rule[] = [
  {
    id: 'Core-Imp-001',
    description: 'Each impression must contain a unique id (string)',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].id',
    specRef: 'OpenRTB 2.6 §3.2.4',
    applies: ({ root }) => !!root,
    validate: ({ root }) => {
      if (!Array.isArray(root.imp)) return true;
      const ids = new Set();
      return root.imp.every((imp: any) => {
        if (!isNonEmptyString(imp.id)) return false;
        if (ids.has(imp.id)) return false;
        ids.add(imp.id);
        return true;
      });
    },
  },
  {
    id: 'Core-Imp-002',
    description: 'Each impression must contain either video, native, or banner object',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[]',
    specRef: 'OpenRTB 2.6 §3.2.4',
    applies: ({ root }) => !!root,
    validate: ({ root }) => {
      if (!Array.isArray(root.imp)) return true;
      return root.imp.every((imp: any) => {
        const hasVideo = !!imp.video;
        const hasNative = !!imp.native;
        const hasBanner = !!imp.banner;
        return hasVideo || hasNative || hasBanner;
      });
    },
  },
  {
    id: 'Core-Imp-003',
    description: 'Each impression must contain only one of video, native, or banner',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[]',
    specRef: 'OpenRTB 2.6 §3.2.4',
    applies: ({ root }) => !!root,
    validate: ({ root }) => {
      if (!Array.isArray(root.imp)) return true;
      return root.imp.every((imp: any) => {
        const hasVideo = !!imp.video;
        const hasNative = !!imp.native;
        const hasBanner = !!imp.banner;
        const mediaCount = [hasVideo, hasNative, hasBanner].filter(Boolean).length;
        return mediaCount <= 1;
      });
    },
  },
  {
    id: 'Core-Imp-004',
    description: 'bidfloor must be a non-negative number',
    severity: Severity.WARNING,
    path: 'BidRequest.imp[].bidfloor',
    applies: ({ root }) => !!root,
    validate: ({ root }) => {
      if (!Array.isArray(root.imp)) return true;
      return root.imp.every((imp: any) => 
        imp.bidfloor === undefined || (typeof imp.bidfloor === 'number' && imp.bidfloor >= 0)
      );
    },
  },
  {
    id: 'Core-Imp-005',
    description: 'bidfloorcur must be present when bidfloor is specified',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].bidfloorcur',
    applies: ({ root }) => !!root,
    validate: ({ root }) => {
      if (!Array.isArray(root.imp)) return true;
      return root.imp.every((imp: any) => 
        imp.bidfloor === undefined || isNonEmptyString(imp.bidfloorcur)
      );
    },
  },
  {
    id: 'Core-Imp-006',
    description: 'secure must be 0 or 1',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].secure',
    applies: ({ root }) => !!root,
    validate: ({ root }) => {
      if (!Array.isArray(root.imp)) return true;
      return root.imp.every((imp: any) => 
        imp.secure === undefined || imp.secure === 0 || imp.secure === 1
      );
    },
  },
];

const appRules: Rule[] = [
  {
    id: 'EQ-App-007',
    description: 'app.storeurl must be present and be a string',
    severity: Severity.ERROR,
    path: 'BidRequest.app.storeurl',
    applies: ({ root }) => !!root?.app,
    validate: ({ root }) => isNonEmptyString(root.app.storeurl),
  },
  {
    id: 'EQ-App-008',
    description: 'app.bundle must be present and be a string',
    severity: Severity.ERROR,
    path: 'BidRequest.app.bundle',
    applies: ({ root }) => !!root?.app,
    validate: ({ root }) => isNonEmptyString(root.app.bundle),
  },
  {
    id: 'EQ-App-018',
    description: 'app.storeurl must not contain un-replaced macros',
    severity: Severity.ERROR,
    path: 'BidRequest.app.storeurl',
    applies: ({ root }) => !!root?.app?.storeurl,
    validate: ({ root }) => !containsMacros(root.app.storeurl),
  },
  {
    id: 'Core-App-001',
    description: 'app.bundle must be present and be a string',
    severity: Severity.ERROR,
    path: 'BidRequest.app.bundle',
    specRef: 'OpenRTB 2.6 §3.2.14',
    applies: ({ root }) => !!root?.app,
    validate: ({ root }) => isNonEmptyString(root.app.bundle),
  },
  {
    id: 'Core-App-002',
    description: 'app.storeurl must be present and be a string',
    severity: Severity.ERROR,
    path: 'BidRequest.app.storeurl',
    specRef: 'OpenRTB 2.6 §3.2.14',
    applies: ({ root }) => !!root?.app,
    validate: ({ root }) => isNonEmptyString(root.app.storeurl),
  },
];

const siteRules: Rule[] = [
  {
    id: 'Core-Site-002',
    description: 'site object validation',
    severity: Severity.ERROR,
    path: 'BidRequest.site',
    specRef: 'OpenRTB 2.6 §3.2.13',
    applies: ({ root }) => !!root?.site,
    validate: ({ root }) => {
      const site = root.site;
      // Check for invalid page URLs like {page:"https://foo"}
      if (site.page && typeof site.page === 'object') {
        return false;
      }
      return true;
    },
  },
];

const deviceRules: Rule[] = [
  {
    id: 'EQ-Device-029',
    description: 'device.ip must be a valid IPv4 address',
    severity: Severity.ERROR,
    path: 'BidRequest.device.ip',
    applies: ({ root }) => !!root?.device?.ip,
    validate: ({ root }) => isValidIPv4(root.device.ip),
  },
  {
    id: 'Core-Device-003',
    description: 'device.ip must be a valid IPv4 address',
    severity: Severity.ERROR,
    path: 'BidRequest.device.ip',
    specRef: 'OpenRTB 2.6 §3.2.18',
    applies: ({ root }) => !!root?.device?.ip,
    validate: ({ root }) => isValidIPv4(root.device.ip),
  },
  {
    id: 'Core-Device-001',
    description: 'device.ua (User Agent) must be present and be a string',
    severity: Severity.ERROR,
    path: 'BidRequest.device.ua',
    specRef: 'OpenRTB 2.6 §3.2.18',
    applies: ({ root }) => !!root?.device,
    validate: ({ root }) => isNonEmptyString(root.device.ua),
  },
  {
    id: 'Core-Device-002',
    description: 'device must contain either ip (IPv4) or ipv6',
    severity: Severity.ERROR,
    path: 'BidRequest.device',
    specRef: 'OpenRTB 2.6 §3.2.18',
    applies: ({ root }) => !!root?.device,
    validate: ({ root }) => !!(root.device.ip || root.device.ipv6),
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
  {
    id: 'EQ-Video-037',
    description: 'imp.video.maxduration - imp.video.minduration must be greater than 30 seconds',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].video',
    applies: ({ inventory }) => inventory.has('video'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.video) return true;
        const v = imp.video;
        if (v.minduration && v.maxduration) {
          return (v.maxduration - v.minduration) >= 30;
        }
        return true;
      }),
  },
  {
    id: 'Video-V-001',
    description: 'video.mimes must be present and be a non-empty array of strings',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].video.mimes',
    applies: ({ inventory }) => inventory.has('video'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => !imp.video ||
        (Array.isArray(imp.video.mimes) && imp.video.mimes.length > 0 &&
         imp.video.mimes.every((mime: any) => typeof mime === 'string'))),
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
  {
    id: 'Banner-B-001',
    description: 'banner must contain either w/h or format array',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].banner',
    applies: ({ inventory }) => inventory.has('banner'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.banner) return true;
        const b = imp.banner;
        const hasWH = b.w !== undefined && b.h !== undefined;
        const hasFormat = b.format && Array.isArray(b.format) && b.format.length > 0;
        return hasWH || hasFormat;
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

const ctvRules: Rule[] = [
  {
    id: 'EQ-CTV-053',
    description: 'CTV video should have 16:9 aspect ratio',
    severity: Severity.WARNING,
    path: 'imp[].video',
    applies: ({ isCTV, inventory }) => isCTV && inventory.has('video'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.video) return true;
        const v = imp.video;
        if (v.w && v.h) {
          const aspectRatio = v.w / v.h;
          return Math.abs(aspectRatio - 16/9) < 0.1; // Allow small tolerance
        }
        return true; // Skip if dimensions not available
      }),
  },
  {
    id: 'EQ-CTV-052',
    description: 'CTV: imp.video.pos must be set to 7 (Full Screen)',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].video.pos',
    applies: ({ isCTV, inventory }) => isCTV && inventory.has('video'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.video) return true;
        return imp.video.pos === 7;
      }),
  },
  {
    id: 'CTV-007',
    description: 'CTV video pos must be 7 (Full Screen)',
    severity: Severity.ERROR,
    path: 'BidRequest.imp[].video.pos',
    applies: ({ isCTV, inventory }) => isCTV && inventory.has('video'),
    validate: ({ root }) =>
      root.imp.every((imp: any) => {
        if (!imp.video) return true;
        return imp.video.pos === 7;
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

const privacyRules: Rule[] = [
  {
    id: 'regs-gdpr',
    description: 'If regs.gdpr is present, it must be 0 or 1.',
    severity: Severity.ERROR,
    path: 'regs.gdpr',
    specRef: 'OpenRTB 2.6 §3.2.3',
    applies: ({ root }) => !!root?.regs && root.regs.gdpr !== undefined,
    validate: ({ root }) => root.regs.gdpr === 0 || root.regs.gdpr === 1,
  },
  {
    id: 'gdpr-consent',
    description: 'GDPR=1 but user.ext.consent is missing or empty.',
    severity: Severity.ERROR,
    path: 'user.ext.consent',
    specRef: 'IAB TCF v2.x',
    applies: ({ root }) => root?.regs?.gdpr === 1,
    validate: ({ root }) => isNonEmptyString(root.user?.ext?.consent),
  },
];

const allRuleSets = [
  coreRules,
  impressionRules,
  appRules,
  siteRules,
  deviceRules,
  videoRules,
  bannerRules,
  nativeRules,
  ctvRules,
  doohRules,
  sharethroughRules,
  privacyRules,
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
    const dt = root?.device?.devicetype;
    if (!ctx.isCTV && (dt === 3 || dt === 5)) ctx.isCTV = true;
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

  // Enhanced validation for complex scenarios
  if (root) {
    // Store URL and bundle validation for apps
    if (root.app && root.app.storeurl && root.app.bundle) {
      validateStoreUrlAndBundle(root.app.storeurl, root.app.bundle, issues);
    }

    // Country datacenter validation
    if (root.device?.geo?.country && root.ext?.auctionDatacenterId) {
      validateCountryDatacenterMatch(root.device.geo.country, root.ext.auctionDatacenterId, issues);
    }
  }

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
