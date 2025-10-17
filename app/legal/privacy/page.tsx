'use client'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Политика конфиденциальности
        </h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">1. Общие положения</h2>
            <p className="text-gray-300 mb-2">
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
              персональных данных пользователей сервиса Creatix AI (далее — «Сервис»), 
              принадлежащего Индивидуальному предпринимателю Ивановой Елене Эдуардовне 
              (далее — «Оператор»).
            </p>
            <p className="text-gray-300">
              Использование Сервиса означает безоговорочное согласие пользователя с настоящей 
              Политикой и указанными в ней условиями обработки его персональных данных.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">2. Собираемые данные</h2>
            <p className="text-gray-300 mb-2">
              2.1. При регистрации в Сервисе мы собираем следующую информацию:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Адрес электронной почты</li>
              <li>Имя пользователя</li>
              <li>Информация из профиля Google (при регистрации через Google OAuth)</li>
            </ul>
            <p className="text-gray-300 mt-2">
              2.2. В процессе использования Сервиса автоматически собираются технические данные:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>IP-адрес</li>
              <li>Информация о браузере и операционной системе</li>
              <li>Дата и время обращения к Сервису</li>
              <li>Статистика использования функций Сервиса</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">3. Цели обработки данных</h2>
            <p className="text-gray-300 mb-2">Персональные данные пользователей обрабатываются в целях:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Предоставления доступа к функционалу Сервиса</li>
              <li>Идентификации пользователя</li>
              <li>Связи с пользователем для решения технических и организационных вопросов</li>
              <li>Улучшения качества работы Сервиса</li>
              <li>Проведения статистических и аналитических исследований</li>
              <li>Обработки платежей и выставления счетов</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">4. Защита данных</h2>
            <p className="text-gray-300 mb-2">
              4.1. Оператор принимает все необходимые организационные и технические меры для 
              защиты персональных данных пользователей от неправомерного или случайного доступа, 
              уничтожения, изменения, блокирования, копирования, распространения, а также от 
              иных неправомерных действий.
            </p>
            <p className="text-gray-300 mb-2">
              4.2. Все данные хранятся на защищенных серверах с использованием современных 
              технологий шифрования.
            </p>
            <p className="text-gray-300">
              4.3. Доступ к персональным данным имеют только уполномоченные сотрудники, 
              которые обязаны соблюдать конфиденциальность.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">5. Передача данных третьим лицам</h2>
            <p className="text-gray-300 mb-2">
              5.1. Персональные данные пользователей не передаются третьим лицам, за исключением 
              следующих случаев:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Пользователь дал явное согласие на передачу данных</li>
              <li>Передача необходима для обработки платежей через платежные системы</li>
              <li>Передача предусмотрена законодательством РФ</li>
            </ul>
            <p className="text-gray-300 mt-2">
              5.2. При обработке платежей используются сертифицированные платежные системы, 
              которые гарантируют безопасность транзакций.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">6. Права пользователей</h2>
            <p className="text-gray-300 mb-2">Пользователь имеет право:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Получать информацию о своих персональных данных, хранящихся у Оператора</li>
              <li>Требовать уточнения, блокирования или удаления своих персональных данных</li>
              <li>Отозвать согласие на обработку персональных данных</li>
              <li>Обжаловать действия Оператора в уполномоченном органе по защите прав субъектов персональных данных</li>
            </ul>
            <p className="text-gray-300 mt-2">
              Для реализации своих прав пользователь может направить запрос на электронную почту: 
              <a href="mailto:useneurox@gmail.com" className="text-blue-400 hover:text-blue-300 ml-1">
                useneurox@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">7. Использование cookies</h2>
            <p className="text-gray-300 mb-2">
              7.1. Сервис использует файлы cookies для обеспечения работоспособности и улучшения 
              пользовательского опыта.
            </p>
            <p className="text-gray-300 mb-2">
              7.2. Пользователь может отключить cookies в настройках своего браузера, однако это 
              может повлиять на функциональность Сервиса.
            </p>
            <p className="text-gray-300">
              7.3. Мы используем cookies для: аутентификации пользователей, сохранения настроек, 
              анализа использования Сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">8. Хранение данных</h2>
            <p className="text-gray-300 mb-2">
              8.1. Персональные данные пользователей хранятся в течение всего периода использования 
              Сервиса и в течение 3 лет после прекращения использования, если иное не предусмотрено 
              законодательством РФ.
            </p>
            <p className="text-gray-300">
              8.2. После удаления учетной записи пользователя его персональные данные удаляются 
              в течение 30 дней.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">9. Изменение Политики конфиденциальности</h2>
            <p className="text-gray-300 mb-2">
              9.1. Оператор вправе вносить изменения в настоящую Политику конфиденциальности.
            </p>
            <p className="text-gray-300">
              9.2. Новая редакция Политики вступает в силу с момента ее размещения на сайте, 
              если иное не предусмотрено новой редакцией.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">10. Контактная информация</h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Оператор:</span>{' '}
                Индивидуальный предприниматель Иванова Елена Эдуардовна
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">ИНН:</span> 505398520600
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Email:</span>{' '}
                <a href="mailto:useneurox@gmail.com" className="text-blue-400 hover:text-blue-300">
                  useneurox@gmail.com
                </a>
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Адрес:</span> aicreatix.ru
              </p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-purple-500/30 text-center">
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-purple-500/50"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
