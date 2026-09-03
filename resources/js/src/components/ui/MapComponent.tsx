import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const remoteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const qrIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  type: 'regular' | 'remote' | 'qr';
  details?: string;
}

interface MapComponentProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ markers, center = [7.8731, 80.7718], zoom = 7 }) => {
  if (markers.length > 0) {
      center = [markers[0].lat, markers[0].lng];
  }

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={[marker.lat, marker.lng]}
          icon={marker.type === 'remote' ? remoteIcon : marker.type === 'qr' ? qrIcon : defaultIcon}
        >
          <Popup>
            <div className="text-sm font-semibold">{marker.title}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">
              {marker.type === 'remote' ? 'Remote Check-In' : marker.type === 'qr' ? 'QR Check-In' : 'Regular Check-In'}
            </div>
            {marker.details && <div className="text-xs text-slate-600 mt-1">{marker.details}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
