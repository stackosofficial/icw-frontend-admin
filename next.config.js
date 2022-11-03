/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config');


const nextConfig = {
  publicRuntimeConfig: {
    NEXT_PUBLIC_BE_URL: process.env.NEXT_PUBLIC_BE_URL,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    TEST: 'testVar',
  },
  reactStrictMode: true,
  i18n,
  output: 'standalone'
};

module.exports = nextConfig;
