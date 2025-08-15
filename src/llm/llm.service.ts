import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../config/app.config';
import { LlmProvider } from './interfaces/llm.interface';
import { OpenaiService } from '../providers/openai/openai.service';
import { GeminiService } from '../providers/gemini/gemini.service';

@Injectable()
export class LlmService {
	constructor(
		@Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
		private readonly openaiService: OpenaiService,
		private readonly geminiService: GeminiService,
	) {}
	
	/**
	 * Определяет, какой сервис использовать (OpenAI или Gemini)
	 * на основе идентификатора модели, выбранной пользователем.
	 * @param modelId - Идентификатор модели (например, 'gpt-4o' или 'models/gemini-1.5-pro').
	 * @returns Экземпляр сервиса, соответствующий модели.
	 */
	getProviderForModel(modelId: string): LlmProvider {
		// Если в названии модели есть 'gemini' или 'models/', это Gemini.
		if (modelId.includes('gemini') || modelId.includes('models/')) {
			return this.geminiService;
		}
		// Во всех остальных случаях (gpt-4, gpt-3.5 и т.д.) используется OpenAI.
		return this.openaiService;
	}
	
	/**
	 * Возвращает сервис, отвечающий за генерацию изображений.
	 * В текущей реализации это всегда OpenaiService (DALL-E).
	 * @returns Экземпляр OpenaiService.
	 */
	getImageProvider(): LlmProvider {
		return this.openaiService;
	}
}