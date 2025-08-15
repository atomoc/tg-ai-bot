import { ChatMessage } from '../../context/context.service';
export { ChatMessage };

export interface LlmProvider {
	ask(history: ChatMessage[], question: string, modelId: string): Promise<string>;
	createImage(prompt: string): Promise<string>;
}