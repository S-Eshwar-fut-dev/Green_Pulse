/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        FASTAPI_URL: process.env.FASTAPI_URL ?? "http://localhost:8000",
        FLEET_SUMMARY_PATH: process.env.FLEET_SUMMARY_PATH ?? "/tmp/greenPulse/fleet_summary.jsonl",
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            "leaflet": require.resolve("leaflet"),
        };
        return config;
    },
};

module.exports = nextConfig;
