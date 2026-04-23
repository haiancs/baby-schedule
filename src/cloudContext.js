import cloudbase from '@cloudbase/js-sdk';
import { createContext } from 'react';

export const cloud = cloudbase.init({
  env: import.meta.env.VITE_CLOUDBASE_ENV_ID,
  region: import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
});

export const auth = cloud.auth();

export const CloudContext = createContext(cloud);
