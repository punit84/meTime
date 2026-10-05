/**
 * Dynamic Expo config — maps local .env Spotify client id into app extra.
 * Client IDs are public by design. Never put a client secret in `extra`.
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore missing/unreadable .env
  }
}

loadEnvFile();

module.exports = ({ config }) => {
  const spotifyClientId =
    process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ||
    process.env.spotify_client_id ||
    '';

  return {
    ...config,
    scheme: config.scheme || 'metime',
    extra: {
      ...(config.extra || {}),
      spotifyClientId,
    },
  };
};
