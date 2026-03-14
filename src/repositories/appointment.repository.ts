import prisma from '../config/db';

export class AppointmentRepository {
    // Получаем все активные записи мастера на конкретный день
    static async getAppointmentByDate(employeeId: number, dateStr: string) {
        // dateStr приходит из нашей кнопки в формате 'YYYY-MM-DD'
        // Формируем границы суток по UTC для поиска в базе
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        return prisma.appointment.findMany({
            where: {
                employeeId,
                dateTime: {
                    gte: startOfDay, // Больше или равно началу дня
                    lte: endOfDay,   // Меньше или равно концу дня
                },
                status: {
                    not: 'CANCELLED' // Отмененные клиентом записи снова становятся свободными слотами
                }
            },
            include: {
                service: true,  // Магия Prisma: автоматически подтягиваем данные услуги, чтобы знать её длительность (duration)
                client: true
            }
        });
    }

    // Создаем новую запись
    static async createAppointment(
        dateTime: Date,
        clientId: number,
        employeeId: number,
        serviceId: number,
        companyId: number
    ) {
        return prisma.appointment.create({
            data: {
                dateTime,
                clientId,
                employeeId,
                serviceId,
                companyId,
                status: 'CONFIRMED' // В MVP считаем, что запись сразу подтверждена
            }
        });
    }
}