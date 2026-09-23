'use client';
import type { Field, ListingMedia } from '../../lib/listings';

const COMPASS_DIRECTIONS = [
  { value: 'Đông', label: 'Đông' },
  { value: 'Tây', label: 'Tây' },
  { value: 'Nam', label: 'Nam' },
  { value: 'Bắc', label: 'Bắc' },
  { value: 'Đông Nam', label: 'Đông Nam' },
  { value: 'Đông Bắc', label: 'Đông Bắc' },
  { value: 'Tây Nam', label: 'Tây Nam' },
  { value: 'Tây Bắc', label: 'Tây Bắc' },
];

const LEGAL_DOCUMENTS = [
  { value: 'Sổ đỏ / Sổ hồng chính chủ', label: 'Sổ đỏ / Sổ hồng chính chủ' },
  { value: 'Giấy tờ hợp lệ', label: 'Giấy tờ hợp lệ' },
  { value: 'Hợp đồng mua bán', label: 'Hợp đồng mua bán' },
  { value: 'Chưa có sổ', label: 'Chưa có sổ' },
  { value: 'Khác / Không có giấy tờ', label: 'Khác / Không có giấy tờ' },
];

export function DynamicField({
  field,
  value,
  onChange,
  error,
  media = [],
  allValues = {}
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  media?: ListingMedia[];
  allValues?: Record<string, unknown>;
}) {
  // Hide duplicate field "tinh_trang_nha" if general condition is present
  if (field.key === 'tinh_trang_nha' || field.key === 'house_condition') {
    return null;
  }

  const id = `listing-field-${field.key}`;
  const config = field.config || {};
  const common = { id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : config.help ? `${id}-help` : undefined };
  const text = typeof value === 'string' || typeof value === 'number' ? String(value) : '';

  let control;
  if (field.type === 'boolean' || field.type === 'checkbox') {
    control = <label className="lf-check"><input {...common} type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)} />Có</label>;
  } else if (field.type === 'radio' || field.type === 'multi-select') {
    control = <div className="lf-options" role="group" aria-labelledby={`${id}-label`}>{field.options.map(option => <label key={option.value} className="lf-check"><input type={field.type === 'radio' ? 'radio' : 'checkbox'} name={id} value={option.value} checked={field.type === 'radio' ? value === option.value : Array.isArray(value) && value.includes(option.value)} onChange={event => onChange(field.type === 'radio' ? option.value : event.target.checked ? [...(Array.isArray(value) ? value : []), option.value] : (Array.isArray(value) ? value : []).filter(v => v !== option.value))} />{option.label}</label>)}</div>;
  } else if (['select', 'image', 'video'].includes(field.type)) {
    let rawOptions = field.type === 'select' ? field.options : media.filter(item => item.kind === (field.type === 'image' ? 'images' : 'videos')).map((item,index) => ({ value:item.id, label:`${field.type === 'image' ? 'Ảnh' : 'Video'} ${index + 1}` }));

    // Standardize Hướng nhà options
    if (field.key === 'huong_nha' || field.key === 'huong' || field.label.toLowerCase().includes('hướng')) {
      rawOptions = COMPASS_DIRECTIONS;
    }

    // Standardize Pháp lý options
    if (field.key === 'phap_ly' || field.key === 'giay_to_phap_ly' || field.label.toLowerCase().includes('pháp lý')) {
      rawOptions = LEGAL_DOCUMENTS;
    }

    // Filter dependent options (e.g. Brand -> Model)
    if (field.type === 'select' && rawOptions.some((o: any) => !!o.parentOptionId)) {
      const parentVal = String(allValues['brand'] || allValues['parent'] || '').toLowerCase();
      if (parentVal) {
        rawOptions = rawOptions.filter((o: any) => !o.parentOptionId || o.parentOptionId.toLowerCase() === parentVal);
      } else {
        rawOptions = [];
      }
    }

    control = (
      <select {...common} value={text} onChange={event => onChange(event.target.value)}>
        <option value="">
          {field.type === 'select' && field.options?.some((o: any) => !!o.parentOptionId) && !allValues['brand']
            ? '-- Vui lòng chọn Hãng trước --'
            : `Chọn ${field.label.toLowerCase()}`}
        </option>
        {rawOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  } else if (field.type === 'textarea') {
    control = <textarea {...common} rows={4} maxLength={config.maxLength ?? 2000} value={text} placeholder={config.placeholder} onChange={event => onChange(event.target.value)} />;
  } else {
    const isDecimalOrNumber = ['number', 'year', 'range'].includes(field.type) || !!config.unit || field.label.toLowerCase().includes('diện tích') || field.label.toLowerCase().includes('mặt tiền') || field.label.toLowerCase().includes('đường vào');

    control = (
      <div className="lf-input-container">
        <div className="lf-input-unit">
          <input
            {...common}
            type={field.type === 'date' ? 'date' : 'text'}
            inputMode={isDecimalOrNumber ? 'decimal' : field.type === 'currency' ? 'numeric' : undefined}
            maxLength={field.type === 'currency' ? 13 : config.maxLength ?? 2000}
            value={text}
            placeholder={config.placeholder || (isDecimalOrNumber ? 'Ví dụ: 80.5' : '')}
            onChange={event => {
              let val = event.target.value;
              if (isDecimalOrNumber) {
                // Auto normalize commas to dots for decimal inputs
                val = val.replace(',', '.');
              }
              onChange(val);
            }}
          />
          {config.unit && <span>{config.unit}</span>}
        </div>
        {isDecimalOrNumber && (
          <small style={{ color: '#00a65a', fontSize: 11.5, display: 'block', marginTop: 4, fontWeight: 500 }}>
            💡 Ghi chú: Nhập số thập phân dùng dấu chấm "." (Ví dụ: 80.5 {config.unit || ''})
          </small>
        )}
      </div>
    );
  }
  return (
    <div className="lf-field">
      <label id={`${id}-label`} htmlFor={id}>
        {field.label}
        {field.required && <span className="lf-required"> *</span>}
      </label>
      {control}
      {config.help && <small id={`${id}-help`}>{config.help}</small>}
      {error && <small className="lf-error" id={`${id}-error`}>{error}</small>}
    </div>
  );
}
