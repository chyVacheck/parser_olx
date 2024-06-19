// ! lib
// nest
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// ? own
// parser
import { ParserModule } from '@parser/parser.module';
import { ParserService } from '@parser/parser.service';
// telegram
import { TelegramModule } from '@telegram/telegram.module';
import { TelegramService } from '@telegram/telegram.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // делает переменные окружения доступными во всем приложении
    }),
    ParserModule,
    TelegramModule,
    // другие модули
  ],
  providers: [ConfigService, ParserService, TelegramService],
})
export class AppModule {}
