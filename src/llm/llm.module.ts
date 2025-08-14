import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { ProvidersModule } from '../providers/providers.module';

@Module({
	imports: [ProvidersModule],
	providers: [LlmService],
	exports: [LlmService],
})
export class LlmModule {}