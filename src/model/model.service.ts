import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import appConfig from '../config/app.config';
import { ContextService } from '../context/context.service';

interface Model {
	id: string;
	name: string;
}

interface Cache {
	models: Model[];
	timestamp: number;
}

@Injectable()
export class ModelService {
	private modelCache: { openai: Cache; gemini: Cache } = {
		openai: { models: [], timestamp: 0 },
		gemini: { models: [], timestamp: 0 },
	};
	private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа
	
	constructor(
		private readonly contextService: ContextService,
		@Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
	) {}
	
	async getModelsByProvider(provider: 'openai' | 'gemini'): Promise<Model[]> {
		const now = Date.now();
		const cached = this.modelCache[provider];
		
		if (cached.models.length > 0 && now - cached.timestamp < this.CACHE_DURATION) {
			return cached.models;
		}
		
		let models: Model[] = [];
		if (provider === 'openai') {
			models = await this.fetchOpenAIModels();
		} else {
			models = await this.fetchGeminiModels(); // Теперь этот вызов тоже асинхронный
		}
		
		this.modelCache[provider] = { models, timestamp: now };
		return models;
	}
	
	private async fetchOpenAIModels(): Promise<Model[]> {
		try {
			const response = await axios.get('https://api.openai.com/v1/models', {
				headers: { Authorization: `Bearer ${this.config.openaiApiKey}` },
			});
			
			return response.data.data
				.filter((model: any) => model.id.startsWith('gpt-'))
				.map((model: any) => ({
					id: model.id,
					name: this.formatModelName(model.id),
				}))
				.sort((a, b) => b.name.localeCompare(a.name));
		} catch (error) {
			console.error('Failed to fetch OpenAI models:', error.message);
			return [
				{ name: 'GPT-4o (Fallback)', id: 'gpt-4o' },
				{ name: 'GPT-3.5 Turbo (Fallback)', id: 'gpt-3.5-turbo' },
			];
		}
	}
	
	// --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
	private async fetchGeminiModels(): Promise<Model[]> {
		const apiKey = this.config.geminiApiKey;
		if (!apiKey) {
			console.error('Gemini API key is not configured.');
			return [];
		}
		const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
		
		try {
			const response = await axios.get(url);
			
			// Фильтруем модели:
			// - Оставляем только те, которые поддерживают генерацию текста (`generateContent`).
			// - Отбираем только модели 'gemini'.
			return response.data.models
				.filter(
					(model: any) =>
						model.supportedGenerationMethods.includes('generateContent') &&
						model.name.includes('gemini'),
				)
				.map((model: any) => ({
					id: model.name, // API возвращает id в формате 'models/gemini-1.5-flash'
					name: model.displayName, // Используем готовое "красивое" имя
				}))
				.sort((a, b) => b.name.localeCompare(a.name)); // Сортируем для удобства
		} catch (error) {
			console.error('Failed to fetch Gemini models:', error.message);
			// В случае ошибки возвращаем базовый список, чтобы бот не сломался
			return [
				{ name: 'Gemini 1.5 Flash (Fallback)', id: 'models/gemini-1.5-flash' },
				{ name: 'Gemini 1.5 Pro (Fallback)', id: 'models/gemini-1.5-pro' },
			];
		}
	}
	// --- КОНЕЦ ИЗМЕНЕНИЙ ---
	
	private formatModelName(id: string): string {
		return id
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')
			.replace('Gpt', 'GPT');
	}
	
	setUserModel(chatId: number, modelId: string) {
		this.contextService.setUserData(chatId, { model: modelId });
	}
	
	getUserModel(chatId: number): string {
		const userData = this.contextService.getUserData(chatId);
		// Определяем провайдера по умолчанию из конфига для выбора адекватной fallback-модели
		const defaultProvider = this.config.defaultLlmProvider;
		
		if (userData?.model) {
			return userData.model;
		}
		
		// Возвращаем модель по умолчанию в зависимости от выбранного провайдера
		return defaultProvider === 'gemini' ? 'models/gemini-1.5-flash' : 'gpt-4o';
	}
}