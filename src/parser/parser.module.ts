// ! lib
// nest
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// ? own
// parser
import { ParserService } from '@parser/parser.service';
// telegram
import { TelegramModule } from '@telegram/telegram.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => TelegramModule), // forwardRef для разрешения циклических зависимостей
  ],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule {}
