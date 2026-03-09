import prisma from '../config/db';

export class ServiceRepository {
    // Добавляем новую услугу
    static async createService(name: string, price: number, duration: number, companyId: number) {
        return prisma.service.create({
            data: {
                name,
                price,
                duration, // в минутах (например 60)
                companyId,
            },
        });
    }

    // Получаем список услуг салона
    static async getServicesByCompany(companyId: number) {
        return prisma.service.findMany({
            where: { companyId },
        });
    }

    // Получаем конкретную услугу по ID
    static async getServiceById(id:number) {
        return prisma.service.findUnique({
            where: { id },
        });
    }
}