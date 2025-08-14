import { Ctx, Scene, SceneEnter, Command, On } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { LlmService } from '../../llm/llm.service';

@Scene('CREATE_IMAGE_SCENE')
export class ImageScene {
	constructor(private readonly llmService: LlmService) {}
	
	@SceneEnter()
	onSceneEnter(@Ctx() ctx: Scenes.SceneContext): void {
		ctx.reply('Опишите картинку, которую хотите создать.');
	}
	
	@Command('start')
	async onLeaveCommand(@Ctx() ctx: Scenes.SceneContext) {
		await ctx.scene.leave();
		ctx.reply('Вы вышли из режима создания картинок.');
	}
	
	@On('text')
	async onText(@Ctx() ctx: Scenes.SceneContext) {
		const thinkingMessage = await ctx.reply('Создаю шедевр... 🎨');
		const prompt = (ctx.message as any).text;
		const provider = this.llmService.getProvider();
		const imageUrl = await provider.createImage(prompt);
		
		await ctx.telegram.editMessageText(
			ctx.chat.id,
			thinkingMessage.message_id,
			null,
			imageUrl,
		);
		await ctx.scene.leave();
	}
}