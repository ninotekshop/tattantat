import test from 'node:test';
import assert from 'node:assert/strict';
import { visible, validateListing, publicData } from '../../backend/src/listings/listing-domain.ts';
const fuel={key:'fuel',label:'Nhiên liệu',type:'select',required:true,enabled:true,options:[{value:'electric',label:'Điện'},{value:'petrol',label:'Xăng'}],config:{}};
const engine={key:'engine',label:'Dung tích máy',type:'number',required:true,enabled:true,options:[],config:{min:1,visibleWhen:{field:'fuel',operator:'ne',value:'electric'}}};
const template={id:'test',name:'Xe',categoryId:'1',version:1,fields:[fuel,engine],config:{priceModes:['FIXED','CONTACT']}};
test('shared form engine hides combustion fields for electric vehicles',()=>{
  assert.equal(visible(engine,{fuel:'electric'},template.fields),false);
  assert.equal(visible(engine,{fuel:'petrol'},template.fields),true);
  assert.equal(visible(engine,{},template.fields),false);
});
test('drafts accept incomplete data but reject client financial properties',()=>{
  assert.deepEqual(validateListing({values:{}},template,false),{});
  assert.ok(validateListing({platformFee:0},template,false).form);
});
test('preview masks precise location unless explicitly shared',()=>{
  const data={location:{province:'Test',ward:'Test',address:'Private',latitude:10,longitude:100},contact:{name:'Test',email:'test@example.invalid'},values:{fuel:'electric',engine:150}};
  const result=publicData(data,template);
  assert.equal(result.location.address,undefined);assert.equal(result.contact.email,undefined);assert.equal(result.values.engine,undefined);
  assert.equal(data.location.address,'Private');
});
