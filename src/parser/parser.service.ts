// ! lib
// nest
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// fs
import fs from 'fs';
// axios
import axios from 'axios';
// jsdom
import { JSDOM } from 'jsdom';
// ? own
// telegram
import { TelegramService } from '@telegram/telegram.service';
// json with all links
import links from './../data/links.json';

const BASE_URL = 'https://www.olx.pl';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);
  private isParsing: boolean = false;
  private interval: number;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => TelegramService)) // forwardRef
    private telegramService: TelegramService,
  ) {
    this.interval = configService.get<number>('PARSING_INTERVAL', 500);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async startParsing() {
    if (this.isParsing) {
      this.logger.warn('Parsing is already running');
      return 'Parsing is already running';
    }

    this.isParsing = true;
    this.logger.log('Parsing started');

    while (this.isParsing) {
      this.logger.log('Starting parsing iteration...');
      const newLinks = { ...links };
      let needToChange = false;

      const promises = Object.keys(links).map(async (index) => {
        const item = links[index];
        let isPushed = false;
        let message = `Номер сайта - ${index}\n\n`;

        try {
          const response = await axios.get(item.href);
          this.logger.log(`Site #${index} fetched successfully`);

          const dom = new JSDOM(response.data);
          const divWithAllOffers = dom.window.document.querySelector(
            '[data-testid="listing-grid"]',
          ) as HTMLDivElement | null;

          if (!divWithAllOffers) {
            this.logger.error('No offers found on site #' + index);
            return;
          }

          const allOffers = Array.from(
            divWithAllOffers.querySelectorAll('[data-cy="l-card"]'),
          ) as HTMLDivElement[];

          for (const offer of allOffers) {
            const anchorElement = offer.querySelector('a') as HTMLAnchorElement;
            const _link = anchorElement?.getAttribute('href') ?? '';
            const number = allOffers.indexOf(offer);
            const data = {
              link: _link.startsWith('https://www.')
                ? _link
                : `${BASE_URL}${_link}`,
              id: Number(offer.getAttribute('id')) || null,
            };

            if (!item.ids.includes(data.id)) {
              isPushed = true;
              item.ids.push(data.id);
              message += `${number} id - ${data.id}\t[Ссылка](${data.link})\n`;
            }
          }

          if (isPushed) {
            needToChange = true;
            await this.delay(2000);
            await this.telegramService.sendMessage(
              this.configService.get<string>('CHAT_ID'),
              message,
            );
            newLinks[index] = { href: item.href, ids: item.ids };
          }
        } catch (error) {
          this.logger.error(
            `Error fetching site #${index}:`,
            (error as Error).message,
          );
        }
      });

      await Promise.all(promises);

      if (needToChange) {
        fs.writeFileSync(
          'src/data/links.json',
          JSON.stringify(newLinks, null, 2),
          'utf8',
        );
        this.logger.log('links.json file updated');
      }

      if (!this.isParsing) {
        this.logger.log('Parsing has been stopped');
        break;
      }

      await this.delay(this.interval);
    }
  }

  stopParsing() {
    if (!this.isParsing) {
      this.logger.warn('Parsing is not running');
      return 'Parsing is not running';
    }
    this.isParsing = false;
    this.logger.log('Parsing stopped');
    return 'Parsing stopped';
  }

  getStatus() {
    return this.isParsing ? 'Parsing is running' : 'Parsing is stopped';
  }

  setInterval(interval: number) {
    this.interval = interval;
    this.logger.log(`Interval set to ${this.interval} ms`);
    return `Interval set to ${this.interval} ms`;
  }

  getStatistics() {
    const siteCount = Object.keys(links).length;
    const idCount = Object.values(links).reduce(
      (acc, item) => acc + item.ids.length,
      0,
    );
    return {
      siteCount,
      idCount,
    };
  }
}
