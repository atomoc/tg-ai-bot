import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../config/app.config';
import { LlmProvider } from './interfaces/llm.interface';
import { OpenaiService } from '../providers/openai/openai.service';
import { GeminiService } from '../providers/gemini/gemini.service';

@Injectable()
export class LlmService {
	private readonly provider: LlmProvider;
	
	constructor(
		@Inject(appConfig.KEY)
		private readonly config: ConfigType<typeof appConfig>,
		private readonly openaiService: OpenaiService,
		private readonly geminiService: GeminiService,
	) {
		// Выбираем провайдера на основе переменной окружения
		if (config.defaultLlmProvider === 'gemini') {
			this.provider = this.geminiService;
			console.log('Using Gemini as the default provider.');
		} else {
			this.provider = this.openaiService;
			console.log('Using OpenAI as the default provider.');
		}
	}
	
	// Метод для получения активного провайдера
	getProvider(): LlmProvider {
		return this.provider;
	}
}