import 'dotenv/config';

export default {
  expo: {
    name: 'Nishin',
    slug: 'nishin-app',
    version: '1.0.0',
    android: {
          package: 'com.ninouillette.nishinapp'
          },
    extra: {
      API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      API_KEY: process.env.API_KEY
    }
  }
};
