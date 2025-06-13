
export const exampleBidRequests: Record<string, string> = {
  'valid-ctv': `{
  "id": "ctv-request-001",
  "at": 2,
  "imp": [{
    "id": "imp-1",
    "video": {
      "mimes": ["video/mp4"],
      "minduration": 15,
      "maxduration": 30,
      "protocols": [2, 3],
      "w": 1920,
      "h": 1080,
      "startdelay": 0,
      "plcmt": 1,
      "linearity": 1,
      "pos": 7
    },
    "bidfloor": 2.50,
    "bidfloorcur": "USD"
  }],
  "app": {
    "id": "app123",
    "name": "SuperStream TV",
    "bundle": "com.superstream.tv",
    "publisher": { "id": "pub123", "name": "SuperStream Media" }
  },
  "device": {
    "ip": "203.0.113.1",
    "ua": "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0)",
    "devicetype": 3,
    "make": "Samsung",
    "model": "Q90R Series",
    "os": "Tizen",
    "osv": "5.0",
    "geo": { "country": "USA" }
  },
  "regs": { "coppa": 0 }
}`,
  'valid-multi-impression': `{
  "id": "multi-imp-request-002",
  "at": 1,
  "imp": [
    {
      "id": "imp-1-banner",
      "banner": { "w": 300, "h": 250 },
      "bidfloor": 0.50
    },
    {
      "id": "imp-2-video",
      "video": {
        "mimes": ["video/mp4"],
        "minduration": 5,
        "maxduration": 15,
        "w": 640,
        "h": 480,
        "linearity": 1
      },
      "bidfloor": 1.25
    }
  ],
  "site": {
    "id": "site456",
    "page": "https://newstoday.com/article/123",
    "publisher": { "id": "pub456" }
  },
  "device": {
    "ip": "198.51.100.1",
    "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "devicetype": 2,
    "geo": { "country": "CAN" }
  }
}`,
  'error-privacy': `{
  "id": "privacy-test-001",
  "at": 1,
  "imp": [{
    "id": "1",
    "banner": { "w": 728, "h": 90 }
  }],
  "device": {
    "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
    "ip": "192.168.1.1",
    "ifa": "12345678-1234-1234-1234-123456789012",
    "lmt": 1
  },
  "site": { "page": "https://example.com" },
  "regs": { "gdpr": 1 },
  "user": {}
}`,
  'malformed-json': `{
  "id": "broken-request",
  "imp": [{
    "id": "1",
    "banner": {
      "w": 300,
      "h": 250
    }
  }],
  "device": {
    "ua": "Mozilla/5.0...",
    "ip": 
  }
}`
};
