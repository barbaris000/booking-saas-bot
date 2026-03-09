/**
 * Генерирует массив доступных строковых слотов (например, ["10:00", "10:30"])
 * @param dateStr Дата в формате YYYY-MM-DD
 * @param appointments Массив существующих записей из БД (вместе с услугами)
 * @param serviceDuration Длительность выбранной услуги в минутах
 */
export function generateAvailableSlots(
    dateStr: string,
    appointments: any[],
    serviceDuration: number
): string[] {
    const slots: string[] = [];

    // Задаем рабочий график салона (для MVP захардкодим, потом можно вынести в настройки Company)
    const workStart = 10 * 60; // 10:00 (в минутах от начала дня)
    const workEnd = 20 * 60 ;  // 20:00
    const step = 30;           // Шаг сетки - 30 минут

    // 1. Узнаем текущее время с жесткой привязкой к нашему локальному часовому поясу
    const now = new Date();
    const formatterDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kiev'});
    const todayStr = formatterDate.format(now); // Выдаст реальное 'YYYY-MM-DD' по Киеву/Львову

    let currentMins = 0;
    if (dateStr === todayStr) {
        // Если клиент смотрит слоты на "сегодня", вычисляем текущую минуту дня
        const formatterTime = new Intl.DateTimeFormat('uk-UA', {
            timeZone: 'Europe/Kiev', hour: '2-digit', minute: '2-digit', hour12: false
        });
        const [hour, minute] = formatterTime.format(now).split(':').map(Number);
        currentMins = hour * 60 + minute;
    }

    // 2. Превращаем занятые записи из базы в удобные минутные интервалы
    const busyIntervals = appointments.map(app => {
        const formatterTime = new Intl.DateTimeFormat('uk-UA', {
            timeZone: 'Europe/Kiev', hour: '2-digit', minute: '2-digit', hour12: false
        });
        const [hour, minute] = formatterTime.format(new Date(app.dateTime)).split(':').map(Number);

        const startMins = hour * 60 + minute;
        const endMins = startMins + app.service.duration; // Длительность процедуры
        return { start: startMins, end: endMins };
    });

    // 3. Идем по сетке времени от открытия до закрытия с шагом в 30 минут
    for(let time = workStart; time + serviceDuration <= workEnd; time += step) {
        // Отсекаем часы, которые уже прошли (плюс даем 15 минут запаса, чтобы мастер успел подготовиться)
        if (dateStr === todayStr && time <= (currentMins + 15)) {
            continue;
        }

        const slotEnd = time + serviceDuration;

        // Проверяем, пересикается ли наш потенциальный слот с любой уже занятой записью
        const isOverlapping = busyIntervals.some(
            interval => (time < interval.end && slotEnd > interval.start)
        );

        // Если пересечений нет — слот свободен! Добавляем его в массив.
        if (!isOverlapping) {
            const h = Math.floor(time / 60).toString().padStart(2, '0');
            const m = (time % 60).toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
        }
    }

    return slots;
}