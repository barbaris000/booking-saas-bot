import prisma from '../config/db';

export class EmployeeRepository {
    // Добавить мастера в конкретный салон
    static async createEmployee(name: string, companyId: number) {
        return prisma.employee.create({
            data: {
                name,
                companyId,
            },
        });
    }

    //Получить всех мастеров одного салона
    static async getEmployeesByCompany(companyId: number) {
        return prisma.employee.findMany({
            where: { companyId },
        });
    }
}