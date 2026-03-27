import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saaserp.victoria',
  appName: 'SaaSERP Victoria',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    Keyboard: {
      resize: 'body'
    }
  }
};

export default config;
