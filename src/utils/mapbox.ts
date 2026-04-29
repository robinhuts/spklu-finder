export const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY ?? '';

export function hasMapboxApiKey(): boolean {
  return MAPBOX_API_KEY.length > 0;
}
