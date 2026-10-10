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
  MdCenterFocusStrong,
  MdUndo,
  MdClear,
  MdChangeHistory,
  MdCropSquare,
  MdInfoOutline
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
  minPoints?: number;
  error?: string;
  helperText?: string;
}

const getShapeName = (count: number) => {
  if (count === 3) return 'مثلث (3 نقاط)';
  if (count === 4) return 'مربع / مضلع رباعي (4 نقاط)';
  if (count === 5) return 'مضلع خماسي (5 نقاط)';
  if (count === 6) return 'مضلع سداسي (6 نقاط)';
  if (count > 6) return `مضلع مغلق (${count} نقطة)`;
  return '';
};

const createCustomMarkerIcon = (index: number, isClosed: boolean) => {
  const bgColor = isClosed ? '#2563eb' : '#d97706';
  const shadowColor = isClosed ? 'rgba(37, 99, 235, 0.45)' : 'rgba(217, 119, 6, 0.45)';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: ${bgColor};
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px ${shadowColor};
        border: 2.5px solid #ffffff;
      ">
        <span style="
          transform: rotate(45deg);
          font-weight: 800;
          font-size: 11px;
          color: white;
        ">${index + 1}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  points,
  onChange,
  allowMultiple = true,
  minPoints = 3,
  error,
  helperText,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);

  // Keep refs for callbacks to avoid stale closures in Leaflet events
  const pointsRef = useRef(points);
  const onChangeRef = useRef(onChange);
  const allowMultipleRef = useRef(allowMultiple);

  useEffect(() => {
    pointsRef.current = points;
    onChangeRef.current = onChange;
    allowMultipleRef.current = allowMultiple;
  }, [points, onChange, allowMultiple]);

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

    // Handle Map Clicks: adds points sequentially to form a polygon
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = parseFloat(e.latlng.lat.toFixed(6));
      const newLng = parseFloat(e.latlng.lng.toFixed(6));
      const currentPoints = pointsRef.current;

      if (!allowMultipleRef.current) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Render Markers, Guide Lines, and Closed Polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove old polyline & polygon
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    const validPoints = points.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng));
    const isClosed = validPoints.length >= minPoints;

    // Create markers for each point
    validPoints.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createCustomMarkerIcon(index, isClosed),
        draggable: true,
      }).addTo(map);

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: sans-serif; font-size: 12px; min-width: 155px;">
          <b style="color: ${isClosed ? '#2563eb' : '#d97706'}; font-size: 13px;">
            📍 نقطة #${index + 1} ${isClosed ? '(ضمن الشكل المغلق)' : ''}
          </b><br/>
          <div style="margin: 4px 0; font-family: monospace; font-size: 11px;">
            lat: <b>${point.lat}</b><br/>
            lng: <b>${point.lng}</b>
          </div>
          <span style="color: #64748b; font-size: 11px;">(اسحب النقطة لتعديل موقع الزاوية)</span>
        </div>
      `);

      // Live dragging update for smooth polygon/polyline morphing
      marker.on('drag', () => {
        const liveCoords = markersRef.current.map(m => m.getLatLng());
        if (polygonRef.current) {
          polygonRef.current.setLatLngs(liveCoords);
        } else if (polylineRef.current) {
          polylineRef.current.setLatLngs(liveCoords);
        }
      });

      // Save changes on drag end
      marker.on('dragend', () => {
        const updatedPoints = markersRef.current.map(m => {
          const latLng = m.getLatLng();
          return {
            lat: parseFloat(latLng.lat.toFixed(6)),
            lng: parseFloat(latLng.lng.toFixed(6)),
          };
        });
        onChangeRef.current(updatedPoints);
      });

      markersRef.current.push(marker);
    });

    // Draw Shape:
    // If >= 3 points: draw CLOSED POLYGON (مثلث، مربع، أو مضلع مغلق)
    if (validPoints.length >= 3) {
      const poly = L.polygon(
        validPoints.map(p => [p.lat, p.lng]),
        {
          color: '#2563eb', // solid blue border
          weight: 2.5,
          fillColor: '#3b82f6', // soft blue fill
          fillOpacity: 0.22,
          smoothFactor: 1,
        }
      ).addTo(map);

      poly.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: sans-serif; font-size: 12px;">
          <b style="color: #2563eb; font-size: 13px;">✅ نطاق الفرع (شكل مغلق)</b><br/>
          <span>النوع: <b>${getShapeName(validPoints.length)}</b></span><br/>
          <span style="color: #64748b; font-size: 11px;">(شكل مغلق متصل بين جميع النقاط المحددة)</span>
        </div>
      `);

      polygonRef.current = poly;
    } else if (validPoints.length === 2) {
      // If 2 points: draw dashed guide line to show it needs a 3rd point to close
      polylineRef.current = L.polyline(
        validPoints.map(p => [p.lat, p.lng]),
        {
          color: '#d97706',
          weight: 2.5,
          dashArray: '6, 8',
          opacity: 0.85,
        }
      ).addTo(map);
    }
  }, [points, minPoints]);

  // Button: Add New Point near last point or map center
  const handleAddNewPoint = () => {
    const map = mapInstanceRef.current;

    if (points.length === 0) {
      const center = map ? map.getCenter() : { lat: defaultCenter[0], lng: defaultCenter[1] };
      onChange([{ lat: parseFloat(center.lat.toFixed(6)), lng: parseFloat(center.lng.toFixed(6)) }]);
      return;
    }

    const lastPoint = points[points.length - 1];
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

  // Button: Remove Last Point (Undo)
  const handleRemoveLastPoint = () => {
    if (points.length === 0) return;
    onChange(points.slice(0, -1));
  };

  // Button: Clear all points
  const handleClearAll = () => {
    if (points.length === 0) return;
    if (window.confirm('هل أنت متأكد من مسح جميع نقاط الخريطة والبدء من جديد؟')) {
      onChange([]);
    }
  };

  // Quick Preset Shapes: Triangle (3 points) or Square (4 points)
  const handleDrawDefaultShape = (type: 'triangle' | 'square') => {
    const map = mapInstanceRef.current;
    const center = map ? map.getCenter() : { lat: defaultCenter[0], lng: defaultCenter[1] };
    const cLat = center.lat;
    const cLng = center.lng;
    const d = 0.003; // ~300 meters

    if (type === 'triangle') {
      onChange([
        { lat: parseFloat((cLat + d).toFixed(6)), lng: parseFloat(cLng.toFixed(6)) },
        { lat: parseFloat((cLat - d * 0.7).toFixed(6)), lng: parseFloat((cLng + d).toFixed(6)) },
        { lat: parseFloat((cLat - d * 0.7).toFixed(6)), lng: parseFloat((cLng - d).toFixed(6)) },
      ]);
    } else if (type === 'square') {
      onChange([
        { lat: parseFloat((cLat + d * 0.7).toFixed(6)), lng: parseFloat((cLng - d * 0.7).toFixed(6)) },
        { lat: parseFloat((cLat + d * 0.7).toFixed(6)), lng: parseFloat((cLng + d * 0.7).toFixed(6)) },
        { lat: parseFloat((cLat - d * 0.7).toFixed(6)), lng: parseFloat((cLng + d * 0.7).toFixed(6)) },
        { lat: parseFloat((cLat - d * 0.7).toFixed(6)), lng: parseFloat((cLng - d * 0.7).toFixed(6)) },
      ]);
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

  // Remove a specific point
  const handleRemovePoint = (index: number) => {
    const updated = points.filter((_, i) => i !== index);
    onChange(updated);
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

    if (!allowMultiple || points.length === 0) {
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

        if (!allowMultiple || points.length === 0) {
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

  const isPolygonComplete = points.length >= minPoints;

  return (
    <div className="space-y-3">
      {/* Top Action Bar: Search, GPS, Add Point, Shape Presets */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 relative z-10">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-1.5 relative">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مدينة أو حي (مثال: الرياض، حي الملز)..."
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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
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
            <span>موقعي</span>
          </button>

          {/* Preset Triangle */}
          <button
            type="button"
            onClick={() => handleDrawDefaultShape('triangle')}
            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
            title="إنشاء شكل مثلث سريع (3 نقاط)"
          >
            <MdChangeHistory size={15} className="text-blue-500" />
            <span>شكل مثلث</span>
          </button>

          {/* Preset Square */}
          <button
            type="button"
            onClick={() => handleDrawDefaultShape('square')}
            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
            title="إنشاء شكل مربع سريع (4 نقاط)"
          >
            <MdCropSquare size={15} className="text-blue-500" />
            <span>شكل مربع</span>
          </button>

          {/* Add Point Button */}
          {allowMultiple && (
            <button
              type="button"
              onClick={handleAddNewPoint}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-xs"
              title="إضافة نقطة جديدة للنطاق"
            >
              <MdAdd size={16} />
              <span>إضافة نقطة</span>
            </button>
          )}

          {/* Undo Last Point */}
          {points.length > 0 && (
            <button
              type="button"
              onClick={handleRemoveLastPoint}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
              title="تراجع عن آخر نقطة"
            >
              <MdUndo size={15} />
              <span>تراجع</span>
            </button>
          )}

          {/* Clear All */}
          {points.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-xs font-semibold flex items-center gap-1 transition-colors border border-transparent hover:border-rose-200"
              title="مسح جميع النقاط"
            >
              <MdClear size={15} />
              <span>مسح</span>
            </button>
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
        <div className={`absolute top-3 right-3 backdrop-blur-md px-3.5 py-2 rounded-xl border text-xs shadow-md z-[500] flex items-center gap-2 max-w-[90%] pointer-events-none transition-all ${
          isPolygonComplete
            ? 'bg-emerald-600/90 border-emerald-500 text-white'
            : points.length === 2
            ? 'bg-blue-600/90 border-blue-500 text-white'
            : points.length === 1
            ? 'bg-amber-600/90 border-amber-500 text-white'
            : 'bg-slate-900/85 border-slate-700 text-slate-100'
        }`}>
          {isPolygonComplete ? (
            <MdCheckCircle size={16} className="shrink-0 text-white" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 animate-pulse" />
          )}
          <span className="font-bold leading-relaxed">
            {points.length === 0 && 'اضغط على الخريطة لتحديد 3 نقاط على الأقل لتكوين شكل مغلق (مثلث، مربع، أو مضلع)'}
            {points.length === 1 && 'تم تحديد النقطة 1 — اضغط على الخريطة لإضافة النقطة 2 (متبقي نقطتان على الأقل)'}
            {points.length === 2 && 'تم تحديد نقطتين — اضغط على الخريطة لإضافة النقطة 3 وسيتم إغلاق الشكل تلقائياً (مثلث)'}
            {isPolygonComplete && `تم تكوين شكل مغلق بنجاح: ${getShapeName(points.length)} — يمكنك سحب النقاط للتعديل أو النقر لإضافة زوايا`}
          </span>
        </div>

        {/* Points Counter Badge in map bottom-right */}
        <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-md z-[500] flex items-center gap-2 pointer-events-none">
          <span className={`w-2 h-2 rounded-full ${isPolygonComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            النقاط: <strong className={isPolygonComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{points.length}</strong> / {minPoints} على الأقل
          </span>
        </div>
      </div>

      {/* Helper text or Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold">
          <MdInfoOutline size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}

      {/* Selected Points Chips & Coordinates Display */}
      {points.length > 0 && points.some(p => p.lat && p.lng) ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
          {/* Status summary banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 ${
                isPolygonComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}>
                {isPolygonComplete ? (
                  <>
                    <MdCheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>شكل مغلق مكتمل ({getShapeName(points.length)})</span>
                  </>
                ) : (
                  <>
                    <MdInfoOutline size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>غير مكتمل — يلزم {minPoints - points.length} نقاط إضافية على الأقل</span>
                  </>
                )}
              </span>
            </div>

            <span className="text-slate-400 text-[11px]">
              اسحب أي نقطة على الخريطة لتعديل أبعاد النطاق بدقة
            </span>
          </div>

          {/* Cards for each vertex point */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {points.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-xs hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[11px] text-white ${
                    isPolygonComplete ? 'bg-blue-600' : 'bg-amber-600'
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
            <span>لم يتم تحديد أي نقاط بعد. اضغط على الخريطة لتحديد 3 نقاط على الأقل لتكوين شكل مغلق لموقع الفرع (مثلث، مربع، أو مضلع).</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDrawDefaultShape('triangle')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1 hover:opacity-90"
            >
              <MdChangeHistory size={14} />
              <span>مثلث جاهز</span>
            </button>
            <button
              type="button"
              onClick={() => handleDrawDefaultShape('square')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1 hover:opacity-90"
            >
              <MdCropSquare size={14} />
              <span>مربع جاهز</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
