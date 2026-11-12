import { locationSearchTerms } from './vn-merge';
describe('locationSearchTerms', () => {
  it('nhãn mới -> mọi tên cũ + mới', () => {
    expect(locationSearchTerms('Gia Lai mới')!.sort()).toEqual(['bình định', 'gia lai']);
    expect(locationSearchTerms('Bình Định (Gia Lai mới)')!.sort()).toEqual(['bình định', 'gia lai']);
  });
  it('tên thường giữ nguyên hành vi cũ', () => {
    expect(locationSearchTerms('Quy Nhơn')).toBeNull();
    expect(locationSearchTerms('Gia Lai')).toBeNull();
  });
});
