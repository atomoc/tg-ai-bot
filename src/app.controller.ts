import { Controller, Post, Body } from '@nestjs/common';
import { LlmService } from './llm/llm.service';
import { ModelService } from './model/model.service';
import { AssistantRequestDto } from './assistant/dto/assistant-request.dto';
import { AssistantResponseDto } from './assistant/dto/assistant-response.dto';
import { ChatMessage } from './context/context.service';

@Controller()
export class AppController {
	constructor(
		// Убираем AppService отсюда
		private readonly llmService: LlmService,
		private readonly modelService: ModelService,
	) {}
	
	// Метод getHello() полностью удален
	
	@Post('assistant')
	async handleAssistant(
		@Body() requestDto: AssistantRequestDto,
	): Promise<AssistantResponseDto> {
		const { text, history = [] } = requestDto;
		
		const defaultModelId = this.modelService.getUserModel(0);
		const provider = this.llmService.getProviderForModel(defaultModelId);
		
		const formattedHistory: ChatMessage[] = history.map((item) => ({
			role: item.role === 'model' ? 'assistant' : 'user',
			content: item.text,
		}));
		
		const responseText = await provider.ask(
			formattedHistory,
			text,
			defaultModelId,
		);
		
		return { responseText };
	}
}