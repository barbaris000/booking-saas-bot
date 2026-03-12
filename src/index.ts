import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { startBot } from './bot';
import { ServiceRepository } from './repositories/service.repository';
import appointmentRoutes from './routes/appointment.routes';

// Инициализируем окружение
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Мидлвары
app.use(cors());
app.use(express.json()); // Чтобы сервер понимал JSON в теле запроса

// --- Подключаем роутер к Express ---
// Теперь все запросы, начинающиеся с /api/appointments, пойдут в наш файл роутов
app.use('/api/appointments', appointmentRoutes);

// Тестовый роут
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'SaaS Booking API is running!' });
});

// Временный блок для создания услуги (потом удалим)
const initServices = async () => {
    try {
        const services = await ServiceRepository.getServicesByCompany(1);
        if (services.length === 0) {
            console.log('Добавляем тестовую услугу...');
            // Цена 50000 копеек = 500 грн. Длительность 60 минут.
            await ServiceRepository.createService('💈 Чоловіча стрижка', 50000, 60, 1);
            await ServiceRepository.createService('🧔 Корекція бороди', 30000, 30, 1);
        }
    } catch (e) {
        console.log('Ошибка при создании услуг:', e);
    }
};

// Запуск сервера
app.listen(PORT, async () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);

    await initServices(); // Запускаем проверку при старте
    
    // Запускаем бота параллельно с сервером
    startBot();
});