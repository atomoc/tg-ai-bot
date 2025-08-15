import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { getBotToken } from 'nestjs-telegraf'; // 👈 1. Импортируйте getBotToken

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');
  
  // --- НАЧАЛО БЛОКА ДЛЯ ДОБАВЛЕНИЯ ---
  // Получаем экземпляр бота из контекста приложения
  const bot = app.get(getBotToken());
  
  // Устанавливаем команды, которые будут видны в меню
  await bot.telegram.setMyCommands([
    { command: 'start', description: '🚀 Запустить бота / Помощь' },
    { command: 'model', description: '🧠 Выбрать AI-модель' },
    { command: 'image', description: '🎨 Создать изображение' },
  ]);
  // --- КОНЕЦ БЛОКА ДЛЯ ДОБАВЛЕНИЯ ---
  
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();