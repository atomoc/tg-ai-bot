import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system' | 'model';
	content: string;
}

export interface UserData {
	model?: string;
}

interface UserContext {
	messages: ChatMessage[];
	data: UserData;
}

const CONTEXT_FILE_PATH = path.join(process.cwd(), 'data', 'userContexts.json');

@Injectable()
export class ContextService {
	constructor() {
		const dir = path.dirname(CONTEXT_FILE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	}
	
	private loadContexts(): Record<number, UserContext> {
		if (fs.existsSync(CONTEXT_FILE_PATH)) {
			try {
				return JSON.parse(fs.readFileSync(CONTEXT_FILE_PATH, 'utf-8'));
			} catch (e) {
				return {};
			}
		}
		return {};
	}
	
	private saveContexts(contexts: Record<number, UserContext>): void {
		fs.writeFileSync(CONTEXT_FILE_PATH, JSON.stringify(contexts, null, 2));
	}
	
	private initializeUserContext(chatId: number, contexts: Record<number, UserContext>) {
		if (!contexts[chatId]) {
			contexts[chatId] = { messages: [], data: {} };
		}
	}
	
	getContext(chatId: number): ChatMessage[] {
		const contexts = this.loadContexts();
		return (contexts[chatId]?.messages || []).slice(-40);
	}
	
	updateContext(chatId: number, newMessage: ChatMessage): void {
		const contexts = this.loadContexts();
		this.initializeUserContext(chatId, contexts);
		contexts[chatId].messages.push(newMessage);
		this.saveContexts(contexts);
	}
	
	getUserData(chatId: number): UserData {
		const contexts = this.loadContexts();
		return contexts[chatId]?.data || {};
	}
	
	setUserData(chatId: number, dataToUpdate: Partial<UserData>): void {
		const contexts = this.loadContexts();
		this.initializeUserContext(chatId, contexts);
		contexts[chatId].data = { ...contexts[chatId].data, ...dataToUpdate };
		this.saveContexts(contexts);
	}
}