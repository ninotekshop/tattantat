export const fieldTypes = ['text','textarea','number','currency','select','multi-select','radio','checkbox','date','year','location','image','video','boolean','range'] as const;
export type FieldType = typeof fieldTypes[number];
export type Field = {
  key: string; label: string; type: FieldType; required: boolean; enabled: boolean;
  options: { value: string; label: string }[];
  config: { min?: number; max?: number; minLength?: number; maxLength?: number; unit?: string; placeholder?: string; help?: string;
    visibleWhen?: { field: string; operator: 'eq' | 'ne' | 'in'; value: unknown } };
};
export type Template = { id: string; categoryId: string; version: number; name: string; fields: Field[]; config: { priceModes: string[] } };
export type ListingData = {
  title?: string; description?: string; condition?: string; priceMode?: string; price?: string; negotiable?: boolean;
  location?: { province?: string; district?: string; ward?: string; address?: string; hideExact?: boolean; latitude?: number; longitude?: number };
  contact?: { name?: string; phone?: string; email?: string };
  values?: Record<string, unknown>; images?: string[]; videos?: string[];
};
export const priceModes = ['FIXED','CONTACT','FREE','HOUR','DAY','MONTH','M2'];
export const conditions = ['NEW','LIKE_NEW','USED_GOOD','USED_FAIR','FOR_PARTS'];
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const blank = (value: unknown) => value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
export const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function visible(field: Field, values: Record<string, unknown>, fields: Field[], seen = new Set<string>()): boolean {
  if (!field.enabled || seen.has(field.key)) return false;
  const rule = field.config.visibleWhen;
  if (!rule) return true;
  const dependency = fields.find(item => item.key === rule.field);
  if (!dependency) return false;
  seen.add(field.key);
  if (!visible(dependency, values, fields, seen)) return false;
  const value = values[rule.field];
  return rule.operator === 'eq' ? value === rule.value : rule.operator === 'ne' ? !blank(value) && value !== rule.value : Array.isArray(rule.value) && rule.value.includes(value);
}

/** Configuration is bounded, declarative and non-executable. No eval or user regexes. */
export function validateTemplate(input: unknown): string | null {
  if (!record(input) || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 150 || !Array.isArray(input.fields) || input.fields.length > 80) return 'Cấu hình biểu mẫu không hợp lệ.';
  if (!record(input.config) || !Array.isArray(input.config.priceModes) || !input.config.priceModes.length || input.config.priceModes.some(mode => !priceModes.includes(mode as string))) return 'Chế độ giá không hợp lệ.';
  const keys = new Set<string>();
  for (const raw of input.fields) {
    if (!record(raw) || typeof raw.key !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(raw.key) || keys.has(raw.key)) return 'Mã trường không hợp lệ hoặc bị trùng.';
    if (['constructor','prototype','__proto__'].includes(raw.key)) return 'Mã trường không được phép.';
    if (typeof raw.label !== 'string' || !raw.label.trim() || raw.label.length>150 || !fieldTypes.includes(raw.type as FieldType) || typeof raw.required!=='boolean' || typeof raw.enabled!=='boolean' || !record(raw.config) || !Array.isArray(raw.options) || raw.options.length>100) return 'Định nghĩa trường không hợp lệ.';
    const optionValues = new Set<string>();
    for (const option of raw.options) {
      if (!record(option) || typeof option.value!=='string' || !option.value || option.value.length>120 || typeof option.label!=='string' || !option.label.trim() || option.label.length>150 || optionValues.has(option.value)) return 'Tùy chọn không hợp lệ hoặc bị trùng.';
      optionValues.add(option.value);
    }
    if (['select','radio','multi-select'].includes(raw.type as string) && !raw.options.length) return 'Trường lựa chọn cần có tùy chọn.';
    for (const [key,value] of Object.entries(raw.config)) {
      if (['min','max','minLength','maxLength'].includes(key)) {
        if (typeof value!=='number' || !Number.isFinite(value) || Math.abs(value)>1e13 || (key.includes('Length') && (!Number.isInteger(value) || value<0 || value>10000))) return 'Giới hạn trường không hợp lệ.';
      } else if (['unit','placeholder','help'].includes(key)) {
        if (typeof value!=='string' || value.length>500) return 'Nội dung hướng dẫn quá dài.';
      } else if (key === 'visibleWhen') {
        if (!record(value) || typeof value.field!=='string' || !keys.has(value.field) || !['eq','ne','in'].includes(value.operator as string)) return 'Điều kiện chỉ được tham chiếu trường đứng trước.';
        if (value.operator==='in' ? !Array.isArray(value.value) || value.value.length>100 || value.value.some(v=>!['string','number','boolean'].includes(typeof v)) : !['string','number','boolean'].includes(typeof value.value)) return 'Giá trị điều kiện không hợp lệ.';
      } else return 'Thuộc tính kiểm tra trường không được hỗ trợ.';
    }
    if (typeof raw.config.min==='number' && typeof raw.config.max==='number' && raw.config.min>raw.config.max) return 'Giá trị tối thiểu lớn hơn tối đa.';
    keys.add(raw.key);
  }
  return null;
}

export function validateListing(data: unknown, template: Template, publish: boolean): Record<string,string> {
  const errors: Record<string,string> = {};
  if (!record(data)) return { form: 'Dữ liệu tin đăng không hợp lệ.' };
  const allowed = ['title','description','condition','priceMode','price','negotiable','location','contact','values','images','videos'];
  if (Object.keys(data).some(key=>!allowed.includes(key))) errors.form = 'Tin đăng chứa thuộc tính không được phép.';
  const text = (key: string, value: unknown, required: boolean, max: number, label: string) => {
    if (blank(value)) { if (publish && required) errors[key] = 'Vui lòng nhập ' + label + '.'; }
    else if (typeof value!=='string' || value.trim().length===0 || value.length>max) errors[key] = label + ' không hợp lệ hoặc quá dài.';
  };
  text('title',data.title,true,200,'tiêu đề tin đăng');
  text('description',data.description,true,10000,'mô tả');
  if ((publish || !blank(data.condition)) && !conditions.includes(data.condition as string)) errors.condition='Vui lòng chọn tình trạng.';
  if ((publish || !blank(data.priceMode)) && !template.config.priceModes.includes(data.priceMode as string)) errors.priceMode='Vui lòng chọn cách tính giá hợp lệ.';
  if ((!['CONTACT','FREE'].includes(data.priceMode as string) && publish) || !blank(data.price)) {
    if (typeof data.price!=='string' || !/^\d{1,13}$/.test(data.price) || BigInt(data.price)>9999999999999n) errors.price='Giá bán không hợp lệ (số nguyên VND, tối đa 13 chữ số).';
  }
  if (data.negotiable!==undefined && typeof data.negotiable!=='boolean') errors.negotiable='Lựa chọn thương lượng không hợp lệ.';
  const location = data.location;
  if (!record(location)) { if (publish || location!==undefined) errors.location='Vui lòng nhập vị trí.'; }
  else {
    if (Object.keys(location).some(key=>!['province','district','ward','address','hideExact','latitude','longitude'].includes(key))) errors.location='Vị trí không hợp lệ.';
    for (const [key,label] of [['province','tỉnh/thành'],['district','quận/huyện'],['ward','phường/xã'],['address','địa chỉ']]) text('location.'+key,location[key],key==='province'||key==='ward',key==='address'?300:100,label);
    if (location.hideExact!==undefined && typeof location.hideExact!=='boolean') errors.location='Lựa chọn riêng tư không hợp lệ.';
    for (const [key,limit] of [['latitude',90],['longitude',180]] as const) if (location[key]!==undefined && (typeof location[key]!=='number' || !Number.isFinite(location[key]) || Math.abs(location[key])>limit)) errors.location='Tọa độ không hợp lệ.';
    if ((location.latitude!==undefined)!==(location.longitude!==undefined)) errors.location='Cần đủ vĩ độ và kinh độ.';
  }
  const contact = data.contact;
  if (!record(contact)) { if (publish || contact!==undefined) errors.contact='Vui lòng nhập thông tin liên hệ.'; }
  else {
    if (Object.keys(contact).some(key=>!['name','phone','email'].includes(key))) errors.contact='Thông tin liên hệ không hợp lệ.';
    text('contact.name',contact.name,true,120,'họ tên người bán');
    if ((publish || !blank(contact.phone)) && (typeof contact.phone!=='string' || !/^(0|\+84)[0-9]{9}$/.test(contact.phone))) errors['contact.phone']='Số điện thoại không hợp lệ.';
    if (!blank(contact.email) && (typeof contact.email!=='string' || contact.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))) errors['contact.email']='Email không hợp lệ.';
  }
  for (const [key,max] of [['images',20],['videos',3]] as const) {
    const items = data[key];
    if (items!==undefined && (!Array.isArray(items) || items.length>max || items.some(id=>!uuid(id)) || new Set(items).size!==items.length)) errors[key]='Danh sách tệp không hợp lệ.';
    if (publish && key==='images' && (!Array.isArray(items)||!items.length)) errors.images='Vui lòng thêm ít nhất 1 hình ảnh.';
  }
  const values = data.values ?? {};
  if (!record(values)) return {...errors,values:'Thông tin sản phẩm không hợp lệ.'};
  for (const key of Object.keys(values)) if (!template.fields.some(field=>field.key===key)) errors['values.'+key]='Trường không có trong biểu mẫu.';
  for (const field of template.fields) {
    if (!visible(field,values,template.fields)) continue;
    const value = values[field.key], key='values.'+field.key;
    if (blank(value)) { if (publish && field.required) errors[key]='Vui lòng nhập '+field.label+'.'; continue; }
    const options = field.options.map(option=>option.value);
    let valid = true;
    switch (field.type) {
      case 'boolean': case 'checkbox': valid=typeof value==='boolean'; break;
      case 'select': case 'radio': valid=typeof value==='string' && options.includes(value); break;
      case 'multi-select': valid=Array.isArray(value) && value.length<=100 && new Set(value).size===value.length && value.every(item=>options.includes(item)); break;
      case 'number': case 'year': case 'range': {
        valid=typeof value==='number' && Number.isFinite(value) && Math.abs(value)<=1e13;
        if (valid && field.type==='year') valid=Number.isInteger(value) && Number(value)>=1800 && Number(value)<=new Date().getFullYear()+1;
        if (valid && field.config.min!==undefined) valid=Number(value)>=field.config.min;
        if (valid && field.config.max!==undefined) valid=Number(value)<=field.config.max;
        break;
      }
      case 'currency':
        valid=typeof value==='string' && /^\d{1,13}$/.test(value);
        if(valid && field.config.min!==undefined) valid=Number(value)>=field.config.min;
        if(valid && field.config.max!==undefined) valid=Number(value)<=field.config.max;
        break;
      case 'date': valid=typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value; break;
      case 'image': case 'video': valid=typeof value==='string' && Array.isArray(data[field.type==='image'?'images':'videos']) && (data[field.type==='image'?'images':'videos'] as string[]).includes(value); break;
      default: valid=typeof value==='string' && value.length<=(field.config.maxLength??2000) && value.length>=(field.config.minLength??0);
    }
    if (!valid) errors[key]=field.label+' không hợp lệ.';
  }
  return errors;
}

export function publicData(data: ListingData, template: Template): ListingData {
  const clean = structuredClone(data);
  if (clean.contact) delete clean.contact.email;
  if (clean.location && clean.location.hideExact!==false) { delete clean.location.address; delete clean.location.latitude; delete clean.location.longitude; }
  clean.values = Object.fromEntries(template.fields.filter(field=>visible(field,data.values??{},template.fields)).map(field=>[field.key,data.values?.[field.key]]).filter(([,value])=>value!==undefined));
  return clean;
}
