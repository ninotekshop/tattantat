import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateProductDto, UpdateListingVisibilityDto, UpdateProductDto } from './dto/products.dto';
import { ProductsService } from './products.service';
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get('categories') categories() { return this.products.categories(); }
  @Get('products') @UseGuards(OptionalJwtAuthGuard)
  list(@Req() request: { user?: { id: string } }, @Query('q') q?: string, @Query('categoryId') categoryId?: string) {
    return this.products.list(q, categoryId === undefined ? undefined : Number(categoryId), request.user?.id);
  }
  @Get('products/mine') @UseGuards(JwtAuthGuard) mine(@Req() request: { user: { id: string } }) { return this.products.mine(request.user.id); }
  @Get('products/:id') @UseGuards(OptionalJwtAuthGuard)
  detail(@Req() request: { user?: { id: string } }, @Param('id') id: string) { return this.products.detail(id, request.user?.id); }
  @Post('products') @UseGuards(JwtAuthGuard) create(@Req() request: { user: { id: string } }, @Body() body: CreateProductDto) { return this.products.create(request.user.id, body); }
  @Patch('products/:id') @UseGuards(JwtAuthGuard)
  update(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateProductDto) { return this.products.update(request.user.id, id, body); }
  @Patch('products/:id/status') @UseGuards(JwtAuthGuard)
  setVisibility(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateListingVisibilityDto) {
    return this.products.setVisibility(request.user.id, id, body.status);
  }
}
