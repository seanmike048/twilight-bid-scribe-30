/**
 * Bid-request analyser
 * --------------------
 * – Pure TS, no external deps.
 * – Synchronous, but heavy work is memo-ised so callers can
 *   safely call analyse(JSON.stringify(x)) N times without
 *   paying the parse/validate cost again.
 */

export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  id: string;
  severity: Severity;
  message: string;
  path?: string;
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
  /** Parsed OpenRTB object so callers don’t need to reparse */
  request: any;
}

/* ------------------------------------------------------------------ */
/*                         internal helpers                           */
/* ------------------------------------------------------------------ */

const parseCache = new Map<string, AnalysisResult>();

/** OpenRTB 2.5 devicetype enumeration → friendly label */
const DEVICE_TYPE: Record<number, AnalysisSummary['deviceType']> = {
  1: 'Mobile/Tablet',
  2: 'PC',
  3: 'Connected TV',
  4: 'Phone',
  5: 'Tablet',
  6: 'Connected Device',
  7: 'Set-top Box',
};

function safeJsonParse(txt: string): { ok: true; value: any } | { ok: false; error: Error } {
  try {
    return { ok: true, value: JSON.parse(txt) };
  } catch (err) {
    return { ok: false, error: err as Error };
  }
}

/** Recursively walk any structure until we find obj with id & imp[] */
function findBidRequest(node: any): any | undefined {
  if (!node || typeof node !== 'object') return undefined;
  if ('id' in node && Array.isArray(node.imp)) return node;
  for (const key of Object.keys(node)) {
    const found = findBidRequest(node[key]);
    if (found) return found;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*                        validation rule-set                         */
/* ------------------------------------------------------------------ */

type Rule = {
  id: string;
  severity: Severity;
  message: string;
  check: (root: any) => boolean;
  path?: string;
};

const rules: Rule[] = [
  {
    id: 'root-object',
    severity: 'error',
    message: 'No OpenRTB request object found in supplied JSON.',
    check: (root) => !!root,
  },
  {
    id: 'app-xor-site',
    severity: 'error',
    message: 'Request must contain exactly one of `app` or `site` (not both).',
    check: (root) => Boolean(root && ((root.app && !root.site) || (!root.app && root.site))),
    path: '',
  },
  {
    id: 'imp-count',
    severity: 'error',
    message: 'Bid request must contain at least one impression.',
    check: (root) => Array.isArray(root?.imp) && root.imp.length > 0,
    path: 'imp',
  },
  {
    id: 'imp-id',
    severity: 'error',
    message: 'Every impression must have an `id`.',
    check: (root) => root?.imp?.every((i: any) => typeof i.id === 'string' && i.id.length > 0),
    path: 'imp[].id',
  },
  {
    id: 'imp-media',
    severity: 'error',
    message:
      'Every impression must define at least one of banner, video, audio, or native objects.',
    check: (root) =>
      root?.imp?.every(
        (i: any) => i.banner || i.video || i.audio || i.native,
      ),
    path: 'imp[]',
  },
  {
    id: 'device-ua-or-ip',
    severity: 'warning',
    message: 'Device should have at least `ua` (user-agent) or `ip` filled.',
    check: (root) =>
      !!(
        root?.device &&
        (typeof root.device.ua === 'string' || typeof root.device.ip === 'string')
      ),
    path: 'device',
  },
];

/* ------------------------------------------------------------------ */
/*                             analyser                               */
/* ------------------------------------------------------------------ */

/**
 * Analyse an OpenRTB bid request (or wrapper containing it).
 * The same JSON string will never be parsed twice thanks to a
 * Content-hash cache keyed off the *exact* text supplied.
 */
export function analyse(jsonText: string): AnalysisResult {
  const cached = parseCache.get(jsonText);
  if (cached) return cached;

  const issues: Issue[] = [];

  /* 1️⃣  JSON parse -------------------------------------------------- */
  const parsed = safeJsonParse(jsonText);
  if (!parsed.ok) {
    const result: AnalysisResult = {
      summary: {
        requestType: 'Unknown',
        mediaFormats: [],
        impressions: 0,
        platform: 'Unknown',
        deviceType: 'Unknown',
        geo: 'N/A',
      },
      issues: [
        {
          id: 'json-parse',
          severity: 'error',
          message: `Invalid JSON – ${parsed.error.message}`,
        },
      ],
      request: undefined,
    };
    parseCache.set(jsonText, result);
    return result;
  }

  /* 2️⃣  Locate the OpenRTB request ---------------------------------- */
  const req = findBidRequest(parsed.value);
  if (!req) {
    issues.push({
      id: 'root-object',
      severity: 'error',
      message: 'No OpenRTB request object found.',
    });
  }

  /* 3️⃣  Rule evaluation -------------------------------------------- */
  for (const rule of rules) {
    if (!rule.check(req)) {
      issues.push({
        id: rule.id,
        severity: rule.severity,
        message: rule.message,
        path: rule.path,
      });
    }
  }

  /* 4️⃣  Derive summary --------------------------------------------- */
  let mediaFormats: string[] = [];
  let requestType: AnalysisSummary['requestType'] = 'Unknown';

  if (Array.isArray(req?.imp)) {
    const flags = {
      banner: false,
      video: false,
      audio: false,
      native: false,
    };
    for (const imp of req.imp) {
      if (imp.banner) flags.banner = true;
      if (imp.video) flags.video = true;
      if (imp.audio) flags.audio = true;
      if (imp.native) flags.native = true;
    }
    mediaFormats = Object.entries(flags)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    if (mediaFormats.length === 1) {
      requestType =
        (mediaFormats[0].charAt(0).toUpperCase() + mediaFormats[0].slice(1)) as AnalysisSummary['requestType'];
    } else if (mediaFormats.length > 1) {
      requestType = 'Mixed';
    }
  }

  const summary: AnalysisSummary = {
    requestType,
    mediaFormats,
    impressions: Array.isArray(req?.imp) ? req.imp.length : 0,
    platform: req?.app ? 'App' : req?.site ? 'Site' : 'Unknown',
    deviceType:
      DEVICE_TYPE[(req?.device?.devicetype as number) ?? -1] ?? 'Unknown',
    geo: req?.device?.geo?.country ?? 'N/A',
  };

  const result: AnalysisResult = { summary, issues, request: req };
  parseCache.set(jsonText, result);
  return result;
}
