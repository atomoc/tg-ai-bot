import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModelService } from './model.service';
import { ContextModule } from '../context/context.module';

@Module({
	imports: [ContextModule, ConfigModule],
	providers: [ModelService],
	exports: [ModelService],
})
export class ModelModule {}