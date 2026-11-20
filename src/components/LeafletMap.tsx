import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Order, Stall } from '../shared/types';
import { distanceKm, formatDistance } from '../lib/geo';

interface LeafletMapProps {
  centerLat: number;
  centerLng: number;
  stalls: Stall[];
  activeOrder?: Order | null;
  radiusKm?: number;
  selectedStallId?: string | null;
  onSelectStall?: (stall: Stall) => void;
  heightClass?: string;
}

export function LeafletMap({
  centerLat,
  centerLng,
  stalls,
  activeOrder,
  radiusKm = 5,
  selectedStallId,
  onSelectStall,
  heightClass = 'h-[480px]',
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([centerLat, centerLng], map.getZoom(), { animate: true });
  }, [centerLat, centerLng]);

  useEffect(() => {
    const group = layerGroupRef.current;
    const map = mapRef.current;
    if (!group || !map) return;

    group.clearLayers();

    // Radius circle around customer location
    L.circle([centerLat, centerLng], {
      radius: radiusKm * 1000,
      color: '#FF5200',
      weight: 1,
      opacity: 0.35,
      fillColor: '#FF5200',
      fillOpacity: 0.05,
      dashArray: '5 6',
    }).addTo(group);

    // Customer marker
    const userIcon = L.divIcon({
      className: 'movana-pin-wrapper',
      html: `<div style="width:20px;height:20px;border-radius:9999px;background:#0F172A;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([centerLat, centerLng], { icon: userIcon })
      .bindTooltip('Your location', { direction: 'top', offset: [0, -8] })
      .addTo(group);

    // Live stall markers
    stalls.forEach((stall) => {
      const dist = distanceKm(centerLat, centerLng, stall.lat, stall.lng);
      const isSelected = stall.id === selectedStallId;
      const borderColor = isSelected ? '#0F172A' : '#FF5200';
      const scale = isSelected ? 'scale(1.14)' : 'scale(1)';

      const icon = L.divIcon({
        className: 'movana-pin-wrapper',
        html: `
          <div style="transform:${scale};transition:transform 150ms ease;display:flex;flex-direction:column;align-items:center;">
            <div style="min-width:38px;height:38px;padding:0 8px;border-radius:12px;background:#ffffff;border:2.5px solid ${borderColor};box-shadow:0 6px 16px rgba(15,23,42,0.22);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">
              ${stall.emoji}
            </div>
            <div style="margin-top:3px;padding:1px 6px;border-radius:6px;background:rgba(15,23,42,0.88);color:#fff;font-size:10px;font-weight:600;white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis;">
              ${stall.name}
            </div>
          </div>
        `,
        iconSize: [120, 56],
        iconAnchor: [60, 22],
      });

      const marker = L.marker([stall.lat, stall.lng], { icon }).addTo(group);

      const popupEl = document.createElement('div');
      popupEl.innerHTML = `
        <div style="min-width:185px;">
          <div style="font-weight:700;font-size:13px;color:#1C1917;">${stall.emoji} ${stall.name}</div>
          <div style="font-size:11px;color:#57534E;margin-top:2px;">${stall.category} · ${formatDistance(dist)} · ★ ${stall.rating.toFixed(1)}</div>
          <div style="font-size:11px;color:#78716C;margin-top:4px;">${stall.menu.length} items from ₹${Math.min(...(stall.menu.map((m) => m.price).length ? stall.menu.map((m) => m.price) : [0]))}</div>
          <button type="button" data-open-stall="${stall.id}" style="margin-top:8px;width:100%;padding:6px 10px;border-radius:8px;background:#FF5200;color:#fff;font-weight:600;font-size:12px;border:none;cursor:pointer;">
            View menu &amp; order
          </button>
        </div>
      `;

      popupEl.querySelector('[data-open-stall]')?.addEventListener('click', () => {
        onSelectStall?.(stall);
      });

      marker.bindPopup(popupEl);
      marker.on('click', () => {
        marker.openPopup();
      });
    });

    // Active delivery route & rider marker
    if (activeOrder) {
      const routePoints: L.LatLngExpression[] = [[activeOrder.stallLat, activeOrder.stallLng]];
      if (typeof activeOrder.riderLat === 'number' && typeof activeOrder.riderLng === 'number') {
        routePoints.push([activeOrder.riderLat, activeOrder.riderLng]);

        const riderIcon = L.divIcon({
          className: 'movana-pin-wrapper',
          html: `<div style="width:34px;height:34px;border-radius:9999px;background:#16A34A;color:#fff;border:2.5px solid #fff;box-shadow:0 6px 16px rgba(22,163,74,0.38);display:flex;align-items:center;justify-content:center;font-size:16px;">🛵</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        L.marker([activeOrder.riderLat, activeOrder.riderLng], { icon: riderIcon })
          .bindTooltip(`${activeOrder.deliveryPartnerName || 'Rider'} · ${activeOrder.status.replace(/_/g, ' ')}`, {
            direction: 'top',
          })
          .addTo(group);
      }
      routePoints.push([activeOrder.customerLat, activeOrder.customerLng]);

      L.polyline(routePoints, {
        color: '#16A34A',
        weight: 3,
        dashArray: '6 6',
        opacity: 0.85,
      }).addTo(group);
    }
  }, [centerLat, centerLng, stalls, activeOrder, radiusKm, selectedStallId, onSelectStall]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm`}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="pointer-events-none absolute top-3 left-3 z-[400] rounded-lg bg-white/95 backdrop-blur-sm border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-700 shadow-sm">
        Live map · {stalls.length} {stalls.length === 1 ? 'stall' : 'stalls'} within {radiusKm} km
      </div>
    </div>
  );
}
