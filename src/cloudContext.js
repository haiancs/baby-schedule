import cloudbase from '@cloudbase/js-sdk';
import { createContext } from 'react';

export const cloud = cloudbase.init({
  env: 'cloud1-9gaf7sks5b9ec073',
  region: 'ap-shanghai'
});

export const auth = cloud.auth();

export const CloudContext = createContext(cloud);
