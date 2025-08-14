// Этот интерфейс теперь можно импортировать из context.service
import { ChatMessage } from '../../context/context.service';

export { ChatMessage }; // Экспортируем для удобства

// Общий интерфейс для всех AI-провайдеров
export interface LlmProvider {
	// Теперь ask принимает всю историю сообщений
	ask(history: ChatMessage[], question: string): Promise<string>;
	createImage(prompt: string): Promise<string>;
}