import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import appConfig from '../../config/app.config';
import { LlmProvider, ChatMessage } from '../../llm/interfaces/llm.interface';

@Injectable()
export class GeminiService implements LlmProvider {
	private readonly genAI: GoogleGenerativeAI;
	
	constructor(@Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>) {
		this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
	}
	
	async ask(history: ChatMessage[], question: string): Promise<string> {
		const model = this.genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
			// Настройки безопасности, можно настроить по необходимости
			safetySettings: [
				{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
				{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
			],
		});
		
		// Gemini требует чередования ролей 'user' и 'model'
		const formattedHistory = history.map((msg) => ({
			role: msg.role === 'assistant' ? 'model' : 'user', // Меняем 'assistant' на 'model'
			parts: [{ text: msg.content }],
		}));
		
		try {
			const chat = model.startChat({ history: formattedHistory });
			const result = await chat.sendMessage(question);
			return result.response.text();
		} catch (error) {
			console.error('Gemini Error:', error.message);
			return 'Извините, произошла ошибка с Gemini.';
		}
	}
	
	async createImage(prompt: string): Promise<string> {
		return 'Генерация изображений через Gemini пока не поддерживается в этом боте.';
	}
}