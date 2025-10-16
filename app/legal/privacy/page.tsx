import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Политика конфиденциальности
          </h1>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Общие положения</h2>
              <p>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса, принадлежащего <strong className="text-white">Индивидуальному предпринимателю Ивановой Елене Эдуардовне</strong> (ИНН: 505398520600), далее именуемой «Оператор».
              </p>
              <p className="mt-3">
                Политика разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Какие данные мы собираем</h2>
              <p>При регистрации и использовании Сервиса мы собираем следующую информацию:</p>
              <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                <li>Email адрес</li>
                <li>Имя пользователя</li>
                <li>Данные о платежах (обрабатываются через защищенные платежные системы)</li>
                <li>Информацию о созданных документах (хранится локально в браузере)</li>
                <li>Техническую информацию (IP-адрес, тип браузера, cookies)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Цели обработки данных</h2>
              <p>Мы используем ваши данные для:</p>
              <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                <li>Предоставления доступа к Сервису</li>
                <li>Обработки платежей и выставления счетов</li>
                <li>Отправки уведомлений о статусе услуг</li>
                <li>Технической поддержки пользователей</li>
                <li>Улучшения качества Сервиса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Защита данных</h2>
              <p>
                4.1. Мы используем современные технологии шифрования (SSL/TLS) для защиты передаваемых данных.
              </p>
              <p className="mt-3">
                4.2. Доступ к персональным данным имеют только уполномоченные сотрудники Оператора.
              </p>
              <p className="mt-3">
                4.3. Мы не передаем ваши данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законодательством РФ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Ваши права</h2>
              <p>Вы имеете право:</p>
              <ul className="list-disc list-inside mt-3 ml-4 space-y-2">
                <li>Получать информацию о ваших персональных данных</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления ваших данных</li>
                <li>Отозвать согласие на обработку данных</li>
              </ul>
              <p className="mt-4">
                Для реализации своих прав напишите на email: <a href="mailto:useneurox@gmail.com" className="text-blue-400 hover:underline">useneurox@gmail.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Cookies</h2>
              <p>
                Мы используем cookies для улучшения работы Сервиса, сохранения настроек и анализа использования. Вы можете отключить cookies в настройках браузера, но это может ограничить функциональность Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Изменения политики</h2>
              <p>
                Мы вправе изменять настоящую Политику конфиденциальности. Новая редакция вступает в силу с момента размещения на сайте.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Контактная информация</h2>
              <div className="bg-gray-800 rounded-lg p-6 mt-4 border border-gray-700">
                <p className="font-bold text-white mb-3">ИП Иванова Елена Эдуардовна</p>
                <p className="text-sm">
                  <span className="text-gray-400">ИНН:</span>
                  <span className="ml-2 text-white font-mono">505398520600</span>
                </p>
                <p className="text-sm mt-2">
                  <span className="text-gray-400">Email:</span>
                  <a href="mailto:useneurox@gmail.com" className="ml-2 text-blue-400 hover:underline">useneurox@gmail.com</a>
                </p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
              <p>Редакция от 16 октября 2024 года</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

