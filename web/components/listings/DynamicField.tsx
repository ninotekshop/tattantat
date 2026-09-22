'use client';
import type { Field, ListingMedia } from '../../lib/listings';

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
  const id = `listing-field-${field.key}`;
  const config = field.config;
  const common = { id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : config.help ? `${id}-help` : undefined };
  const text = typeof value === 'string' || typeof value === 'number' ? String(value) : '';

  let control;
  if (field.type === 'boolean' || field.type === 'checkbox') {
    control = <label className="lf-check"><input {...common} type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)} />Có</label>;
  } else if (field.type === 'radio' || field.type === 'multi-select') {
    control = <div className="lf-options" role="group" aria-labelledby={`${id}-label`}>{field.options.map(option => <label key={option.value} className="lf-check"><input type={field.type === 'radio' ? 'radio' : 'checkbox'} name={id} value={option.value} checked={field.type === 'radio' ? value === option.value : Array.isArray(value) && value.includes(option.value)} onChange={event => onChange(field.type === 'radio' ? option.value : event.target.checked ? [...(Array.isArray(value) ? value : []), option.value] : (Array.isArray(value) ? value : []).filter(v => v !== option.value))} />{option.label}</label>)}</div>;
  } else if (['select', 'image', 'video'].includes(field.type)) {
    let rawOptions = field.type === 'select' ? field.options : media.filter(item => item.kind === (field.type === 'image' ? 'images' : 'videos')).map((item,index) => ({ value:item.id, label:`${field.type === 'image' ? 'Ảnh' : 'Video'} ${index + 1}` }));

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
          {field.type === 'select' && field.options.some((o: any) => !!o.parentOptionId) && !allValues['brand']
            ? '-- Vui lòng chọn Hãng trước --'
            : `Chọn ${field.label.toLowerCase()}`}
        </option>
        {rawOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  } else if (field.type === 'textarea') {
    control = <textarea {...common} rows={4} maxLength={config.maxLength ?? 2000} value={text} placeholder={config.placeholder} onChange={event => onChange(event.target.value)} />;
  } else {
    const numeric = ['number','year','range'].includes(field.type);
    control = (
      <div className="lf-input-unit">
        <input
          {...common}
          type={field.type === 'date' ? 'date' : numeric ? 'number' : 'text'}
          inputMode={field.type === 'currency' ? 'numeric' : undefined}
          min={config.min}
          max={config.max}
          step={field.type === 'year' ? 1 : 'any'}
          maxLength={field.type === 'currency' ? 13 : config.maxLength ?? 2000}
          value={text}
          placeholder={config.placeholder}
          onChange={event => onChange(numeric && event.target.value !== '' ? Number(event.target.value) : event.target.value)}
        />
        {config.unit && <span>{config.unit}</span>}
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
