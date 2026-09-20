import { ConflictException, NotFoundException } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { DatabaseService } from '../database/database.service';
import { ListingMediaService } from './listing-media.service';
const seller='7303cc4c-68bd-49aa-b671-084166aeb343',id='6303cc4c-68bd-49aa-b671-084166aeb343';
describe('Listing transaction protections',()=>{
  const media={signed:jest.fn().mockResolvedValue('signed-url'),remove:jest.fn(),upload:jest.fn()};
  function setup(query:jest.Mock){const client={query};const db={query,transaction:jest.fn(work=>work(client))};return {service:new ListingsService(db as unknown as DatabaseService,media as unknown as ListingMediaService),db};}
  it('isolates seller drafts on writes',async()=>{const query=jest.fn().mockResolvedValue({rows:[]});const {service}=setup(query);await expect(service.save(id,seller,0,{})).rejects.toBeInstanceOf(NotFoundException);expect(query.mock.calls[0][1]).toEqual([id,seller]);});
  it('rejects stale revisions before modifying data',async()=>{const query=jest.fn().mockResolvedValue({rows:[{id,revision:2}]});await expect(setup(query).service.save(id,seller,1,{})).rejects.toBeInstanceOf(ConflictException);expect(query).toHaveBeenCalledTimes(1);});
  it('replays publish without creating a second product',async()=>{
    const query=jest.fn().mockResolvedValueOnce({rows:[{id,revision:5}]}).mockResolvedValueOnce({rows:[{id:seller}]}).mockResolvedValueOnce({rows:[{listing_id:id,revision:5,product_id:'product'}]});
    const {service,db}=setup(query);expect((await service.publish(id,seller,5,id)).data.productId).toBe('product');expect(db.transaction).toHaveBeenCalledTimes(1);expect(query).toHaveBeenCalledTimes(3);
  });
  it('rejects idempotency keys bound to another payload',async()=>{const query=jest.fn().mockResolvedValueOnce({rows:[{id,revision:5}]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{listing_id:id,revision:4}]});await expect(setup(query).service.publish(id,seller,5,id)).rejects.toBeInstanceOf(ConflictException);});
  it('never exposes an unpublished draft to another user',async()=>{const query=jest.fn().mockResolvedValue({rows:[{id,seller_id:seller,published_snapshot:null}]});await expect(setup(query).service.get(id,'another-user')).rejects.toBeInstanceOf(NotFoundException);});
  it('keeps media referenced by the live version',async()=>{const query=jest.fn().mockResolvedValue({rows:[{id,published_snapshot:{data:{images:[id]}},data:{images:[]}}]});await expect(setup(query).service.removeMedia(id,id,seller)).rejects.toBeInstanceOf(ConflictException);expect(media.remove).not.toHaveBeenCalled();});
  it('resolves the owner editor without relying on latest-100 summaries',async()=>{
    const query=jest.fn().mockResolvedValue({rows:[{id}]});
    expect((await setup(query).service.byProduct('product',seller)).data.listingId).toBe(id);
    expect(query.mock.calls[0][1]).toEqual(['product',seller]);
    expect(query.mock.calls[0][0]).toContain('p.seller_id=$2');
  });
  it('identifies an owned legacy product explicitly',async()=>{
    const query=jest.fn().mockResolvedValue({rows:[{id:null}]});
    expect((await setup(query).service.byProduct('product',seller)).data.listingId).toBeNull();
  });
  it('never treats unauthorized or missing products as legacy',async()=>{
    const query=jest.fn().mockResolvedValue({rows:[]});
    await expect(setup(query).service.byProduct('foreign-product',seller)).rejects.toBeInstanceOf(NotFoundException);
  });
});
