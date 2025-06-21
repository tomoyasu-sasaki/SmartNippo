// Configuration files for SmartNippo
// Export shared configuration objects here

export const version = '0.1.0';

// App configuration
export const appConfig = {
  name: 'SmartNippo',
  version: '1.0.0',
  description: 'Expo × Convex Daily-Report App',
};

// Environment configuration
export const envConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Export configuration types
export interface AppConfig {
  name: string;
  version: string;
  description: string;
}

export interface EnvConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}
