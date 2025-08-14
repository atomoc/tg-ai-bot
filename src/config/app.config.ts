import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
	port: parseInt(process.env.PORT, 10) || 3000,
	telegramToken: process.env.TELEGRAM_BOT_TOKEN,
	defaultLlmProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
	openaiApiKey: process.env.OPENAI_API_KEY,
	geminiApiKey: process.env.GEMINI_API_KEY,
	proxyString: process.env.PROXY_STRING,
}));