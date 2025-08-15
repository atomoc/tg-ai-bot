import {
	Update,
	Ctx,
	Start,
	Command,
	On,
	Action,
} from 'nestjs-telegraf';
import { Context, Scenes, Markup } from 'telegraf';
import { LlmService } from '../llm/llm.service';
import { ContextService } from '../context/context.service';
import { ModelService } from '../model/model.service';

@Update()
export class TelegramUpdate {
	constructor(
		private readonly llmService: LlmService,
		private readonly contextService: ContextService,
		private readonly modelService: ModelService,
	) {}
	
	@Start()
	onStart(@Ctx() ctx: Context) {
		const welcomeMessage = `Привет! Я ваш AI-ассистент.
  
Напишите свой вопрос, чтобы получить ответ.

Используйте команду /model, чтобы выбрать AI-модель для ответов.
Используйте команду /image, чтобы сгенерировать изображение.`;
		ctx.reply(welcomeMessage);
	}
	
	@Command('model')
	async onModelCommand(@Ctx() ctx: Context) {
		const keyboard = Markup.inlineKeyboard([
			[Markup.button.callback('🤖 OpenAI', 'select_provider_openai')],
			[Markup.button.callback('✨ Gemini', 'select_provider_gemini')],
		]);
		await ctx.reply('Выберите провайдера:', keyboard);
	}
	
	@Action(/select_provider_(.+)/)
	async onProviderSelect(@Ctx() ctx: any) {
		const provider = ctx.match[1] as 'openai' | 'gemini';
		await ctx.editMessageText(`🔄 Загружаю список моделей для ${provider}...`);
		
		const models = await this.modelService.getModelsByProvider(provider);
		
		if (!models || models.length === 0) {
			await ctx.editMessageText(
				'😕 Не удалось загрузить список моделей. Попробуйте позже.',
			);
			return;
		}
		
		const buttons = models.map((model) =>
			Markup.button.callback(model.name, `select_model_${model.id}`),
		);
		
		const keyboard = Markup.inlineKeyboard(
			buttons.reduce((acc, button, index) => {
				if (index % 2 === 0) acc.push([button]);
				else acc[acc.length - 1].push(button);
				return acc;
			}, []),
		);
		
		await ctx.editMessageText(`Выберите модель для ${provider}:`, keyboard);
	}
	
	@Action(/select_model_(.+)/)
	async onModelSelect(@Ctx() ctx: any) {
		const modelId = ctx.match[1];
		this.modelService.setUserModel(ctx.chat.id, modelId);
		await ctx.editMessageText(`✅ Модель ${modelId} была успешно выбрана!`);
	}
	
	@Command('image')
	async onImageCommand(@Ctx() anusc: Scenes.SceneContext) {
		await anusc.scene.enter('CREATE_IMAGE_SCENE');
	}
	
	@On('text')
	async onMessage(@Ctx() ctx: Context) {
		const thinkingMessage = await ctx.reply('Думаю... 🤔');
		const chatId = ctx.chat.id;
		const userMessage = (ctx.message as any).text;
		
		if (userMessage.toLowerCase().startsWith('картинка ')) {
			const prompt = userMessage.substring(9).trim();
			const imageProvider = this.llmService.getImageProvider();
			const imageUrl = await imageProvider.createImage(prompt);
			
			await ctx.telegram.editMessageText(
				chatId,
				thinkingMessage.message_id,
				null,
				imageUrl,
			);
			return;
		} else {
			const history = this.contextService.getContext(chatId);
			const selectedModel = this.modelService.getUserModel(chatId);
			const provider = this.llmService.getProviderForModel(selectedModel);
			const response = await provider.ask(history, userMessage, selectedModel);
			
			this.contextService.updateContext(chatId, {
				role: 'user',
				content: userMessage,
			});
			this.contextService.updateContext(chatId, {
				role: 'assistant',
				content: response,
			});
			
			try {
				await ctx.telegram.editMessageText(
					chatId,
					thinkingMessage.message_id,
					null,
					response,
				);
			} catch (e) {
				await ctx.reply(response);
			}
		}
	}
}