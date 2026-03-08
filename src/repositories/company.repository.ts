import prisma from '../config/db';

export class CompanyRepository {
    // Создать новый салон
    static async createCompany(name: string, address?: string) {
        return prisma.company.create({
            data: {
                name,
                address,
            },
        });
    }

    // Получить салон по ID вместе с его мастерами и услугами
    static async getCompanyById(id: number) {
        return prisma.company.findUnique({
            where: { id },
            include: {
                employees: true,
                services: true,
            },
        });
    }
}