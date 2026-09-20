import { readFileSync } from 'fs';
import { join } from 'path';
import { Field, Template, ListingData, validateTemplate, validateListing, visible, publicData } from './listing-domain';
import { detectMedia } from './listing-media.service';
const field=(extra:Partial<Field>={}):Field=>({key:'brand',label:'Hãng',type:'select',required:true,enabled:true,options:[{value:'apple',label:'Apple'},{value:'other',label:'Khác'}],config:{},...extra});
const template:Template={id:'template',categoryId:'1',version:1,name:'Điện thoại',config:{priceModes:['FIXED','CONTACT','FREE']},fields:[field(),field({key:'other_brand',label:'Hãng khác',type:'text',options:[],config:{visibleWhen:{field:'brand',operator:'eq',value:'other'}}})]};
const valid=():ListingData=>({title:'Điện thoại đã sử dụng',description:'Mô tả tình trạng thực tế',condition:'USED_GOOD',priceMode:'FIXED',price:'9999999999999',values:{brand:'apple'},images:['7303cc4c-68bd-49aa-b671-084166aeb343'],videos:[],contact:{name:'Người bán',phone:'0901234567',email:'test@example.com'},location:{province:'Bình Định',ward:'Quy Nhơn',address:'Địa chỉ riêng',latitude:13,longitude:109,hideExact:true}});
describe('Listing form contract',()=>{
  it('validates every seeded template in all 12 groups',()=>{
    const groups=JSON.parse(readFileSync(join(__dirname,'seed-catalog.json'),'utf8'));
    expect(groups).toHaveLength(12);
    for(const group of groups)for(const item of [group,...group.children])expect({name:item.name,error:validateTemplate({name:item.name,fields:item.fields,config:group.config})}).toEqual({name:item.name,error:null});
  });
  it('accepts exact integer prices and incomplete drafts',()=>{expect(validateListing(valid(),template,true)).toEqual({});expect(validateListing({values:{}},template,false)).toEqual({});});
  it.each(['1.50','1e9','-1','10000000000000','NaN'])('rejects invalid VND %s',price=>expect(validateListing({...valid(),price},template,true).price).toBeDefined());
  it('rejects client-injected fields and invalid options',()=>{expect(validateListing({...valid(),platformFee:0},template,true).form).toBeDefined();expect(validateListing({...valid(),values:{brand:'forged',admin:true}},template,true)['values.brand']).toBeDefined();});
  it('requires visible dependent fields, not hidden ones',()=>{const data=valid();data.values={brand:'other'};expect(validateListing(data,template,true)['values.other_brand']).toBeDefined();expect(visible(template.fields[1],{brand:'apple'},template.fields)).toBe(false);});
  it('hides precise address, coordinates, email and inactive attributes without mutating original',()=>{const data=valid();data.values!.other_brand='Hidden';const output=publicData(data,template);expect(output.location?.address).toBeUndefined();expect(output.location?.latitude).toBeUndefined();expect(output.contact?.email).toBeUndefined();expect(output.values?.other_brand).toBeUndefined();expect(data.location?.address).toBe('Địa chỉ riêng');});
  it('bounds and deduplicates media',()=>{const data=valid();data.images=[...data.images!,...data.images!];expect(validateListing(data,template,true).images).toBeDefined();});
  it('rejects conditional cycles, duplicate keys and executable rules',()=>{
    expect(validateTemplate({...template,fields:[template.fields[1],template.fields[0]]})).not.toBeNull();
    expect(validateTemplate({...template,fields:[field(),field()]})).not.toBeNull();
    expect(validateTemplate({...template,fields:[field({config:{regex:'evil'} as Field['config']})]})).not.toBeNull();
  });
  it('does not accept filenames or declared MIME as proof of an image',()=>{expect(detectMedia(Buffer.from('<script>alert(1)</script>'),'images')).toBeNull();expect(detectMedia(Buffer.from([137,80,78,71,13,10,26,10]),'images')).toBe('image/png');expect(detectMedia(Buffer.from([137,80,78,71,13,10,26,10]),'videos')).toBeNull();});
  it('checks real calendar dates and currency field bounds',()=>{
    const custom={...template,fields:[field({key:'date',type:'date',options:[]}),field({key:'deposit',type:'currency',options:[],config:{min:100,max:500}})]};
    const errors=validateListing({...valid(),values:{date:'2026-02-30',deposit:'501'}},custom,true);expect(errors['values.date']).toBeDefined();expect(errors['values.deposit']).toBeDefined();
  });
});
