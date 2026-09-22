'use client';

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, ChevronRight, ArrowLeft, X, Check } from 'lucide-react';
import {
  LocationNode,
  LocationSelection,
  POPULAR_LOCATIONS,
  ALL_PROVINCES,
  searchLocations,
  removeAccents
} from '../lib/locations';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: LocationSelection) => void;
  currentSelection?: LocationSelection | null;
}

export function LocationSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentSelection
}: LocationSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeParentNode, setActiveParentNode] = useState<LocationNode | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(currentSelection?.radiusKm || 10);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const filteredProvinces = useMemo(() => {
    return searchLocations(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectNationwide = () => {
    onSelect({
      mode: 'nationwide',
      locationId: null,
      label: 'Toàn quốc'
    });
    onClose();
  };

  const handleSelectNearby = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ định vị GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onSelect({
          mode: 'nearby',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          radiusKm: selectedRadius,
          label: `Quanh tôi (${selectedRadius}km)`
        });
        onClose();
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Chưa cấp quyền vị trí. Bạn có thể chọn khu vực bên dưới.');
      },
      { timeout: 8000 }
    );
  };

  const handleSelectNode = (node: LocationNode) => {
    onSelect({
      mode: 'administrative',
      locationId: node.id,
      provinceName: node.type === 'province' || node.type === 'city' ? node.name : activeParentNode?.name,
      districtName: node.type === 'district' ? node.name : undefined,
      label: node.name
    });
    onClose();
  };

  return (
    <div className="location-modal-overlay" onClick={onClose}>
      <div className="location-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="location-modal-header">
          {activeParentNode ? (
            <button className="location-back-btn" onClick={() => setActiveParentNode(null)}>
              <ArrowLeft size={18} /> <span>{activeParentNode.name}</span>
            </button>
          ) : (
            <div className="location-modal-title">
              <MapPin color="#00a65a" size={20} /> Chọn Tỉnh / Thành phố
            </div>
          )}
          <button className="location-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="location-search-box">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="🔎 Tìm tỉnh, thành phố, quận/huyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="clear-search-btn">
              <X size={14} />
            </button>
          )}
        </div>

        {gpsError && (
          <div className="location-gps-error">
            ⚠️ {gpsError}
          </div>
        )}

        {/* BODY scrollable */}
        <div className="location-modal-body">
          {!activeParentNode && !searchQuery && (
            <>
              {/* PHẠM VI TÌM KIẾM CƠ BẢN */}
              <div className="location-options-group">
                <button
                  className={`location-opt-item ${currentSelection?.mode === 'nationwide' ? 'active' : ''}`}
                  onClick={handleSelectNationwide}
                >
                  <div className="opt-left">
                    <span className="opt-icon">🌐</span>
                    <div>
                      <strong>Toàn quốc</strong>
                      <small>Tìm kiếm trên tất cả tỉnh thành Việt Nam</small>
                    </div>
                  </div>
                  {currentSelection?.mode === 'nationwide' && <Check size={18} color="#00a65a" />}
                </button>

                <div className={`location-opt-item nearby-box ${currentSelection?.mode === 'nearby' ? 'active' : ''}`}>
                  <div className="opt-left" onClick={handleSelectNearby} style={{ flex: 1, cursor: 'pointer' }}>
                    <span className="opt-icon"><Navigation size={18} color="#00a65a" /></span>
                    <div>
                      <strong>Quanh tôi (GPS)</strong>
                      <small>{gpsLoading ? 'Đang định vị vị trí...' : 'Tìm bài đăng xung quanh bán kính'}</small>
                    </div>
                  </div>

                  <div className="radius-selector">
                    <span className="radius-label">Bán kính:</span>
                    <select
                      value={selectedRadius}
                      onChange={(e) => {
                        const r = Number(e.target.value);
                        setSelectedRadius(r);
                        if (currentSelection?.mode === 'nearby') {
                          onSelect({
                            ...currentSelection,
                            radiusKm: r,
                            label: `Quanh tôi (${r}km)`
                          });
                        }
                      }}
                    >
                      <option value={1}>1 km</option>
                      <option value={3}>3 km</option>
                      <option value={5}>5 km</option>
                      <option value={10}>10 km</option>
                      <option value={20}>20 km</option>
                      <option value={50}>50 km</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* KHU VỰC PHỔ BIẾN */}
              <div className="popular-section">
                <div className="section-label">KHU VỰC PHỔ BIẾN</div>
                <div className="popular-grid">
                  {POPULAR_LOCATIONS.map((pop) => (
                    <button
                      key={pop.id}
                      className={`popular-chip ${currentSelection?.locationId === pop.id ? 'active' : ''}`}
                      onClick={() => handleSelectNode(pop)}
                    >
                      📍 {pop.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CHI TIẾT THEO DANH MỤC KHU VỰC */}
          {activeParentNode ? (
            <div className="location-list">
              <button
                className="location-row-btn all-province-btn"
                onClick={() => handleSelectNode(activeParentNode)}
              >
                <div className="row-title">
                  <Check size={18} color="#00a65a" /> Toàn {activeParentNode.name}
                </div>
              </button>

              <div className="section-label" style={{ marginTop: 12 }}>
                DANH SÁCH QUẬN / HUYỆN TRỰC THUỘC
              </div>

              {activeParentNode.children?.map((child) => (
                <button
                  key={child.id}
                  className={`location-row-btn ${currentSelection?.locationId === child.id ? 'active' : ''}`}
                  onClick={() => handleSelectNode(child)}
                >
                  <span className="row-title">{child.name}</span>
                  {currentSelection?.locationId === child.id && <Check size={18} color="#00a65a" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="location-list">
              <div className="section-label">
                {searchQuery ? `KẾT QUẢ TÌM KIẾM (${filteredProvinces.length})` : 'TẤT CẢ TỈNH / THÀNH PHỐ'}
              </div>

              {filteredProvinces.map((prov) => (
                <button
                  key={prov.id}
                  className={`location-row-btn ${currentSelection?.locationId === prov.id ? 'active' : ''}`}
                  onClick={() => {
                    if (prov.children && prov.children.length > 0) {
                      setActiveParentNode(prov);
                    } else {
                      handleSelectNode(prov);
                    }
                  }}
                >
                  <span className="row-title">📍 {prov.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {prov.children && prov.children.length > 0 && (
                      <span className="child-badge">{prov.children.length} quận/huyện</span>
                    )}
                    <ChevronRight size={18} color="#94a3b8" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
