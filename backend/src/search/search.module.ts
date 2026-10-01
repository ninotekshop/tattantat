import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { SavedSearchesService } from './saved-searches.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SpecsService } from './specs.service';

@Module({ imports: [AuthModule, AccountModule], controllers: [SearchController], providers: [SearchService, SavedSearchesService, SpecsService], exports: [SearchService] })
export class SearchModule {}
