// ! lib
// nest
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// ? own
// parser
import { ParserModule } from '@parser/parser.module';
// telegram
import { TelegramService } from '@telegram/telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ParserModule), // forwardRef для разрешения циклических зависимостей
  ],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
