import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

class DraftDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(20) condition?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(20) price?: string;
  @IsOptional() @IsString() @MaxLength(3000) notes?: string;
}
class ChatMsgDto { @IsIn(['user', 'assistant']) role!: 'user' | 'assistant'; @IsString() @MaxLength(1000) content!: string; }
class ChatDto { @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ChatMsgDto) messages!: ChatMsgDto[]; }
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}
  @UseGuards(JwtAuthGuard) @Post('listing-draft') draft(@Req() r: { user: { id: string } }, @Body() b: DraftDto) { return this.ai.draftListing(r.user.id, b); }
  @UseGuards(JwtAuthGuard) @Post('support-chat') chat(@Req() r: { user: { id: string } }, @Body() b: ChatDto) { return this.ai.supportChat(r.user.id, b.messages); }
  /** Hỏi đáp nhanh không cần đăng nhập (giới hạn theo IP). */
  @UseGuards(ThrottlerGuard) @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('support-chat/guest') guestChat(@Req() r: { ip?: string }, @Body() b: ChatDto) { return this.ai.supportChatGuest(r.ip ?? '', b.messages); }
}
