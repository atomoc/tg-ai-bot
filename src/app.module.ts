import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { LlmModule } from './llm/llm.module';
import { ProvidersModule } from './providers/providers.module';
import { TelegramModule } from './telegram/telegram.module';
import {ContextModule} from "./context/context.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    LlmModule,
    ProvidersModule,
    TelegramModule,
    ContextModule,
  ],
})
export class AppModule {}