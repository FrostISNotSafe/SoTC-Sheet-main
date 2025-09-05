// Branding and localization profiles
// Add or modify entries; select via theme selector (same key)

export const brandProfiles = {
  default: {
    brand: 'LCORPNET',
    title1: 'LCORPNET DIRECT',
    title2: 'ACCESS TERMINAL',
    subtitle: 'PROJECT MOON NETWORK',
    placeholders: {
      username: 'Enter your username',
      password: 'Enter your password'
    },
    systemOverrides: {
      location: 'Nest L Corp Branch',
      device: 'LCORPNET Terminal'
    }
  },
  lcorpnet: {
    brand: 'LCORPNET',
    title1: 'LCORPNET DIRECT',
    title2: 'ACCESS TERMINAL',
    subtitle: 'PROJECT MOON NETWORK',
    placeholders: {
      username: 'Enter your username',
      password: 'Enter your password'
    },
    leftPanel: {
      status: 'ONLINE',
      security: 'SECURE',
      accessLevel: 'GUEST'
    },
    instructionsHtml: '• Use the forms to login or register<br>• Change theme colors using the selector above<br>• All data is encrypted and secure<br>• GM access requires manual promotion',
    systemOverrides: {
      location: 'Nest L Corp Branch',
      device: 'LCORPNET Terminal'
    }
  },
  wcorpnet: {
    brand: 'WCORPNET',
    title1: 'WCORP SECURE',
    title2: 'ACCESS NODE',
    subtitle: 'WING NETWORK PORTAL',
    placeholders: {
      username: 'Employee ID',
      password: 'Security Code'
    },
    leftPanel: {
      status: 'OPERATIONAL',
      security: 'HIGH',
      accessLevel: 'EMPLOYEE'
    },
    instructionsHtml: '• Access granted to WCORP employees only<br>• Use your Employee ID and Security Code<br>• Activity is monitored and logged',
    fieldLabels: {
      visitors: 'Active Sessions'
    },
    systemOverrides: {
      location: 'Nest W Corp Branch',
      device: 'WCORPNET Terminal'
    }
  },
  // Example custom brand (you can duplicate and edit this one)
  yourcorp: {
    brand: 'YOURCORP NET',
    title1: 'YOURCORP SECURE',
    title2: 'ACCESS GATEWAY',
    subtitle: 'INTERNAL SYSTEMS PORTAL',
    placeholders: {
      username: 'User ID',
      password: 'Access Key'
    }
  },
  tcorpnet: {
    brand: 'TCORPNET',
    title1: 'TCORP ACCESS',
    title2: 'TEMPORAL NODE',
    subtitle: 'TIME DISTORTION SYSTEM',
    placeholders: {
      username: 'Chrono ID',
      password: 'Temporal Key'
    },
    leftPanel: {
      status: 'STABLE',
      security: 'MAXIMUM',
      accessLevel: 'AUTHORIZED'
    },
    instructionsHtml: '• T Corp terminals manipulate time<br>• Only authorized chrono-engineers<br>• Activity may affect causality',
    systemOverrides: {
      location: 'Nest T Corp HQ',
      device: 'TCORPNET Temporal Node'
    }
  },
  rcorpnet: {
    brand: 'RCORPNET',
    title1: 'RCORP ACCESS',
    title2: 'COMBAT NODE',
    subtitle: 'R CORP BATTLE SYSTEM',
    placeholders: {
      username: 'Soldier ID',
      password: 'Unit Code'
    },
    leftPanel: {
      status: 'DEPLOYED',
      security: 'RESTRICTED',
      accessLevel: 'MILITARY'
    },
    instructionsHtml: '• R Corp use only<br>• Unauthorized access punishable<br>• Combat logs auto-synced',
    systemOverrides: {
      location: 'Nest R Corp HQ',
      device: 'RCORPNET Tactical Console'
    }
  },
  kcorpnet: {
    brand: 'KCORPNET',
    title1: 'KCORP ACCESS',
    title2: 'IMMORTALITY NODE',
    subtitle: 'K CORP LIFE EXTENSION',
    placeholders: {
      username: 'Subject ID',
      password: 'Revival Key'
    },
    leftPanel: {
      status: 'ACTIVE',
      security: 'CLASSIFIED',
      accessLevel: 'SUBJECT'
    },
    instructionsHtml: '• Access restricted to K Corp staff<br>• Cloning/immortality systems online',
    systemOverrides: {
      location: 'Nest K Corp HQ',
      device: 'KCORPNET Revival Terminal'
    }
  },
  zweinet: {
    brand: 'ZWEI OFFICE NET',
    title1: 'ZWEI OFFICE',
    title2: 'FIXER TERMINAL',
    subtitle: 'CITY FIXER NETWORK',
    placeholders: {
      username: 'Fixer ID',
      password: 'Contract Code'
    },
    leftPanel: {
      status: 'READY',
      security: 'TRUSTED',
      accessLevel: 'FIXER'
    },
    instructionsHtml: '• Registered Zwei fixers only<br>• Contract details confidential',
    systemOverrides: {
      location: 'Central Zwei Office',
      device: 'ZWEINET Fixer Console'
    }
  },
  hananet: {
    brand: 'HANA NET',
    title1: 'HANA ASSOCIATION',
    title2: 'FIXER MANAGEMENT',
    subtitle: 'CITY ASSOCIATION NETWORK',
    placeholders: {
      username: 'License ID',
      password: 'Validation Code'
    },
    leftPanel: {
      status: 'AUTHORIZED',
      security: 'STRICT',
      accessLevel: 'MANAGER'
    },
    instructionsHtml: '• Oversees Fixer licensing<br>• Unauthorized access prohibited',
    systemOverrides: {
      location: 'Hana HQ',
      device: 'HANA Association Terminal'
    }
  },
  indexnet: {
    brand: 'INDEX NET',
    title1: 'THE INDEX',
    title2: 'PROPHECY TERMINAL',
    subtitle: 'Syndicate Forecast System',
    placeholders: {
      username: 'Follower ID',
      password: 'Omen Key'
    },
    leftPanel: {
      status: 'ENIGMATIC',
      security: 'UNKNOWN',
      accessLevel: 'FOLLOWER'
    },
    instructionsHtml: '• Syndicate access only<br>• All actions follow prophecies',
    systemOverrides: {
      location: 'Index Den',
      device: 'Index Terminal'
    }
  },

};

export function getBrandProfile(key) {
  return brandProfiles[key] || brandProfiles.default;
}