import { useState, useEffect } from 'react';

// 1. Описываем типы данных, которые ждем от нашего бэкенда (TypeScript в действии!)
interface Appointment {
  id: number;
  dateTime: string;
  status: string;
  clientId: number;
  service: {
    name: string;
    price: number;
    duration: number;
  };
}

function App() {
  // 2. Локальное состояние компонента
  // Берем сегодняшнюю дату по умолчанию (формат YYYY-MM-DD)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // 3. Эффект для загрузки данных при монтировании и при изменении даты
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Делаем GET-запрос к нашему Express серверу (пока хардкодим мастера с ID 1)
        const response = await fetch(`http://localhost:3000/api/appointments?date=${date}&employeeId=1`);
        const json = await response.json();
        
        if (json.success) {
          setAppointments(json.data);
        }
      } catch (error) {
        console.error('Помилка завантаження даних:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [date]); // Массив зависимостей: хук сработает заново, если изменится переменная date

  // 4. Рендеринг интерфейса (Tailwind CSS)
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Шапка админки */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Розклад записів</h1>
          
          {/* Инпут для выбора даты (HTML5 date picker) */}
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Сетка карточек */}
        {loading ? (
          <p className="text-gray-500 text-center text-xl">Завантаження розкладу...</p>
        ) : appointments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 text-lg">На цю дату записів немає. 🌴</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((apt) => {
              // Достаем время из ISO-строки (напр. "16:00")
              const time = new Date(apt.dateTime).toLocaleTimeString('uk-UA', { 
                hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kiev'
              });
              
              // Переводим копейки обратно в гривны
              const priceGEL = apt.service.price / 100;

              return (
                <div key={apt.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-6">
                    {/* Блок со временем */}
                    <div className="text-2xl font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                      {time}
                    </div>
                    
                    {/* Информация об услуге */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{apt.service.name}</h3>
                      <p className="text-gray-500 mt-1">
                        ⏱ {apt.service.duration} хв | 💰 {priceGEL} грн
                      </p>
                    </div>
                  </div>
                  
                  {/* Статус записи */}
                  <div>
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                      {apt.status === 'CONFIRMED' ? 'Підтверджено' : apt.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;