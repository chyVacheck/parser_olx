// ! lib
// nest
import { Controller, Post } from '@nestjs/common';
// ? own
// telegram
import { TelegramService } from '@telegram/telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('start')
  startTelegramBot() {
    this.telegramService.startBot();
    return { message: 'Telegram bot started' };
  }
}
