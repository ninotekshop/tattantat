import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { SavedSearchesService } from './saved-searches.service';
import { SearchService } from './search.service';
import { SpecsService } from './specs.service';

type R = { user: { id: string } };
const uuid = (id: string) => { if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Mã không hợp lệ'); return id; };

@Controller()
export class SearchController {
  constructor(private readonly search: SearchService, private readonly saved: SavedSearchesService, private readonly specs: SpecsService) {}
  @Get('search/products') @UseGuards(OptionalJwtAuthGuard)
  products(@Req() r: { user?: { id: string } }, @Query() q: Record<string, unknown>) { return this.search.search(q, r.user?.id); }
  @Get('search/hot-keywords') hot() { return this.search.hotKeywords(6); }
  @Get('search/specs/:id') productSpecs(@Param('id') id: string) { return this.specs.specs(id); }
  @Get('search/market/:id') market(@Param('id') id: string) { return this.specs.market(id); }
  @Get('search/sitemap') sitemap() { return this.search.sitemap(); }
  @Get('me/saved-searches') @UseGuards(JwtAuthGuard) list(@Req() r: R) { return this.saved.list(r.user.id); }
  @Post('me/saved-searches') @UseGuards(JwtAuthGuard) create(@Req() r: R, @Body() b: { name?: string; params?: Record<string, unknown> }) { return this.saved.create(r.user.id, b?.name, b?.params ?? {}); }
  @Patch('me/saved-searches/:id') @UseGuards(JwtAuthGuard) toggle(@Req() r: R, @Param('id') id: string, @Body() b: { notify?: boolean }) { return this.saved.toggle(r.user.id, uuid(id), b?.notify !== false); }
  @Delete('me/saved-searches/:id') @UseGuards(JwtAuthGuard) remove(@Req() r: R, @Param('id') id: string) { return this.saved.remove(r.user.id, uuid(id)); }
}
