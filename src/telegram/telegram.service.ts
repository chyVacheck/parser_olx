// ! lib
// nest
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// node-telegram-bot-api
import TelegramBot from 'node-telegram-bot-api';
// ? own
// parser
import { ParserService } from '@parser/parser.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private isBotInitialized: boolean;

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => ParserService)) // forwardRef
    private parserService: ParserService,
  ) {}

  public startBot() {
    if (this.isBotInitialized) {
      this.logger.warn('Telegram bot is already initialized');
      return;
    }

    this.bot = new TelegramBot(this.configService.get<string>('BOT_TOKEN'), {
      polling: true,
    });
    this.delay(2_000);

    this.bot.onText(/\/hello/, (msg) => this.sendWelcomeMessage(msg.chat.id));
    this.bot.onText(/\/status/, (msg) => this.sendStatus(msg.chat.id));
    this.bot.onText(/\/start_parsing/, (msg) => this.startParsing(msg.chat.id));
    this.bot.onText(/\/stop_parsing/, (msg) => this.stopParsing(msg.chat.id));
    this.bot.onText(/\/set_interval (\d+)/, (msg, match) =>
      this.setInterval(msg.chat.id, parseInt(match[1])),
    );
    this.bot.onText(/\/statistics/, (msg) => this.sendStatistics(msg.chat.id));

    this.isBotInitialized = true;
    this.logger.log('Telegram bot initialized');
  }

  public async sendMessage(chatId: TelegramBot.ChatId, text: string) {
    await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  private sendWelcomeMessage(chatId: number) {
    const message =
      'Welcome! Use the commands to control the parser:\n' +
      '/status - Show parser status\n' +
      '/start_parsing - Start the parser\n' +
      '/stop_parsing - Stop the parser\n' +
      '/set_interval <milliseconds> - Set parsing interval\n' +
      '/statistics - Show parsing statistics';
    this.bot.sendMessage(chatId, message);
  }

  private async sendStatus(chatId: number) {
    const status = this.parserService.getStatus();
    await this.sendMessage(chatId, `Parser status: ${status}`);
  }

  private async startParsing(chatId: number) {
    await this.sendMessage(chatId, 'Parsing started');
    await this.parserService.startParsing();
  }

  private async stopParsing(chatId: number) {
    const result = this.parserService.stopParsing();
    await this.sendMessage(chatId, result);
  }

  private async setInterval(chatId: number, interval: number) {
    const result = this.parserService.setInterval(interval);
    await this.sendMessage(chatId, result);
  }

  private async sendStatistics(chatId: number) {
    const stats = this.parserService.getStatistics();
    const message =
      `Parser statistics:\n` +
      `Sites parsed: ${stats.siteCount}\n` +
      `Total IDs found: ${stats.idCount}`;
    await this.sendMessage(chatId, message);
  }
}
