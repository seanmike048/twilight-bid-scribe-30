
// FILE: src/lib/exampleData.ts

export const exampleData: Record<string, object> = {
    'valid-ctv': {
      "id": "ctv-request-001",
      "at": 2,
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
        "ua": "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.84 TV Safari/537.36",
        "devicetype": 3,
        "make": "Samsung",
        "model": "Q90R Series",
        "os": "Tizen",
        "osv": "5.0",
        "geo": { "country": "USA" }
      },
      "regs": { "coppa": 0 }
    },
    'multi-impression': {
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
        "name": "News Today",
        "domain": "newstoday.com",
        "page": "https://newstoday.com/article/123",
        "publisher": { "id": "pub456", "name": "News Today Corp" }
      },
      "device": {
        "ip": "198.51.100.1",
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        "devicetype": 2,
        "geo": { "country": "CAN" }
      }
    },
    'error-missing-id': {
        "imp": [{"id":"1","banner":{"w":300,"h":250}}]
    }
};
