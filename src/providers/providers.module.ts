import { Module } from '@nestjs/common';
import { OpenaiModule } from './openai/openai.module';
import { GeminiModule } from './gemini/gemini.module';

@Module({
	imports: [OpenaiModule, GeminiModule],
	exports: [OpenaiModule, GeminiModule],
})
export class ProvidersModule {}