import { BadRequestException, Logger, Body, Controller, Delete, Get, NotFoundException, OnModuleInit, Param, ParseUUIDPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';

const ok = <T>(data: T, message: string | null = null) => ({ success: true, data, message, errorCode: null });
const MAX_ADDRESSES = 10;
type R = { user: { id: string } };
type Body_ = { label?: string; province?: string; district?: string; ward?: string; address?: string; latitude?: number | null; longitude?: number | null; hideExact?: boolean; isDefault?: boolean };
const COLS = `id, label, province, district, ward, address, latitude, longitude, hide_exact AS "hideExact", is_default AS "isDefault"`;

function clean(b: Body_) {
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const province = s(b?.province, 100);
  if (!province) throw new BadRequestException('Hãy chọn Tỉnh / Thành phố.');
  const num = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
  return {
    label: s(b?.label, 40) || 'Địa chỉ', province, district: s(b?.district, 100), ward: s(b?.ward, 100), address: s(b?.address, 200),
    latitude: num(b?.latitude, -90, 90), longitude: num(b?.longitude, -180, 180), hideExact: b?.hideExact !== false, isDefault: b?.isDefault === true,
  };
}

/** Sổ địa chỉ của người dùng: nhiều địa chỉ giao dịch, chọn nhanh khi đăng tin. */
@Controller('me/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController implements OnModuleInit {
  private readonly log = new Logger('Addresses');
  private ready = false;
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    try { await this.ensure(); } catch (e) { this.log.error('Không tạo được bảng user_addresses: ' + (e instanceof Error ? e.message : String(e))); }
  }
  private async ensure() {
    if (this.ready) return;
    await this.db.query(`CREATE TABLE IF NOT EXISTS user_addresses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, label TEXT NOT NULL DEFAULT 'Địa chỉ',
      province TEXT NOT NULL, district TEXT NOT NULL DEFAULT '', ward TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
      latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, hide_exact BOOLEAN NOT NULL DEFAULT true,
      is_default BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id)`);
    this.ready = true;
    await this.db.query(`ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY`).catch(e => this.log.warn('Không bật RLS cho user_addresses: ' + (e instanceof Error ? e.message : String(e))));
  }
  private async list(uid: string) {
    await this.ensure();
    return (await this.db.query(`SELECT ${COLS} FROM user_addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at ASC`, [uid])).rows;
  }

  @Get() async get(@Req() r: R) { return ok(await this.list(r.user.id)); }

  @Post() async create(@Req() r: R, @Body() body: Body_) {
    const c = clean(body); const uid = r.user.id;
    await this.ensure();
    const n = (await this.db.query(`SELECT COUNT(*)::int AS n FROM user_addresses WHERE user_id=$1`, [uid])).rows[0].n as number;
    if (n >= MAX_ADDRESSES) throw new BadRequestException(`Bạn chỉ lưu được tối đa ${MAX_ADDRESSES} địa chỉ. Hãy xóa bớt.`);
    const makeDefault = c.isDefault || n === 0;
    if (makeDefault) await this.db.query(`UPDATE user_addresses SET is_default=false WHERE user_id=$1`, [uid]);
    await this.db.query(`INSERT INTO user_addresses(user_id,label,province,district,ward,address,latitude,longitude,hide_exact,is_default) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [uid, c.label, c.province, c.district, c.ward, c.address, c.latitude, c.longitude, c.hideExact, makeDefault]);
    return ok(await this.list(uid), 'Đã thêm địa chỉ.');
  }

  @Put(':id') async update(@Req() r: R, @Param('id', ParseUUIDPipe) id: string, @Body() body: Body_) {
    const c = clean(body); const uid = r.user.id;
    await this.ensure();
    if (c.isDefault) await this.db.query(`UPDATE user_addresses SET is_default=false WHERE user_id=$1`, [uid]);
    const res = await this.db.query(`UPDATE user_addresses SET label=$3,province=$4,district=$5,ward=$6,address=$7,latitude=$8,longitude=$9,hide_exact=$10,
      is_default=CASE WHEN $11 THEN true ELSE is_default END, updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING id`,
      [id, uid, c.label, c.province, c.district, c.ward, c.address, c.latitude, c.longitude, c.hideExact, c.isDefault]);
    if (!res.rows[0]) throw new NotFoundException('Không tìm thấy địa chỉ.');
    return ok(await this.list(uid), 'Đã cập nhật địa chỉ.');
  }

  @Patch(':id/default') async setDefault(@Req() r: R, @Param('id', ParseUUIDPipe) id: string) {
    const uid = r.user.id; await this.ensure();
    if (!(await this.db.query(`SELECT 1 FROM user_addresses WHERE id=$1 AND user_id=$2`, [id, uid])).rows[0]) throw new NotFoundException('Không tìm thấy địa chỉ.');
    await this.db.query(`UPDATE user_addresses SET is_default=(id=$1) WHERE user_id=$2`, [id, uid]);
    return ok(await this.list(uid), 'Đã đặt làm địa chỉ mặc định.');
  }

  @Delete(':id') async remove(@Req() r: R, @Param('id', ParseUUIDPipe) id: string) {
    const uid = r.user.id; await this.ensure();
    const del = await this.db.query(`DELETE FROM user_addresses WHERE id=$1 AND user_id=$2 RETURNING is_default`, [id, uid]);
    if (!del.rows[0]) throw new NotFoundException('Không tìm thấy địa chỉ.');
    if (del.rows[0].is_default) await this.db.query(`UPDATE user_addresses SET is_default=true WHERE id=(SELECT id FROM user_addresses WHERE user_id=$1 ORDER BY created_at ASC LIMIT 1)`, [uid]);
    return ok(await this.list(uid), 'Đã xóa địa chỉ.');
  }
}
