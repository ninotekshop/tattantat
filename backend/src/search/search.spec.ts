import { BadRequestException } from '@nestjs/common';
import { sanitizeParams, SearchService } from './search.service';

describe('search', () => {
  it('sanitizes params and rejects bad ranges', () => {
    expect(sanitizeParams({ q: '  iphone 13 ', minPrice: '1000000', condition: 'NEW', location: 'Toàn quốc', verified: '1' })).toMatchObject({ q: 'iphone 13', minPrice: 1000000, condition: 'NEW', location: undefined, verified: true });
    expect(() => sanitizeParams({ minPrice: '5', maxPrice: '1' })).toThrow(BadRequestException);
    expect(() => sanitizeParams({ condition: 'BROKEN' })).toThrow(BadRequestException);
    expect(() => sanitizeParams({ categoryId: '1.5' })).toThrow(BadRequestException);
    expect(() => sanitizeParams({ minPrice: 'abc' })).toThrow(BadRequestException);
  });
  it('builds parameterised SQL and never inlines user text', () => {
    const s = new SearchService({} as any);
    const { sql, values } = s.buildWhere({ q: "iphone'; DROP TABLE x;--", minPrice: 10, location: 'Quy Nhơn', verified: true }, 'u1');
    expect(sql).not.toContain('DROP'); expect(sql).toContain('user_blocks');
    expect(values).toContain('%quy nhơn%'); expect(values[0]).toContain('iphone');
    expect(values.filter(v => v === 'u1').length).toBe(1);
  });
});

import { formatSpec } from './specs.service';
import { parseAttrs } from './search.service';
describe('vertical filters & specs', () => {
  it('parses attribute filters safely', () => {
    expect(parseAttrs('{"bedrooms":{"min":"2"},"legal":{"eq":"Sổ đỏ / Sổ hồng"}}')).toEqual({ bedrooms: { min: 2 }, legal: { eq: ['Sổ đỏ / Sổ hồng'] } });
    expect(() => parseAttrs('{"a;drop":{"min":1}}')).toThrow(); expect(() => parseAttrs('[1]')).toThrow(); expect(() => parseAttrs('{')).toThrow();
    expect(parseAttrs('')).toBeUndefined();
  });
  it('never inlines attribute keys/values in SQL', () => {
    const s = new SearchService({} as any);
    const { sql, values } = s.buildWhere({ categorySlug: 'bat-dong-san', attrs: { bedrooms: { min: 2 }, legal: { eq: ['x'] } } });
    expect(sql).toContain('listings l'); expect(sql).not.toContain('bedrooms'); expect(values).toEqual(expect.arrayContaining(['bat-dong-san', 'bedrooms', 2, 'legal', ['x']]));
  });
  it('formats values by field type', () => {
    expect(formatSpec({ key: 'a', label: 'A', type: 'number', config: { unit: 'm²' } }, 85)).toBe('85 m²');
    expect(formatSpec({ key: 'b', label: 'B', type: 'boolean' }, true)).toBe('Có');
    expect(formatSpec({ key: 'c', label: 'C', type: 'multi-select', options: [{ value: 'x', label: 'Ex' }] }, ['x', 'y'])).toBe('Ex, y');
    expect(formatSpec({ key: 'd', label: 'D', type: 'text' }, '')).toBeNull();
  });
});
