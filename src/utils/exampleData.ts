
export const exampleBidRequests = {
  'valid-display': `{
  "id": "1234567890",
  "imp": [{
    "id": "1",
    "banner": {
      "w": 300,
      "h": 250,
      "pos": 1
    },
    "bidfloor": 0.25,
    "bidfloorcur": "USD"
  }],
  "device": {
    "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "ip": "192.168.1.1",
    "devicetype": 1,
    "make": "Apple",
    "model": "iPhone",
    "geo": {
      "country": "US",
      "lat": 40.7128,
      "lon": -74.0060
    }
  },
  "site": {
    "page": "https://example.com/news",
    "domain": "example.com"
  },
  "user": {
    "id": "user123"
  },
  "regs": {
    "gdpr": 1
  },
  "source": {
    "schain": {
      "complete": 1,
      "ver": "1.0",
      "nodes": [{
        "asi": "example.com",
        "sid": "12345",
        "hp": 1
      }]
    }
  }
}`,

  'valid-native': `{
  "id": "native-request-001",
  "imp": [{
    "id": "1",
    "native": {
      "request": "{\\"assets\\":[{\\"id\\":1,\\"required\\":1,\\"title\\":{\\"len\\":90}},{\\"id\\":2,\\"required\\":1,\\"img\\":{\\"type\\":3,\\"w\\":300,\\"h\\":250}}],\\"eventtrackers\\":[{\\"event\\":1,\\"methods\\":[1,2]}]}"
    },
    "bidfloor": 0.50
  }],
  "device": {
    "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
    "ip": "10.0.0.1",
    "devicetype": 4,
    "ifa": "12345678-1234-1234-1234-123456789012"
  },
  "app": {
    "bundle": "com.example.newsapp",
    "storeurl": "https://apps.apple.com/app/id123456789"
  }
}`,

  'valid-ctv': `{
  "id": "ctv-request-001",
  "imp": [{
    "id": "1",
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
    "bidfloor": 2.50
  }],
  "device": {
    "devicetype": 3,
    "make": "Roku",
    "model": "Ultra",
    "ifa": "12345678-1234-1234-1234-123456789012",
    "ip": "192.168.1.100"
  },
  "app": {
    "bundle": "com.roku.channel"
  }
}`,

  'valid-video': `{
  "id": "video-request-001",
  "imp": [{
    "id": "1",
    "video": {
      "mimes": ["video/mp4", "video/webm"],
      "minduration": 5,
      "maxduration": 60,
      "protocols": [1, 2, 3, 4],
      "w": 640,
      "h": 480,
      "linearity": 1,
      "startdelay": -1
    }
  }],
  "device": {
    "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "ip": "203.0.113.1"
  },
  "site": {
    "page": "https://video.example.com/watch"
  }
}`,

  'malformed-json': `{
  "id": "broken-request",
  "imp": [{
    "id": "1",
    "banner": {
      "w": 300,
      "h": 250,
    }
  }],
  "device": {
    "ua": "Mozilla/5.0...",
    "ip": 
  }
}`,

  'missing-required': `{
  "imp": [{
    "id": "1",
    "banner": {
      "w": 300,
      "h": 250
    }
  }],
  "device": {
    "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  }
}`,

  'privacy-issues': `{
  "id": "privacy-test-001",
  "imp": [{
    "id": "1",
    "banner": {
      "w": 728,
      "h": 90
    }
  }],
  "device": {
    "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
    "ip": "192.168.1.1",
    "ifa": "12345678-1234-1234-1234-123456789012",
    "lmt": 1
  },
  "site": {
    "page": "https://example.com"
  },
  "regs": {
    "gdpr": 1
  }
}`
};
