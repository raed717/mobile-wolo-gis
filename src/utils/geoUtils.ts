import { LatLng } from '../types/survey.types';

const METERS_PER_DEGREE_LAT = 111320;
const EARTH_RADIUS_M = 6371000;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Shift a coordinate by a small distance in meters (flat-earth approximation,
 * accurate to well under a centimeter for nudges of a few meters).
 */
export function offsetByMeters(pos: LatLng, northM: number, eastM: number): LatLng {
  const lat = pos.lat + northM / METERS_PER_DEGREE_LAT;
  const lng = pos.lng + eastM / (METERS_PER_DEGREE_LAT * Math.cos(toRad(pos.lat)));
  return { lat, lng };
}

/** Great-circle (haversine) distance between two points, in meters */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** 8-point compass direction from a to b */
export function bearingToCompass(a: LatLng, b: LatLng): string {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return COMPASS[Math.round(bearing / 45) % 8];
}

/** e.g. "2.5 m NE" — or null when the points are effectively identical (< 5 cm) */
export function formatOffset(from: LatLng, to: LatLng): string | null {
  const d = distanceMeters(from, to);
  if (d < 0.05) return null;
  const dist = d < 10 ? d.toFixed(1) : Math.round(d).toString();
  return `${dist} m ${bearingToCompass(from, to)}`;
}
