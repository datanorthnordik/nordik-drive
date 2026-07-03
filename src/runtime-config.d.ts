interface AppRuntimeConfig {
  API_ORIGIN?: string;
}

interface Window {
  __APP_CONFIG__?: AppRuntimeConfig;
}
