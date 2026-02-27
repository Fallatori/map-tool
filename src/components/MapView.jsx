import { simplify } from '@turf/turf';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import { getFeatureIsoA2 } from '../utils/dataAdapter';

const SOURCE_ID = 'countries-src';
const MATCHED_FILL_LAYER_ID = 'countries-fill-matched';
const EXCLUDED_FILL_LAYER_ID = 'countries-fill-excluded';
const BORDER_LAYER_ID = 'countries-border';
const COUNTRY_LABEL_LAYER_ID = 'countries-labels';
const DEBUG_LAYER_ID = 'countries-debug-labels';

function buildRenderGeoJSON(geojson, matchedIso, excludedIso) {
  const matched = new Set(Array.isArray(matchedIso) ? matchedIso : []);
  const excluded = new Set(Array.isArray(excludedIso) ? excludedIso : []);

  return {
    ...geojson,
    features: (geojson.features ?? []).map((feature) => {
      const iso = getFeatureIsoA2(feature);
      const isMatched = matched.has(iso);
      const isExcluded = excluded.has(iso);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          isMatched,
          isExcluded
        }
      };
    })
  };
}

function hasGeometry(feature) {
  return Boolean(feature?.geometry && typeof feature.geometry.type === 'string');
}

export default function MapView({ geojson, matchedIso, excludedIso }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const debugModeRef = useRef(new URLSearchParams(window.location.search).get('debug') === '1');

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [10, 20],
      zoom: 1.2,
      minZoom: 0.8,
      maxZoom: 7,
      attributionControl: true
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const handleLoad = () => {
      const baseLayers = map.getStyle()?.layers ?? [];
      for (const layer of baseLayers) {
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      }

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
      }

      if (!map.getLayer(MATCHED_FILL_LAYER_ID)) {
        map.addLayer({
          id: MATCHED_FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          filter: ['==', ['get', 'isMatched'], true],
          paint: {
            'fill-color': '#16a34a',
            'fill-opacity': 0.85
          }
        });
      }

      if (!map.getLayer(EXCLUDED_FILL_LAYER_ID)) {
        map.addLayer({
          id: EXCLUDED_FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          filter: ['==', ['get', 'isExcluded'], true],
          paint: {
            'fill-color': '#ef4444',
            'fill-opacity': 0.85
          }
        });
      }

      if (!map.getLayer(BORDER_LAYER_ID)) {
        map.addLayer({
          id: BORDER_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': '#4b5563',
            'line-width': 0.7,
            'line-opacity': 0.7
          }
        });
      }

      if (!map.getLayer(COUNTRY_LABEL_LAYER_ID)) {
        map.addLayer({
          id: COUNTRY_LABEL_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          layout: {
            'text-field': [
              'coalesce',
              ['get', 'name'],
              ['get', 'NAME_EN'],
              ['get', 'ADMIN'],
              ['get', 'NAME'],
              ['get', 'BRK_NAME'],
              ['get', 'ISO_A2'],
              ''
            ],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1,
              9,
              4,
              11,
              7,
              13
            ],
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'text-ignore-placement': false
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
            'text-halo-blur': 0.6
          }
        });
      }

      if (debugModeRef.current && !map.getLayer(DEBUG_LAYER_ID)) {
        map.addLayer({
          id: DEBUG_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          layout: {
            'text-field': [
              'concat',
              ['coalesce', ['get', 'ISO_A2'], '??'],
              '\nM:',
              ['to-string', ['boolean', ['get', 'isMatched'], false]],
              ' E:',
              ['to-string', ['boolean', ['get', 'isExcluded'], false]]
            ],
            'text-size': 11,
            'text-offset': [0, 0],
            'text-anchor': 'center',
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#111827',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1
          }
        });
      }
    };

    map.once('load', handleLoad);

    mapRef.current = map;

    return () => {
      map.off('load', handleLoad);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) {
      return;
    }

    const setData = () => {
      const source = map.getSource(SOURCE_ID);
      if (!source) {
        return;
      }

      const renderReady = buildRenderGeoJSON(geojson, matchedIso, excludedIso);
      const withGeometry = (renderReady.features ?? []).filter(hasGeometry);
      const withoutGeometry = (renderReady.features ?? []).filter((feature) => !hasGeometry(feature));
      const noSimplify = new URLSearchParams(window.location.search).get('nosimplify') === '1';

      const simplifiedOrRaw =
        noSimplify || withGeometry.length === 0
          ? { ...renderReady, features: withGeometry }
          : simplify(
              { ...renderReady, features: withGeometry },
              {
                tolerance: 0.005,
                highQuality: false,
                mutate: false
              }
            );

      source.setData({
        ...renderReady,
        features: [...(simplifiedOrRaw.features ?? []), ...withoutGeometry]
      });
    };

    if (map.getSource(SOURCE_ID)) {
      setData();
      return;
    }

    map.once('load', setData);
    return () => {
      map.off('load', setData);
    };
  }, [geojson, matchedIso, excludedIso]);

  return <div className="map-container" ref={mapContainerRef} aria-label="Country map" />;
}