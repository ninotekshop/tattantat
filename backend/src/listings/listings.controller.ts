import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { ListingsService } from './listings.service';
import { ListingAdminService } from './listing-admin.service';
import type { Field, ListingData, Template } from './listing-domain';

class DraftDto {
  @IsString() @Matches(/^\d{1,15}$/) categoryId!:string;
  @IsUUID() clientKey!:string;
}
class RevisionDto { @IsInt() @Min(0) revision!:number; }
class SaveDto extends RevisionDto { @IsObject() data!:ListingData; }
class TemplateDto {
  @IsObject() definition!: {name:string;fields:Field[];config:Template['config'];reason:string};
}
class CategoryPatchDto {
  @IsOptional() @IsString() @MaxLength(100) name?:string;
  @IsOptional() @IsIn(['ACTIVE','HIDDEN']) status?:string;
  @IsOptional() @IsInt() @Min(0) sortOrder?:number;
  @IsOptional() @IsString() @MaxLength(500) iconUrl?:string|null;
  @IsOptional() @IsString() @MaxLength(500) description?:string|null;
}
class ReorderDto { @IsArray() items!:{id:string;sortOrder:number}[]; }
class RestoreDto { @IsString() @MaxLength(400) reason!:string; }
class CategoryDto {
  @IsString() @MaxLength(100) name!:string;
  @IsString() @MaxLength(120) slug!:string;
  @IsOptional() @IsString() @Matches(/^\d{1,15}$/) parentId?:string;
}
type AuthRequest={user:{id:string}};
const categoryId=(id:string)=>{if(!/^\d{1,15}$/.test(id)) throw new BadRequestException('Danh mục không hợp lệ.');return id;};
const envelope=<T>(data:T)=>({success:true,data,message:null,errorCode:null});

@Controller()
@UseGuards(ThrottlerGuard)
export class ListingTemplatesController {
  constructor(private readonly listings:ListingsService){}
  @Get('listing-categories') categories(){return this.listings.categories();}
  @Get('categories/:id/schema') categorySchema(@Param('id') id:string){return this.listings.getCategorySchema(id);}
  @Get('categories/:id') category(@Param('id') id:string){return this.listings.category(categoryId(id));}
  @Get('listing-templates/:categoryId') async template(@Param('categoryId') id:string){return envelope(await this.listings.template(categoryId(id)));}
  @Get('listing-fields/:templateId') fields(@Param('templateId',ParseUUIDPipe) id:string){return this.listings.fields(id);}
}

@Controller('listings')
@UseGuards(ThrottlerGuard)
export class ListingsController {
  constructor(private readonly listings:ListingsService){}
  // Xóa TOÀN BỘ tin đăng/sản phẩm rồi nạp dữ liệu mẫu: chỉ quản trị viên tài chính được gọi, và không chạy ở production.
  @Post('clear-and-seed-demo') @UseGuards(JwtAuthGuard,FinanceAdminGuard) clearAndSeedDemo(){
    if(process.env.NODE_ENV==='production') throw new BadRequestException('Không thể xóa dữ liệu ở môi trường production.');
    return this.listings.clearAndSeedDemo();
  }
  @Get('mine') @UseGuards(JwtAuthGuard) mine(@Req() req:AuthRequest){return this.listings.mine(req.user.id);}
  @Get('by-product/:productId') @UseGuards(JwtAuthGuard)
  byProduct(@Req() req:AuthRequest,@Param('productId',ParseUUIDPipe) id:string){return this.listings.byProduct(id,req.user.id);}
  @Post('draft') @UseGuards(JwtAuthGuard) draft(@Req() req:AuthRequest,@Body() dto:DraftDto){return this.listings.create(req.user.id,dto.categoryId,dto.clientKey);}
  @Get(':id') @UseGuards(OptionalJwtAuthGuard) get(@Req() req:{user?:{id:string}},@Param('id',ParseUUIDPipe) id:string,@Query('view') view?:string){return this.listings.get(id,req.user?.id,view==='published');}
  @Put(':id') @UseGuards(JwtAuthGuard) save(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string,@Body() dto:SaveDto){return this.listings.save(id,req.user.id,dto.revision,dto.data);}
  @Post(':id/publish') @UseGuards(JwtAuthGuard) publish(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string,@Body() dto:RevisionDto,@Headers('idempotency-key') key:string){return this.listings.publish(id,req.user.id,dto.revision,key);}
  @Get('product-media/:productId/:sort') async productMedia(@Param('productId',ParseUUIDPipe) productId:string,@Param('sort') sort:string,@Res() res:Response){res.setHeader('Cache-Control','no-store');res.redirect(await this.listings.productMedia(productId,Number(sort)||0));}
  @Get(':id/media/:mediaId') async media(@Param('id',ParseUUIDPipe) id:string,@Param('mediaId',ParseUUIDPipe) mediaId:string,@Res() res:Response){res.setHeader('Cache-Control','no-store');res.redirect(await this.listings.publicMedia(id,mediaId));}
  @Post(':id/images') @UseGuards(JwtAuthGuard) @UseInterceptors(FileInterceptor('file',{limits:{fileSize:10*1024*1024,files:1}}))
  image(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string,@UploadedFile() file?:{buffer:Buffer;mimetype:string}){if(!file) throw new BadRequestException('Vui lòng chọn ảnh.');return this.listings.upload(id,req.user.id,'images',file);}
  @Post(':id/videos') @UseGuards(JwtAuthGuard) @UseInterceptors(FileInterceptor('file',{limits:{fileSize:50*1024*1024,files:1}}))
  video(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string,@UploadedFile() file?:{buffer:Buffer;mimetype:string}){if(!file) throw new BadRequestException('Vui lòng chọn video.');return this.listings.upload(id,req.user.id,'videos',file);}
  @Delete(':id/media/:mediaId') @UseGuards(JwtAuthGuard) remove(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string,@Param('mediaId',ParseUUIDPipe) mediaId:string){return this.listings.removeMedia(id,mediaId,req.user.id);}
  @Delete(':id') @UseGuards(JwtAuthGuard) deleteListing(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string){return this.listings.deleteListing(req.user.id,id);}
}

@Controller('admin/listing-engine')
@UseGuards(JwtAuthGuard,FinanceAdminGuard,ThrottlerGuard)
export class ListingAdminController {
  constructor(private readonly listings:ListingsService,private readonly admin:ListingAdminService){}
  @Get('categories') tree(){return this.admin.tree();}
  @Get('templates/:categoryId') adminTemplate(@Param('categoryId') id:string){return this.admin.template(categoryId(id));}
  @Get('templates/:categoryId/versions') versions(@Param('categoryId') id:string){return this.admin.versions(categoryId(id));}
  @Get('templates/:categoryId/versions/:version') versionDetail(@Param('categoryId') id:string,@Param('version',ParseIntPipe) version:number){return this.admin.version(categoryId(id),version);}
  @Post('templates/:categoryId/versions/:version/restore') restore(@Req() req:AuthRequest,@Param('categoryId') id:string,@Param('version',ParseIntPipe) version:number,@Body() dto:RestoreDto){return this.admin.restore(req.user.id,categoryId(id),version,dto.reason);}
  @Patch('categories/:id') updateCategory(@Req() req:AuthRequest,@Param('id') id:string,@Body() dto:CategoryPatchDto){return this.admin.updateCategory(req.user.id,categoryId(id),dto);}
  @Post('categories/reorder') reorder(@Req() req:AuthRequest,@Body() dto:ReorderDto){return this.admin.reorder(req.user.id,dto.items);}
  @Post('categories') category(@Req() req:AuthRequest,@Body() dto:CategoryDto){return this.listings.adminCategory(req.user.id,dto.name,dto.slug,dto.parentId);}
  @Post('templates/:categoryId/versions') version(@Req() req:AuthRequest,@Param('categoryId') id:string,@Body() dto:TemplateDto){return this.listings.adminVersion(req.user.id,categoryId(id),dto.definition);}
}
