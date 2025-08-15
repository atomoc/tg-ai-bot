import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { session } from 'telegraf';
import { LlmModule } from '../llm/llm.module';
import { ContextModule } from '../context/context.module';
import { ModelModule } from '../model/model.module';
import { TelegramUpdate } from './telegram.update';
import { ImageScene } from './scenes/image.scene';

@Module({
	imports: [
		LlmModule,
		ContextModule,
		ModelModule,
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				token: configService.get<string>('app.telegramToken'),
				middlewares: [session()],
				include: [TelegramModule],
			}),
			inject: [ConfigService],
		}),
	],
	providers: [TelegramUpdate, ImageScene],
})
export class TelegramModule {}