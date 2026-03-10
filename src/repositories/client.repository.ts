import prisma from '../config/db';

export class ClientRepository {
    // Ищем клиента по Telegram ID
    static async getClientByTelegramId(telegramId: bigint) {
        return prisma.client.findUnique({
            where: { telegramId },
        });
    }

    // Создаем или обновляем клиента (upsert)
    static async upsertClient(telegramId: bigint, name: string, phone?: string) {
        return prisma.client.upsert({
            where: { telegramId },
            update: { name, phone },
            create: { telegramId, name, phone },
        });
    }
}