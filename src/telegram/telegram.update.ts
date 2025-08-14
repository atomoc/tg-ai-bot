import { Update, Ctx, Start, Command, On } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';
import { LlmService } from '../llm/llm.service';
import { ContextService, ChatMessage } from '../context/context.service'; // Импортируем

@Update()
export class TelegramUpdate {
	// Подключаем ContextService
	constructor(
		private readonly llmService: LlmService,
		private readonly contextService: ContextService,
	) {}
	
	@Start()
	onStart(): string {
		return 'Напишите свой вопрос, чтобы получить ответ от AI.';
	}
	
	@Command('image')
	async onImageCommand(@Ctx() ctx: Scenes.SceneContext) {
		await ctx.scene.enter('CREATE_IMAGE_SCENE');
	}
	
	@On('text')
	async onMessage(@Ctx() ctx: Context) {
		const thinkingMessage = await ctx.reply('Думаю... 🤔');
		const chatId = ctx.chat.id;
		const userMessage = (ctx.message as any).text;
		
		const provider = this.llmService.getProvider();
		let response: string;
		
		if (userMessage.toLowerCase().startsWith('картинка ')) {
			const prompt = userMessage.substring(9).trim();
			response = await provider.createImage(prompt);
		} else {
			const history = this.contextService.getContext(chatId);
			response = await provider.ask(history, userMessage);
			this.contextService.updateContext(chatId, { role: 'user', content: userMessage });
			this.contextService.updateContext(chatId, { role: 'assistant', content: response });
		}
		
		// Разбиваем по 4096 символов
		const splitMessage = (text: string, limit = 4096): string[] => {
			const parts = [];
			let i = 0;
			while (i < text.length) {
				parts.push(text.slice(i, i + limit));
				i += limit;
			}
			return parts;
		};
		
		const parts = splitMessage(response);
		
		try {
			// Если только одна часть — просто редактируем сообщение
			if (parts.length === 1) {
				await ctx.telegram.editMessageText(chatId, thinkingMessage.message_id, undefined, parts[0]);
			} else {
				// Иначе удаляем старое "Думаю..." и отправляем по частям
				await ctx.telegram.deleteMessage(chatId, thinkingMessage.message_id);
				for (const part of parts) {
					await ctx.reply(part);
				}
			}
		} catch (e) {
			console.error('Failed to edit or send message:', e.message);
			for (const part of parts) {
				await ctx.reply(part);
			}
		}
	}
	
}