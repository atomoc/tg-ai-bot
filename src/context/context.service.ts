import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Описывает структуру сообщения в истории диалога
export interface ChatMessage {
	role: 'user' | 'assistant' | 'system' | 'model'; // 'model' используется для Gemini
	content: string;
}

const CONTEXT_FILE_PATH = path.join(process.cwd(), 'data', 'userContexts.json');

@Injectable()
export class ContextService {
	constructor() {
		// Убедимся, что директория для контекста существует
		const dir = path.dirname(CONTEXT_FILE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	}
	
	private loadUserContexts(): Record<number, ChatMessage[]> {
		if (fs.existsSync(CONTEXT_FILE_PATH)) {
			try {
				const data = fs.readFileSync(CONTEXT_FILE_PATH, 'utf-8');
				return JSON.parse(data);
			} catch (e) {
				console.error('Error reading or parsing context file:', e);
				return {};
			}
		}
		return {};
	}
	
	private saveUserContexts(contexts: Record<number, ChatMessage[]>): void {
		fs.writeFileSync(CONTEXT_FILE_PATH, JSON.stringify(contexts, null, 2));
	}
	
	// Получаем историю сообщений для конкретного чата
	getContext(chatId: number): ChatMessage[] {
		const contexts = this.loadUserContexts();
		return (contexts[chatId] || []).slice(-40); // Ограничиваем историю
	}
	
	// Обновляем историю сообщений
	updateContext(chatId: number, newMessage: ChatMessage): void {
		const contexts = this.loadUserContexts();
		if (!contexts[chatId]) {
			contexts[chatId] = [];
		}
		contexts[chatId].push(newMessage);
		this.saveUserContexts(contexts);
	}
}