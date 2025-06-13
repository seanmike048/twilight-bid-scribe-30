/**
 * Comprehensive OpenRTB Bid Request Analyser
 * ------------------------------------------
 * Implements a modular rule‑engine capable of validating bid requests
 * against OpenRTB 2.6 (living standard) plus selected partner‑specific
 * constraints.  Rules are organised in arrays so new ones can be added
 * by simply pushing to the collection.
 *
 * ✱  No runtime dependencies.
 * ✱  Stateless rule objects – pure predicate functions.
 * ✱  Automatic inventory‑type & partner detection.
 * ✱  Memoised results so identical JSON strings never pay the cost twice.
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
}

export interface AnalyseOptions {
  /** Force‑enable CTV context (otherwise auto‑detect) */
  forceCTV?: boolean;
  /** Force partner profile (otherwise auto) */
  partnerProfile?: 'sharethrough';
}

interface Context {
  inventoryTypes: Set<'banner' | 'video' | 'audio' | 'native' | 'dooh'>;
  isCTV: boolean;
  partnerProfile?: 'sharethrough';
  root: any;
}

interface Rule {
  id: string;
  description: string;
  severity: Severity;
  path?: string;
  specRef?: string;
  applies?: (ctx: Context) => boolean; // default = always true
  validate: (ctx: Context) => boolean;
}

const DEVICE_TYPE: Record<number, AnalysisSummary['deviceType']> = {
  1: 'Mobile/Tablet',
  2: 'PC',
  3: 'Connected TV',
  4: 'Phone',
  5: 'Tablet',
  6: 'Connected Device',
  7: 'Set-top Box',
};

/* ------------------------------------------------------------ */
/*               helpers (private to this module)               */
/* ------------------------------------------------------------ */

function safeJsonParse<T = any>(txt: string): { ok: true; value: T } | { ok: false; error: Error } {
  try {
    return { ok: true, value: JSON.parse(txt) };
  } catch (err) {
    return { ok: false, error: err as Error };
  }
}

function findBidRequest(node: any): any | undefined {
  if (!node || typeof node !== 'object') return undefined;
  if ('id' in node && Array.isArray(node.imp)) return node;
  for (const key of Object.keys(node)) {
    const found = findBidRequest(node[key]);
    if (found) return found;
  }
  return undefined;
}

const isNonEmptyString = (v: any): v is string => typeof v === 'string' && v.trim().length > 0;

/* ------------------------------------------------------------ */
/*                         rule lists                           */
/* ------------------------------------------------------------ */

const coreRules: Rule[] = [
  {
    id: 'bidrequest-id',
    description: 'BidRequest.id must be a non‑empty string',
    severity: Severity.ERROR,
    path: 'id',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.1',
    validate: ({ root }) => isNonEmptyString(root?.id),
  },
  {
    id: 'imp-array',
    description: 'BidRequest.imp must be a non‑empty array',
    severity: Severity.ERROR,
    path: 'imp',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.1',
    validate: ({ root }) => Array.isArray(root?.imp) && root.imp.length > 0,
  },
  {
    id: 'app-site-xor',
    description: 'Exactly one of BidRequest.app or BidRequest.site must be present',
    severity: Severity.ERROR,
    path: '',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.1',
    validate: ({ root }) =>
      Boolean(root) && ((root.app && !root.site) || (!root.app && root.site)),
  },
  {
    id: 'device-recommended',
    description: 'Device object missing – highly recommended for accurate targeting',
    severity: Severity.WARNING,
    path: 'device',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.18',
    validate: ({ root }) => !!root.device,
  },
  {
    id: 'device-ua-ip',
    description: 'Device should carry at least ip/ipv6 or ua/sua',
    severity: Severity.WARNING,
    path: 'device',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.18',
    validate: ({ root }) => {
      const d = root.device;
      return !!(
        d &&
        (isNonEmptyString(d.ip) ||
          isNonEmptyString(d.ipv6) ||
          isNonEmptyString(d.ua) ||
          d.sua)
      );
    },
  },
  {
    id: 'user-recommended',
    description: 'User object is recommended – its absence limits frequency & user‑level targeting',
    severity: Severity.WARNING,
    path: 'user',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.20',
    validate: ({ root }) => !!root.user,
  },
  {
    id: 'regs-gdpr-bool',
    description: 'regs.gdpr must be 0 or 1 when present',
    severity: Severity.ERROR,
    path: 'regs.gdpr',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.3',
    validate: ({ root }) => {
      if (root.regs && root.regs.gdpr !== undefined) {
        return root.regs.gdpr === 0 || root.regs.gdpr === 1;
      }
      return true;
    },
  },
  {
    id: 'gdpr-consent-required',
    description: 'GDPR signalled (regs.gdpr=1) but user.ext.consent missing or empty',
    severity: Severity.ERROR,
    path: 'user.ext.consent',
    specRef: 'IAB\u00A0TCF\u00A0v2.x',
    applies: ({ root }) => root.regs?.gdpr === 1,
    validate: ({ root }) => isNonEmptyString(root.user?.ext?.consent),
  },
  {
    id: 'us-privacy-format',
    description: 'regs.us_privacy string format appears invalid',
    severity: Severity.WARNING,
    path: 'regs.us_privacy',
    specRef: 'IAB\u00A0US\u00A0Privacy',
    validate: ({ root }) =>
      !root.regs?.us_privacy ||
      /^[0-9YN\-]{4}$/.test(root.regs.us_privacy as string),
  },
  {
    id: 'device-ifa-lmt',
    description:
      'device.lmt=1 implies device.ifa must be absent or “000…000”; real IFA leaked',
    severity: Severity.ERROR,
    path: 'device.ifa',
    specRef: 'IAB\u00A0OTT\u00A0IFA\u00A0Guidelines\u00A0§2.3',
    applies: ({ root }) => root.device?.lmt === 1,
    validate: ({ root }) => {
      const ifa = root.device?.ifa;
      return (
        !ifa ||
        ifa === '00000000-0000-0000-0000-000000000000' ||
        ifa === '00000000-0000-0000-0000-0000000000000000'
      );
    },
  },
];

const bannerRules: Rule[] = [
  {
    id: 'banner-dimensions',
    description:
      'Each banner impression must define w/h or a non‑empty format array',
    severity: Severity.ERROR,
    path: 'imp[].banner',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.6',
    applies: (ctx) => ctx.inventoryTypes.has('banner'),
    validate: ({ root }) => {
      return (root.imp as any[]).every((imp) => {
        if (!imp.banner) return true;
        const b = imp.banner;
        if (b.w && b.h) return true;
        if (Array.isArray(b.format) && b.format.length > 0) {
          return b.format.every((f: any) => f.w && f.h);
        }
        return false;
      });
    },
  },
];

const videoRules: Rule[] = [
  {
    id: 'video-mimes',
    description: 'Video.mimes must be a non‑empty array of MIME strings',
    severity: Severity.ERROR,
    path: 'imp[].video.mimes',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.7',
    applies: (ctx) => ctx.inventoryTypes.has('video'),
    validate: ({ root }) =>
      (root.imp as any[]).every(
        (imp) =>
          !imp.video ||
          (Array.isArray(imp.video.mimes) && imp.video.mimes.length > 0),
      ),
  },
  {
    id: 'video-duration-mutual-exclusive',
    description:
      'Video rqddurs is mutually exclusive with minduration/maxduration',
    severity: Severity.ERROR,
    path: 'imp[].video',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.7',
    applies: (ctx) => ctx.inventoryTypes.has('video'),
    validate: ({ root }) =>
      (root.imp as any[]).every((imp) => {
        if (!imp.video) return true;
        const v = imp.video;
        const hasDur = v.minduration !== undefined || v.maxduration !== undefined;
        const hasRq = Array.isArray(v.rqddurs) && v.rqddurs.length > 0;
        return !(hasDur && hasRq);
      }),
  },
  {
    id: 'video-placements-deprecated',
    description:
      'video.placement is deprecated – use video.plcmt instead (OpenRTB 2.6)',
    severity: Severity.WARNING,
    path: 'imp[].video.placement',
    specRef: 'OpenRTB\u00A02.6\u00A0\u00A73.2.7',
    applies: (ctx) => ctx.inventoryTypes.has('video'),
    validate: ({ root }) =>
      (root.imp as any[]).every(
        (imp) => !imp.video || imp.video.placement === undefined,
      ),
  },
];

const nativeRules: Rule[] = [
  {
    id: 'native-request-json',
    description: 'imp.native.request must contain valid JSON',
    severity: Severity.ERROR,
    path: 'imp[].native.request',
    specRef: 'IAB\u00A0Native\u00A01.2\u00A0§4',
    applies: (ctx) => ctx.inventoryTypes.has('native'),
    validate: ({ root }) =>
      (root.imp as any[]).every((imp) => {
        if (!imp.native) return true;
        const rq = imp.native.request;
        if (!isNonEmptyString(rq)) return false;
        return safeJsonParse(rq).ok;
      }),
  },
];

const doohRules: Rule[] = [
  {
    id: 'dooh-qty-multiplier',
    description:
      'DOOH bid with imp.qty requires a positive qty.multiplier value',
    severity: Severity.ERROR,
    path: 'imp[].qty.multiplier',
    specRef: 'Smaato\u00A0OpenRTB\u00A02.6\u00A0§imp.qty',
    applies: (ctx) => ctx.inventoryTypes.has('dooh'),
    validate: ({ root }) =>
      (root.imp as any[]).every((imp) => {
        if (!imp.qty) return true;
        return typeof imp.qty.multiplier === 'number' && imp.qty.multiplier > 0;
      }),
  },
];

const partnerSharethroughRules: Rule[] = [
  {
    id: 'st-pkey',
    description: 'Sharethrough requests must include ext.sharethrough.pkey',
    severity: Severity.ERROR,
    path: 'imp[].ext.sharethrough.pkey',
    specRef: 'Sharethrough\u00A0Docs',
    applies: (ctx) => ctx.partnerProfile === 'sharethrough',
    validate: ({ root }) =>
      (root.imp as any[]).every((imp) =>
        isNonEmptyString(imp.ext?.sharethrough?.pkey),
      ),
