import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import appConfig from '../../config/app.config';
import {
	LlmProvider,
	ChatMessage,
} from '../../llm/interfaces/llm.interface';

@Injectable()
export class OpenaiService implements LlmProvider {
	private readonly httpAgent?: HttpsProxyAgent<string>;
	
	constructor(
		@Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
	) {
		if (config.proxyString) {
			const [ip, port, login, password] = config.proxyString.split(':');
			this.httpAgent = new HttpsProxyAgent(
				`http://${login}:${password}@${ip}:${port}`,
			);
		}
	}
	
	async ask(
		history: ChatMessage[],
		question: string,
		modelId: string,
	): Promise<string> {
		const messages = [
			...history,
			{ role: 'user', content: question } as ChatMessage,
		];
		
		try {
			const response = await axios.post(
				'https://api.openai.com/v1/chat/completions',
				{ model: modelId, messages },
				{
					headers: { Authorization: `Bearer ${this.config.openaiApiKey}` },
					httpsAgent: this.httpAgent,
				},
			);
			return response.data.choices[0].message.content.trim();
		} catch (error) {
			console.error('OpenAI Error:', error.message);
			return 'Извините, произошла ошибка с OpenAI.';
		}
	}
	
	async createImage(prompt: string): Promise<string> {
		try {
			const response = await axios.post(
				'https://api.openai.com/v1/images/generations',
				{ model: 'dall-e-3', prompt, n: 1, size: '1024x1024' },
				{
					headers: { Authorization: `Bearer ${this.config.openaiApiKey}` },
					httpsAgent: this.httpAgent,
				},
			);
			return response.data.data[0].url;
		} catch (error) {
			console.error('DALL-E Error:', error.message);
			return 'Не удалось создать изображение.';
		}
	}
}