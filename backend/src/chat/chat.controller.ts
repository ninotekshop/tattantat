import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
export class OpenChatDto { @IsUUID() productId!: string; }
export class SendMessageDto { @IsString() @MinLength(1) @MaxLength(2000) content!: string; }

export class SendLocationDto { @IsNumber() @Min(-90) @Max(90) lat!: number; @IsNumber() @Min(-180) @Max(180) lng!: number; @IsOptional() @IsString() @MaxLength(200) label?: string; }
export class SendMediaDto { @IsOptional() @IsString() @MaxLength(2000) caption?: string; }

@Controller('chats')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}
  @Get() list(@Req() request: { user: { id: string } }) { return this.service.list(request.user.id); }
  @Post() open(@Req() request: { user: { id: string } }, @Body() body: OpenChatDto) { return this.service.open(request.user.id, body.productId); }
  @Get(':id/messages') messages(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) { return this.service.messages(request.user.id, id); }
  @Post(':id/messages') @Throttle({ default: { limit: 30, ttl: 60000 } }) send(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string, @Body() body: SendMessageDto, @Headers('idempotency-key') key?: string) { return this.service.send(request.user.id, id, body.content, key); }
  @Post(':id/media') @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 25 * 1024 * 1024, files: 5 } }))
  media(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: { buffer: Buffer; mimetype: string; size: number }[], @Body() body: SendMediaDto) { return this.service.sendMedia(request.user.id, id, files, body?.caption); }
  @Post(':id/location') @Throttle({ default: { limit: 20, ttl: 60000 } })
  location(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string, @Body() body: SendLocationDto) { return this.service.sendLocation(request.user.id, id, body); }
  @Post(':id/messages/:messageId/recall') @Throttle({ default: { limit: 30, ttl: 60000 } })
  recall(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string, @Param('messageId', ParseUUIDPipe) messageId: string) { return this.service.recall(request.user.id, id, messageId); }
  @Delete(':id/messages/:messageId') @Throttle({ default: { limit: 60, ttl: 60000 } })
  hide(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string, @Param('messageId', ParseUUIDPipe) messageId: string) { return this.service.hideForMe(request.user.id, id, messageId); }
}
