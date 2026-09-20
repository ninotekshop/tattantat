import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
export class OpenChatDto { @IsUUID() productId!: string; }
export class SendMessageDto { @IsString() @MinLength(1) @MaxLength(2000) content!: string; }

@Controller('chats')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}
  @Get() list(@Req() request: { user: { id: string } }) { return this.service.list(request.user.id); }
  @Post() open(@Req() request: { user: { id: string } }, @Body() body: OpenChatDto) { return this.service.open(request.user.id, body.productId); }
  @Get(':id/messages') messages(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) { return this.service.messages(request.user.id, id); }
  @Post(':id/messages') @Throttle({ default: { limit: 30, ttl: 60000 } }) send(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string, @Body() body: SendMessageDto, @Headers('idempotency-key') key?: string) { return this.service.send(request.user.id, id, body.content, key); }
}
