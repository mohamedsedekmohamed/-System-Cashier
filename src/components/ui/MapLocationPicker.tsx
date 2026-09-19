import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MdMyLocation, 
  MdSearch, 
  MdLocationOn, 
  MdOpenInNew, 
  MdDeleteOutline, 
  MdCheckCircle,
  MdAdd,
  MdCenterFocusStrong
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export interface LocationPoint {
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  points: LocationPoint[];
  onChange: (points: LocationPoint[]) => void;
  allowMultiple?: boolean;
  error?: string;
}

const createCustomMarkerIcon = (index: number, isSingle: boolean) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: ${isSingle ? '#0284c7' : '#e11d48'};
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px ${isSingle ? 'rgba(2, 132, 199, 0.45)' : 'rgba(225, 29, 72, 0.45)'};
        border: 2.5px solid #ffffff;
      ">
        <span style="
          transform: rotate(45deg);
          font-weight: 800;
          font-size: 12px;
          color: white;
        ">${!isSingle ? index + 1 : '📍'}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  points,
  onChange,
  allowMultiple = true,
  error,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Keep refs for callbacks to avoid stale closures in Leaflet events
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mode, setMode] = useState<'single' | 'multiple'>(points.length > 1 ? 'multiple' : 'single');
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  // Default Center: first point or Riyadh
  const defaultCenter: [number, number] = points.length > 0 && points[0].lat && points[0].lng
    ? [points[0].lat, points[0].lng]
    : [24.713552, 46.675296];

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: points.length > 0 && points[0].lat ? 14 : 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Handle Map Clicks using refs (no stale closures!)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = parseFloat(e.latlng.lat.toFixed(6));
      const newLng = parseFloat(e.latlng.lng.toFixed(6));
      const currentPoints = pointsRef.current;
      const currentMode = modeRef.current;

      if (currentMode === 'single' || currentPoints.length === 0) {
        onChangeRef.current([{ lat: newLat, lng: newLng }]);
      } else {
        onChangeRef.current([...currentPoints, { lat: newLat, lng: newLng }]);
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Synchronize mode when points length changes
  useEffect(() => {
    if (points.length > 1 && mode !== 'multiple') {
      setMode('multiple');
    }
  }, [points.length]);

  // 3. Render Markers & Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove old polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const validPoints = points.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng));

    validPoints.forEach((point, index) => {
      const isSingle = validPoints.length === 1 && mode === 'single';
      const marker = L.marker([point.lat, point.lng], {
        icon: createCustomMarkerIcon(index, isSingle),
        draggable: true,
      }).addTo(map);

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: sans-serif; font-size: 12px; min-width: 150px;">
          <b style="color: ${isSingle ? '#0284c7' : '#e11d48'}; font-size: 13px;">
            ${isSingle ? '📍 موقع الفرع' : `📍 نقطة #${index + 1}`}
          </b><br/>
          <div style="margin: 4px 0; font-family: monospace; font-size: 11px;">
            lat: <b>${point.lat}</b><br/>
            lng: <b>${point.lng}</b>
          </div>
          <span style="color: #64748b; font-size: 11px;">(اسحب لتعديل المكان)</span>
        </div>
      `);

      // Drag listener
      marker.on('dragend', () => {
        const latLng = marker.getLatLng();
        const updatedLat = parseFloat(latLng.lat.toFixed(6));
        const updatedLng = parseFloat(latLng.lng.toFixed(6));
        const currentPoints = [...pointsRef.current];

        if (currentPoints.length === 1 && modeRef.current === 'single') {
          onChangeRef.current([{ lat: updatedLat, lng: updatedLng }]);
        } else {
          currentPoints[index] = { lat: updatedLat, lng: updatedLng };
          onChangeRef.current(currentPoints);
        }
      });

      markersRef.current.push(marker);
    });

    // Draw connecting line if multiple points
    if (validPoints.length > 1) {
      polylineRef.current = L.polyline(
        validPoints.map(p => [p.lat, p.lng]),
        {
          color: '#e11d48',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.7,
        }
      ).addTo(map);
    }
  }, [points, mode]);

  // Button: Add New Point
  const handleAddNewPoint = () => {
    const map = mapInstanceRef.current;
    setMode('multiple');

    if (points.length === 0) {
      const center = map ? map.getCenter() : { lat: defaultCenter[0], lng: defaultCenter[1] };
      onChange([{ lat: parseFloat(center.lat.toFixed(6)), lng: parseFloat(center.lng.toFixed(6)) }]);
      return;
    }

    const lastPoint = points[points.length - 1];
    // Slightly offset from the last point so it's clearly visible right next to it
    const offset = 0.003 * (points.length % 2 === 0 ? 1 : -1);
    const newPoint: LocationPoint = {
      lat: parseFloat((lastPoint.lat + offset).toFixed(6)),
      lng: parseFloat((lastPoint.lng + offset).toFixed(6)),
    };

    onChange([...points, newPoint]);

    if (map) {
      map.panTo([newPoint.lat, newPoint.lng]);
    }
  };

  // Focus a specific point on the map
  const handleFocusPoint = (index: number) => {
    const point = points[index];
    if (point && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([point.lat, point.lng], 16);
      if (markersRef.current[index]) {
        markersRef.current[index].openPopup();
      }
    }
  };

  // Remove a point
  const handleRemovePoint = (index: number) => {
    if (points.length <= 1) {
      onChange([]);
      setMode('single');
    } else {
      const updated = points.filter((_, i) => i !== index);
      onChange(updated);
      if (updated.length <= 1) {
        setMode('single');
      }
    }
  };

  // Search Location
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lon], 15);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(parseFloat(result.lat).toFixed(6));
    const lng = parseFloat(parseFloat(result.lon).toFixed(6));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16);
    }

    if (mode === 'single' || points.length === 0) {
      onChange([{ lat, lng }]);
    } else {
      onChange([...points, { lat, lng }]);
    }

    setSearchResults([]);
    setSearchQuery(result.display_name?.split(',')[0] || '');
  };

  // Get Current GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع الجغرافي.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16);
        }

        if (mode === 'single' || points.length === 0) {
          onChange([{ lat, lng }]);
        } else {
          onChange([...points, { lat, lng }]);
        }
      },
      (err) => {
        setIsLocating(false);
        alert(`تعذر جلب الموقع الحالي: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar: Search, GPS, Add Point Button, and Mode Switch */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 relative z-10">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-1.5 relative">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مدينة أو حي (مثال: الرياض، التحلية)..."
              className="w-full text-xs pr-8 pl-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
            <MdSearch className="absolute right-2.5 top-3 text-slate-400" size={16} />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3.5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0"
          >
            {isSearching ? <AiOutlineLoading3Quarters size={14} className="animate-spin" /> : 'بحث'}
          </button>
        </form>

        {/* Action Buttons: GPS + Add Point */}
        <div className="flex flex-wrap items-center gap-2">
          {/* GPS Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
            title="تحديد موقعي الحالي"
          >
            {isLocating ? (
              <AiOutlineLoading3Quarters size={14} className="animate-spin text-primary" />
            ) : (
              <MdMyLocation size={15} className="text-primary" />
            )}
            <span>موقعي الحالي</span>
          </button>

          {/* MAIN REQUESTED BUTTON: Add Multiple Points Button */}
          {allowMultiple && (
            <button
              type="button"
              onClick={handleAddNewPoint}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              title="إضافة نقطة إحداثيات جديدة على الخريطة"
            >
              <MdAdd size={16} />
              <span>إضافة نقطة أخرى</span>
              {points.length > 0 && (
                <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
                  {points.length}
                </span>
              )}
            </button>
          )}

          {/* Mode Selector */}
          {allowMultiple && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMode('single');
                  if (points.length > 1) {
                    onChange([points[0]]);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  mode === 'single'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
                }`}
              >
                نقطة واحدة
              </button>
              <button
                type="button"
                onClick={() => setMode('multiple')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  mode === 'multiple'
                    ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
                }`}
              >
                نقاط متعددة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden max-h-48 overflow-y-auto z-20">
          {searchResults.map((res, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSearchResult(res)}
              className="w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-start gap-2 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
            >
              <MdLocationOn className="text-primary mt-0.5 shrink-0" size={15} />
              <span className="truncate">{res.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        <div
          ref={mapContainerRef}
          className="w-full h-80 sm:h-96 z-0 bg-slate-100 dark:bg-slate-900"
          style={{ cursor: 'crosshair' }}
        />

        {/* Map Overlay Status Banner */}
        <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-md z-[500] flex items-center gap-2 pointer-events-none">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${mode === 'multiple' ? 'bg-rose-500' : 'bg-primary'} animate-pulse`} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {mode === 'single'
              ? 'اضغط في أي مكان على الخريطة لتحديد موقع الفرع'
              : 'وضع النقاط المتعددة: اضغط على الخريطة أو زر "إضافة نقطة أخرى" لإضافة نقاط'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      {/* Selected Points Chips & Coordinates Display */}
      {points.length > 0 && points.some(p => p.lat && p.lng) ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
              <MdCheckCircle className="text-emerald-500" size={17} />
              <span>النقاط المحددة على الخريطة ({points.length}):</span>
            </div>

            {allowMultiple && (
              <button
                type="button"
                onClick={handleAddNewPoint}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg"
              >
                <MdAdd size={15} />
                <span>+ إضافة نقطة أخرى</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {points.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-xs hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[11px] text-white ${
                    points.length === 1 ? 'bg-primary' : 'bg-rose-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <p><span className="text-slate-400">lat:</span> {p.lat}</p>
                    <p><span className="text-slate-400">lng:</span> {p.lng}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Focus on map */}
                  <button
                    type="button"
                    onClick={() => handleFocusPoint(idx)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="التركيز على النقطة في الخريطة"
                  >
                    <MdCenterFocusStrong size={16} />
                  </button>
                  {/* Google Maps link */}
                  <a
                    href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="فتح في خرائط Google"
                  >
                    <MdOpenInNew size={16} />
                  </a>
                  {/* Remove Point */}
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="حذف هذه النقطة"
                  >
                    <MdDeleteOutline size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MdLocationOn size={18} className="shrink-0 text-amber-500" />
            <span>لم يتم تحديد أي إحداثيات بعد. اضغط على الخريطة لتحديد الموقع أو اضغط "إضافة نقطة".</span>
          </div>
          <button
            type="button"
            onClick={handleAddNewPoint}
            className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs flex items-center gap-1 hover:opacity-90"
          >
            <MdAdd size={15} />
            <span>إضافة نقطة على الخريطة</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
