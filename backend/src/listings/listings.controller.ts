import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { ListingsService } from './listings.service';
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
  @Post('clear-and-seed-demo') clearAndSeedDemo(){return this.listings.clearAndSeedDemo();}
  @Get('mine') @UseGuards(JwtAuthGuard) mine(@Req() req:AuthRequest){return this.listings.mine(req.user.id);}
  @Get('by-product/:productId') @UseGuards(JwtAuthGuard)
  byProduct(@Req() req:AuthRequest,@Param('productId',ParseUUIDPipe) id:string){return this.listings.byProduct(id,req.user.id);}
  @Post('draft') @UseGuards(JwtAuthGuard) draft(@Req() req:AuthRequest,@Body() dto:DraftDto){return this.listings.create(req.user.id,dto.categoryId,dto.clientKey);}
  @Get(':id') @UseGuards(OptionalJwtAuthGuard) get(@Req() req:{user?:{id:string}},@Param('id',ParseUUIDPipe) id:string,@Query('view') view?:string){return this.listings.get(id,req.user?.id,view==='published');}
  @Put(':id') @UseGuards(JwtAuthGuard) save(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string,@Body() dto:SaveDto){return this.listings.save(id,req.user.id,dto.revision,dto.data);}
  @Post(':id/publish') @UseGuards(JwtAuthGuard) publish(@Req() req:AuthRequest,@Param('id',ParseUUIDPipe) id:string,@Body() dto:RevisionDto,@Headers('idempotency-key') key:string){return this.listings.publish(id,req.user.id,dto.revision,key);}
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
  constructor(private readonly listings:ListingsService){}
  @Post('categories') category(@Req() req:AuthRequest,@Body() dto:CategoryDto){return this.listings.adminCategory(req.user.id,dto.name,dto.slug,dto.parentId);}
  @Post('templates/:categoryId/versions') version(@Req() req:AuthRequest,@Param('categoryId') id:string,@Body() dto:TemplateDto){return this.listings.adminVersion(req.user.id,categoryId(id),dto.definition);}
}
