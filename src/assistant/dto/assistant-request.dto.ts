import { Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';

// Описание одного сообщения в истории
class HistoryItemDto {
	@IsEnum(['user', 'model'])
	role: 'user' | 'model';
	
	@IsString()
	@IsNotEmpty()
	text: string;
}

// Описание всего тела запроса
export class AssistantRequestDto {
	@IsString()
	@IsNotEmpty()
	text: string;
	
	@IsArray()
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => HistoryItemDto)
	history?: HistoryItemDto[];
}