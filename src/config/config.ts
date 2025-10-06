import { IConfig } from './config.interface';

export const config = (): IConfig => ({
  envFilePath: process.env.NODE_ENV === 'development' ? '.env.local' : '.env',
});
