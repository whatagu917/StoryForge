/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  serverRuntimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

module.exports = nextConfig 