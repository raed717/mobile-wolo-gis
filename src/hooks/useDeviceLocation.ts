import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { UserLocation } from '../types/survey.types';

export function useDeviceLocation(autoTrack = false) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      if (!granted) {
        setError('Location permission denied. Please enable GPS in device settings.');
      }
      return granted;
    } catch (e: any) {
      console.error('Error requesting location permission:', e);
      setError('Could not request location permission.');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    setIsLocating(true);
    setError(null);
    try {
      let granted = hasPermission;
      if (granted === null || !granted) {
        granted = await requestPermission();
      }

      if (!granted) {
        setIsLocating(false);
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const userLoc: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setLocation(userLoc);
      setIsLocating(false);
      return userLoc;
    } catch (e: any) {
      console.error('Error getting current location:', e);
      setError('Failed to retrieve precise GPS location.');
      setIsLocating(false);
      return null;
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (autoTrack) {
      let isMounted = true;
      (async () => {
        const granted = await requestPermission();
        if (granted && isMounted) {
          try {
            watcherRef.current = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 4000,
                distanceInterval: 5,
              },
              (newPos) => {
                if (isMounted) {
                  setLocation({
                    latitude: newPos.coords.latitude,
                    longitude: newPos.coords.longitude,
                    altitude: newPos.coords.altitude,
                    accuracy: newPos.coords.accuracy,
                    heading: newPos.coords.heading,
                    speed: newPos.coords.speed,
                    timestamp: newPos.timestamp,
                  });
                }
              }
            );
          } catch (watchErr) {
            console.warn('Could not start location watcher:', watchErr);
          }
        }
      })();

      return () => {
        isMounted = false;
        if (watcherRef.current) {
          watcherRef.current.remove();
          watcherRef.current = null;
        }
      };
    }
  }, [autoTrack, requestPermission]);

  return {
    location,
    hasPermission,
    isLocating,
    error,
    requestPermission,
    getCurrentLocation,
  };
}
