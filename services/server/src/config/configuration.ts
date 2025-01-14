export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT) ?? 8080,
    version: process.env.APP_VERSION ?? '1.0',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'this-is-a-secret-key',
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES ?? '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'this-is-a-refresh-secret',
    refreshTokenExpires: process.env.JWT_REFRESH_TOKEN_EXPIRES ?? '7d',
    resetPasswordSecret:
      process.env.JWT_RESET_PASSWORD_SECRET ??
      'this-is-a-reset-password-secret',
  },
  cryptojs: {
    secret: process.env.CRYPTOJS_SECRET,
  },
  projectName: process.env.PROJECT_NAME ?? 'nestjs-prisma-postgresql',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL, 10),
  },
});
