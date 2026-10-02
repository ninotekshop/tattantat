import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type Reverse = { displayName: string; road: string; houseNumber: string; ward: string; district: string; province: string };
const cache = new Map<string, { at: number; value: Reverse }>();

/** Tra địa chỉ từ tọa độ (OpenStreetMap Nominatim). Đi qua backend để gắn User-Agent theo chính sách của Nominatim, làm tròn tọa độ, có cache và không lộ IP người dùng cho bên thứ ba. */
@Controller('geo')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class GeoController {
  @Get('reverse') @Throttle({ default: { limit: 20, ttl: 60000 } })
  async reverse(@Query('lat') latRaw: string, @Query('lng') lngRaw: string) {
    const lat = Number(latRaw), lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new BadRequestException('Tọa độ không hợp lệ');
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 6 * 3_600_000) return { success: true, data: hit.value, message: null, errorCode: null };
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=vi&lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}`;
      const res = await fetch(url, { headers: { 'User-Agent': process.env.GEO_USER_AGENT || 'TatTanTat/1.0 (marketplace)' }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(String(res.status));
      const j: any = await res.json();
      const a = j?.address ?? {};
      const value: Reverse = {
        displayName: String(j?.display_name ?? ''),
        road: a.road ?? a.pedestrian ?? a.residential ?? '',
        houseNumber: a.house_number ?? '',
        ward: a.quarter ?? a.suburb ?? a.village ?? a.neighbourhood ?? '',
        district: a.city_district ?? a.county ?? a.district ?? a.town ?? a.city ?? '',
        province: a.state ?? a.city ?? a.province ?? '',
      };
      if (cache.size > 500) cache.clear();
      cache.set(key, { at: Date.now(), value });
      return { success: true, data: value, message: null, errorCode: null };
    } catch {
      throw new BadRequestException('Chưa tra được địa chỉ từ tọa độ. Bạn có thể tự nhập địa chỉ.');
    }
  }
}

/** Tra khu vực (quận/huyện, tỉnh) từ tọa độ cho tìm kiếm "Quanh tôi" — công khai, không trả địa chỉ chi tiết. */
@Controller('geo')
@UseGuards(ThrottlerGuard)
export class GeoAreaController {
  @Get('area') @Throttle({ default: { limit: 30, ttl: 60000 } })
  async area(@Query('lat') latRaw: string, @Query('lng') lngRaw: string) {
    const lat = Number(latRaw), lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new BadRequestException('Tọa độ không hợp lệ');
    const key = `area:${lat.toFixed(2)},${lng.toFixed(2)}`;
    const hit = areaCache.get(key);
    if (hit && Date.now() - hit.at < 6 * 3_600_000) return { success: true, data: hit.value, message: null, errorCode: null };
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=12&accept-language=vi&lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
      const res = await fetch(url, { headers: { 'User-Agent': process.env.GEO_USER_AGENT || 'TatTanTat/1.0 (marketplace)' }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(String(res.status));
      const a: any = ((await res.json()) as any)?.address ?? {};
      const value = { district: String(a.city_district ?? a.county ?? a.district ?? a.town ?? a.city ?? ''), province: String(a.state ?? a.city ?? a.province ?? '') };
      if (areaCache.size > 500) areaCache.clear();
      areaCache.set(key, { at: Date.now(), value });
      return { success: true, data: value, message: null, errorCode: null };
    } catch {
      throw new BadRequestException('Chưa xác định được khu vực từ vị trí của bạn.');
    }
  }
}
const areaCache = new Map<string, { at: number; value: { district: string; province: string } }>();
