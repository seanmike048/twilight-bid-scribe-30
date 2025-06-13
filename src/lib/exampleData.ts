
export const BID_REQUEST_EXAMPLES: Record<string, any> = {
  display: {
    "id": "80ce30c53c16e6ede735f123ef6e32361bfc7b22",
    "at": 1,
    "cur": ["USD"],
    "imp": [
      {
        "id": "1",
        "bidfloor": 0.03,
        "bidfloorcur": "USD",
        "banner": {
          "h": 250,
          "w": 300,
          "battr": [13, 14],
          "pos": 1
        },
        "secure": 1
      }
    ],
    "site": {
      "id": "102855",
      "cat": ["IAB3-1"],
      "domain": "www.foobar.com",
      "page": "http://www.foobar.com/1234.html",
      "publisher": {
        "id": "8953",
        "name": "foobar.com",
        "cat": ["IAB3-1"],
        "domain": "foobar.com"
      }
    },
    "device": {
      "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2",
      "geo": {
        "country": "USA"
      },
      "dnt": 0,
      "lmt": 0,
      "ip": "69.184.207.216",
      "devicetype": 2,
      "make": "Apple",
      "model": "iPhone",
      "os": "iOS"
    },
    "user": {
      "id": "55816b39711f9b5acf3b90e313ed29e51665623f",
      "buyeruid": "545678765467876567898765678987654"
    },
    "test": 0,
    "tmax": 120,
    "source": {
      "schain": {
        "complete": 1,
        "nodes": [
          {
            "asi": "directseller.com",
            "sid": "00001",
            "hp": 1
          }
        ]
      }
    }
  },

  video: {
    "id": "1234534625254",
    "at": 1,
    "tmax": 120,
    "cur": ["USD"],
    "imp": [
      {
        "id": "1",
        "bidfloor": 0.03,
        "bidfloorcur": "USD",
        "video": {
          "mimes": ["video/mp4", "application/javascript"],
          "minduration": 5,
          "maxduration": 30,
          "protocols": [2, 3, 5, 6],
          "w": 640,
          "h": 480,
          "startdelay": 0,
          "placement": 1,
          "linearity": 1,
          "skip": 1,
          "skipmin": 5,
          "skipafter": 5,
          "sequence": 1,
          "battr": [13, 14],
          "maxextended": 30,
          "minbitrate": 300,
          "maxbitrate": 1500,
          "boxingallowed": 1,
          "playbackmethod": [1, 3],
          "playbackend": 1,
          "delivery": [2],
          "pos": 7
        },
        "secure": 1
      }
    ],
    "app": {
      "id": "agltb3B1Yi1pbmNyDAsSA0FwcBiJkfIUDA",
      "bundle": "com.foo.mygame",
      "storeurl": "https://play.google.com/store/apps/details?id=com.foo.mygame",
      "cat": ["IAB9-30"],
      "ver": "1.0.2",
      "publisher": {
        "id": "agltb3B1Yi1pbmNyDAsSA0FwcBiJkfTUCV",
        "name": "foobar",
        "cat": ["IAB9-30"],
        "domain": "foobar.com"
      }
    },
    "device": {
      "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 6_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/7.0 Mobile/10A523 Safari/9537.53",
      "geo": {
        "lat": 35.012345,
        "lon": -115.12345,
        "country": "USA",
        "region": "CA",
        "metro": "803",
        "city": "Los Angeles",
        "zip": "90049"
      },
      "dnt": 0,
      "lmt": 0,
      "ip": "192.168.1.8",
      "devicetype": 1,
      "make": "Apple",
      "model": "iPhone",
      "os": "iOS",
      "osv": "6.1",
      "ifa": "AA000DFE74168477C70D291f574D344790E0BB11"
    },
    "user": {
      "id": "456789876567897654678987656789",
      "buyeruid": "545678765467876567898765678987654",
      "yob": 1987,
      "gender": "M"
    },
    "test": 0,
    "source": {
      "schain": {
        "complete": 1,
        "nodes": [
          {
            "asi": "directseller.com",
            "sid": "00001",
            "hp": 1
          }
        ]
      }
    }
  },

  native: {
    "id": "80ce30c53c16e6ede735f123ef6e32361bfc7b22",
    "at": 1,
    "cur": ["USD"],
    "imp": [
      {
        "id": "1",
        "bidfloor": 0.03,
        "bidfloorcur": "USD",
        "native": {
          "request": "{\"ver\":\"1.2\",\"layout\":1,\"adunit\":2,\"plcmtcnt\":1,\"seq\":0,\"assets\":[{\"id\":1,\"required\":1,\"title\":{\"len\":90}},{\"id\":2,\"required\":1,\"img\":{\"type\":3,\"w\":150,\"h\":50}},{\"id\":3,\"required\":0,\"data\":{\"type\":1,\"len\":15}},{\"id\":4,\"required\":0,\"data\":{\"type\":2,\"len\":20}}]}",
          "ver": "1.2",
          "api": [3, 5],
          "battr": [1, 3, 8, 11, 17]
        },
        "secure": 1
      }
    ],
    "app": {
      "id": "agltb3B1Yi1pbmNyDAsSA0FwcBiJkfIUDA",
      "bundle": "com.foo.mygame",
      "storeurl": "https://play.google.com/store/apps/details?id=com.foo.mygame",
      "cat": ["IAB9-30"],
      "ver": "1.0.2",
      "publisher": {
        "id": "agltb3B1Yi1pbmNyDAsSA0FwcBiJkfTUCV",
        "name": "foobar",
        "cat": ["IAB9-30"],
        "domain": "foobar.com"
      }
    },
    "device": {
      "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 6_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/7.0 Mobile/10A523 Safari/9537.53",
      "geo": {
        "country": "USA"
      },
      "dnt": 0,
      "lmt": 0,
      "ip": "192.168.1.8",
      "devicetype": 1,
      "make": "Apple",
      "model": "iPhone",
      "os": "iOS",
      "osv": "6.1",
      "ifa": "AA000DFE74168477C70D291f574D344790E0BB11"
    },
    "user": {
      "id": "456789876567897654678987656789",
      "buyeruid": "545678765467876567898765678987654"
    },
    "test": 0,
    "tmax": 120,
    "source": {
      "schain": {
        "complete": 1,
        "nodes": [
          {
            "asi": "directseller.com",
            "sid": "00001",
            "hp": 1
          }
        ]
      }
    }
  },

  ctv: {
    "id": "80ce30c53c16e6ede735f123ef6e32361bfc7b22",
    "at": 1,
    "cur": ["USD"],
    "imp": [
      {
        "id": "1",
        "bidfloor": 0.25,
        "bidfloorcur": "USD",
        "video": {
          "mimes": ["video/mp4"],
          "minduration": 15,
          "maxduration": 30,
          "protocols": [2, 3, 5, 6],
          "w": 1920,
          "h": 1080,
          "startdelay": 0,
          "placement": 1,
          "linearity": 1,
          "skip": 0,
          "pos": 7,
          "playbackmethod": [1],
          "delivery": [2],
          "podid": "pod123",
          "podseq": 1,
          "poddur": 90,
          "mincpmpersec": 0.10
        },
        "secure": 1
      }
    ],
    "app": {
      "id": "ctv-app-123",
      "bundle": "com.roku.channelname",
      "storeurl": "https://channelstore.roku.com/details/12345/channel-name",
      "cat": ["IAB1-1"],
      "ver": "2.1.0",
      "publisher": {
        "id": "pub-ctv-001",
        "name": "CTV Publisher",
        "domain": "ctvpublisher.com"
      }
    },
    "device": {
      "ua": "Roku/DVP-9.10 (9.1.0.4111)",
      "geo": {
        "country": "USA",
        "region": "CA",
        "metro": "803"
      },
      "dnt": 0,
      "lmt": 0,
      "ip": "192.168.1.100",
      "devicetype": 5,
      "make": "Roku",
      "model": "Ultra",
      "os": "RokuOS",
      "osv": "9.1.0",
      "ifa": "12345678-1234-1234-1234-123456789012"
    },
    "user": {
      "id": "ctv-user-456789876567897654678987656789"
    },
    "test": 0,
    "tmax": 120,
    "source": {
      "schain": {
        "complete": 1,
        "nodes": [
          {
            "asi": "ctv-exchange.com",
            "sid": "ctv001",
            "hp": 1
          }
        ]
      }
    }
  },

  audio: {
    "id": "audio-request-123456789",
    "at": 1,
    "cur": ["USD"],
    "imp": [
      {
        "id": "1",
        "bidfloor": 0.05,
        "bidfloorcur": "USD",
        "audio": {
          "mimes": ["audio/mp4", "audio/mpeg"],
          "minduration": 15,
          "maxduration": 30,
          "protocols": [2, 3, 6],
          "startdelay": 0,
          "sequence": 1,
          "battr": [13, 14],
          "maxextended": 30,
          "minbitrate": 32,
          "maxbitrate": 128,
          "delivery": [2],
          "companionad": {
            "id": "1",
            "w": 300,
            "h": 250,
            "pos": 1
          }
        },
        "secure": 1
      }
    ],
    "app": {
      "id": "audio-app-789",
      "bundle": "com.spotify.music",
      "storeurl": "https://play.google.com/store/apps/details?id=com.spotify.music",
      "cat": ["IAB1-6"],
      "ver": "8.6.42",
      "publisher": {
        "id": "audio-pub-001",
        "name": "Audio Publisher",
        "domain": "audiopublisher.com"
      }
    },
    "device": {
      "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
      "geo": {
        "country": "USA"
      },
      "dnt": 0,
      "lmt": 0,
      "ip": "192.168.1.50",
      "devicetype": 1,
      "make": "Apple",
      "model": "iPhone",
      "os": "iOS",
      "osv": "14.7.1",
      "ifa": "ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV"
    },
    "user": {
      "id": "audio-user-987654321",
      "buyeruid": "audio-buyer-123456789"
    },
    "test": 0,
    "tmax": 120,
    "source": {
      "schain": {
        "complete": 1,
        "nodes": [
          {
            "asi": "audio-exchange.com",
            "sid": "audio001",
            "hp": 1
          }
        ]
      }
    }
  },

  gdpr: {
    "id": "gdpr-request-80ce30c53c16e6ede735f123ef6e32361bfc7b22",
    "at": 1,
    "cur": ["EUR"],
    "imp": [
      {
        "id": "1",
        "bidfloor": 0.05,
        "bidfloorcur": "EUR",
        "banner": {
          "h": 250,
          "w": 300,
          "battr": [13, 14],
          "pos": 1
        },
        "secure": 1
      }
    ],
    "site": {
      "id": "eu-site-102855",
      "cat": ["IAB3-1"],
      "domain": "www.example.eu",
      "page": "https://www.example.eu/article/123",
      "publisher": {
        "id": "eu-pub-8953",
        "name": "example.eu",
        "cat": ["IAB3-1"],
        "domain": "example.eu"
      }
    },
    "device": {
      "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "geo": {
        "country": "DEU",
        "region": "BY",
        "city": "Munich"
      },
      "dnt": 0,
      "lmt": 0,
      "ip": "85.214.132.117",
      "devicetype": 2,
      "make": "Unknown",
      "model": "Unknown",
      "os": "Windows"
    },
    "user": {
      "id": "eu-user-55816b39711f9b5acf3b90e313ed29e51665623f",
      "ext": {
        "consent": "CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA"
      }
    },
    "regs": {
      "coppa": 0,
      "ext": {
        "gdpr": 1,
        "us_privacy": "1---"
      },
      "gpp": "DBABMA~CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA~1~~~",
      "gpp_sid": [2]
    },
    "test": 0,
    "tmax": 120,
    "source": {
      "schain": {
        "complete": 1,
        "nodes": [
          {
            "asi": "eu-exchange.com",
            "sid": "eu001",
            "hp": 1
          }
        ]
      }
    }
  },

  'error-privacy': {
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
    "site": { "page": "https://example.com" }
  },

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

// For backwards compatibility
export const exampleBidRequests = Object.keys(BID_REQUEST_EXAMPLES).reduce((acc, key) => {
  acc[key] = typeof BID_REQUEST_EXAMPLES[key] === 'string' 
    ? BID_REQUEST_EXAMPLES[key] 
    : JSON.stringify(BID_REQUEST_EXAMPLES[key], null, 2);
  return acc;
}, {} as Record<string, string>);

// Legacy export
export const exampleData = BID_REQUEST_EXAMPLES;
