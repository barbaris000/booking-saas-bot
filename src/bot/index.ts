import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';
import { EmployeeRepository } from '../repositories/employee.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { generateAvailableSlots } from '../utils/time.util';


dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');
}

// Инициализируем бота
export const bot = new Bot(token);

// --- ХЕНДЛЕРЫ КОМАНД ---

// Обработка команды /start
bot.command('start', async (ctx) => {
    // Создаем клаву с кнопками под сообщением
    const keyboard = new InlineKeyboard()
    .text('📅 Записатись', 'action_book').row()
    .text('ℹ️ Інформація про нас', 'action_info');

    // Отправляем приветственное сообщение
    await ctx.reply(
        `Вітаємо! 👋\nТут можна швидко записатися на процедуру та керувати своїми записами.\n\nОберіть дію 👇`,
        { reply_markup: keyboard }
    );
});

// --- ХЕНДЛЕРЫ КНОПОК (Чистая архитектруа) ---

// 1. Обработка кнопки "инфо"
bot.callbackQuery('action_info', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('💈 Барбершоп "Barbershop"\n📍 Адреса: вул. Центральна, 1');
});

// 2. Обработка кнопки "Записатись"
bot.callbackQuery('action_book', async (ctx) => {
    await ctx.answerCallbackQuery();

    try {
        // Для MVP мы предполагаем, что этот бот привязан к компании с ID 1
        const COMPANY_ID = 1;

        // Делаем запрос в базу данных!
        const employees = await EmployeeRepository.getEmployeesByCompany(COMPANY_ID);

        if (employees.length === 0) {
            return ctx.reply('На жаль, наразі немає доступних майстрів. 😔');
        }

        // Динамически собираем клавиатуру на основе данных из БД
        const mastersKeyboard = new InlineKeyboard();

        employees.forEach((emp) => {
            // callback_data будет уникальной для каждого мастера: 'master_1', 'master_2' и т.д.
            mastersKeyboard.text(`💈 ${emp.name}`, `master_${emp.id}`).row();
        });

        // Добавляем кнопку возврата (важно для UX!)
        mastersKeyboard.text('🔙 Назад', 'action_back').row();
    
        await ctx.reply('Оберіть майстра:', { reply_markup: mastersKeyboard });

    } catch (error) {
        console.error('Помилка при отриманні майстрів:', error);
        await ctx.reply('Сталася помилка на сервері. Спробуйте пізніше.');
    }
});

// 3. Обработка выбора КОНКРЕТНОГО мастера
// Используем регулярное выражение, чтобы поймать любой клик, начинающийся на master_
bot.callbackQuery(/master_(\d+)/, async (ctx) => {
    await ctx.answerCallbackQuery();

    // ctx.match[1] содержит то, что попало в скобки (\d+) — то есть ID мастера
    const masterId = ctx.match[1];

    try {
        const COMPANY_ID = 1;
        // Достаем услуги из базы
        const services = await ServiceRepository.getServicesByCompany(COMPANY_ID);

        if (services.length === 0) {
            return ctx.editMessageText('На жаль, список послуг наразі порожній.');
        }

        const servicesKeyboard = new InlineKeyboard();

        services.forEach((service) => {
            // Форматируем цену (переводим из копеек в гривны)
            const priceGEL = service.price / 100;
            // Данные кнопки: 'service_Услуга_Мастер'
            servicesKeyboard.text(
                `${service.name} — ${priceGEL} грн ⏱ ${service.duration} хв`,
                `service_${service.id}_${masterId}`
            ).row();
        });

        servicesKeyboard.text('🔙 Назад до майстрів', 'action_book').row();

        // Меняем сообщение, чтобы показать услуги
        await ctx.editMessageText('Чудовий вибір! Тепер оберіть послугу:', {
            reply_markup: servicesKeyboard
        });
    } catch (error) {
        console.error('Помилка при отриманні послуг:', error);
        await ctx.reply('Сталася помилка на сервері.');
    }
});

// 4. Обработка выбора УСЛУГИ -> Показываем календарь
// Ловим паттерн: service_{serviceId}_{masterId}
bot.callbackQuery(/service_(\d+)_(\d+)/, async (ctx) => {
    await ctx.answerCallbackQuery();

    const serviceId = ctx.match[1];
    const masterId = ctx.match[2];

    const datesKeyboard = new InlineKeyboard();

    // Берем текущую дату
    const today = new Date();

    // Генерируем кнопки на 7 дней вперед
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Форматируем для красивого отображения клиенту (например: "Пн, 09.03")
        // Используем 'uk-UA' локаль для украинских названий дней недели
        const displayDate = date.toLocaleDateString('uk-UA', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
        });

        // Форматируем для технического сохранения в базу (формат YYYY-MM-DD)
        const dbDate = date.toISOString().split('T')[0];

        // Формируем payload: date_{YYYY-MM-DD}_{serviceId}_{masterId}
        const callbackData = `date_${dbDate}_${serviceId}_${masterId}`;

        datesKeyboard.text(`📅 ${displayDate}`, callbackData);

        // Делаем по 2 даты в один ряд, чтобы кнопки не были слишком узкими на экране телефона
        if (i % 2 !== 0) {
            datesKeyboard.row();
        }
    }

    // Если 7 кнопок (нечетное число), принудительно закрываем ряд перед кнопкой "Назад"
    datesKeyboard.row();

    // Кнопка возврата ведет обратно к списку услуг конкретного мастера!
    datesKeyboard.text('🔙 Назад до послуг', `master_${masterId}`).row();

    await ctx.editMessageText('Чудово! Оберіть зручну дату:', {
        reply_markup: datesKeyboard
    });
});

// 5.Обработка выбора ДАТЫ -> Показываем свободные часы
// Ловим паттерн: date_{YYYY-MM-DD}_{serviceId}_{masterId}
bot.callbackQuery(/date_(.+)_(\d+)_(\d+)/, async (ctx) => {
    await ctx.answerCallbackQuery();

    const dateStr = ctx.match[1]; // Наша дата в формате YYYY-MM-DD
    const serviceId = parseInt(ctx.match[2], 10);
    const masterId = parseInt(ctx.match[3], 10);

    try {
        // 1. Достаем саму услугу, чтобы узнать её длительность
        const service = await ServiceRepository.getServiceById(serviceId);
        if (!service) {
            return ctx.editMessageText('Помилка: послугу не знайдено.');
        }

        // 2. Достаем все занятые записи мастера на этот день
        const appointments = await AppointmentRepository.getAppointmentByDate(masterId, dateStr);

        // 3. Генерируем массив свободных слотов (магия из нашего time.util.ts)
        const slots = generateAvailableSlots(dateStr, appointments, service.duration);

        // Если все слоты заняты или день уже прошел
        if (slots.length === 0) {
            const backKeyboard = new InlineKeyboard()
                .text('🔙 Вибрати іншу дату', `service_${serviceId}_${masterId}`);
            
            return ctx.editMessageText('На жаль, на цю дату більше немає вільних місць. 😔', {
                reply_markup: backKeyboard
            });
        }

        // 4. Рисуем клавиатуру со временем
        const timeKeyboard = new InlineKeyboard();

        slots.forEach((slot, index) => {
            // payload: t_{HH:MM}_{YYYY-MM-DD}_{serviceId}_{masterId}
            const callbackData = `t_${slot}_${dateStr}_${serviceId}_${masterId}`;
            timeKeyboard.text(`🕒 ${slot}`, callbackData);

            // Группируем по 3 кнопки в ряд для красоты на экране мобильного
            if ((index + 1) % 3 === 0) {
                timeKeyboard.row();
            }
        });

        // Закрываем ряд, если последняя строка не полная
        if (slots.length % 3 !== 0) {
            timeKeyboard.row();
        }

        // Кнопка назад ведет к выбору даты
        timeKeyboard.text('🔙 Назад до календаря', `service_${serviceId}_${masterId}`).row();

        // Красивое форматирование выбранной даты
        const displayDate = new Date(dateStr).toLocaleDateString('uk-UA', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        await ctx.editMessageText(`Ви обрали: <b>${displayDate}</b>\nОберіть вільний час:`, {
            reply_markup: timeKeyboard,
            parse_mode: 'HTML' // Разрешаем использовать HTML теги вроде <b> для жирного текста
        });

    } catch (error) {
        console.error('Помилка при генерації слотів', error);
        await ctx.reply('Сталася помилка на сервері при завантаженні розкладу.');
    }
});

// Обработка кнопки "назад"
bot.callbackQuery('action_back', async (ctx) => {
    await ctx.answerCallbackQuery();
    // Просто заново вызываем стартовое меню
    const keyboard = new InlineKeyboard()
    .text('📅 Записатись', 'action_book').row()
    .text('ℹ️ Інформація про нас', 'action_info');

    // Тут используем editMessageText, чтобы не плодить новые сообщения, а изменять текущее
    await ctx.editMessageText(
        `Привіт! 👋\nТут можна швидко записатися на процедуру та керувати своїми записами.\n\nОбери дію 👇`,
        { reply_markup: keyboard }
    );
});

export const startBot = () => {
    bot.start({
        onStart: (botInfo) => {
            console.log(`🤖 Telegram Bot @${botInfo.username} is running...`);
        },
    });
};