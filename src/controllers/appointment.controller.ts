import { Request, Response } from "express";
import { AppointmentRepository } from "../repositories/appointment.repository";

export class AppointmentController {
    // Получить расписание мастера на конкретный день
    static async getDailySchedule(req: Request, res: Response): Promise<void> {
        try {
            // Фронтенд будет присылать данные в строке запроса: 
            // GET /api/appointments?date=2026-03-12&employeeId=1
            const { date, employeeId } = req.query;

            // Базовая валидация: проверяем, что фронтенд прислал нужные данные
            if (!date || !employeeId) {
                res.status(400).json({
                    success: false,
                    error: 'Не вказані обов\'язкові параметри: date та employeeId'
                });
                return;
            }

            // Вызываем наш уже готовый метод из репозитория
            const appointments = await AppointmentRepository.getAppointmentByDate(
                Number(employeeId),
                String(date)
            );

            // Отдаем успешный ответ
            res.status(200).json({
                success: true,
                data: appointments
            });
        } catch (error) {
            console.error('Помилка в контролері getDailySchedule:', error);
            res.status(500).json({
                success: false,
                error: 'Внутрішня помилка сервера'
            });
        }
    }
}