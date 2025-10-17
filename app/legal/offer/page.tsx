'use client'

export default function OfferAgreement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Договор публичной оферты
        </h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">1. Общие положения</h2>
            <p className="text-gray-300 mb-2">
              Настоящий документ является официальной публичной офертой Индивидуального предпринимателя 
              Ивановой Елены Эдуардовны (ИНН: 505398520600), далее именуемой «Исполнитель», и содержит 
              все существенные условия предоставления услуг по использованию веб-сервиса для генерации 
              документов с использованием искусственного интеллекта (далее — «Сервис») физическим и 
              юридическим лицам (далее — «Заказчик»).
            </p>
            <p className="text-gray-300">
              В соответствии с пунктом 2 статьи 437 Гражданского кодекса Российской Федерации (ГК РФ), 
              в случае принятия изложенных ниже условий и оплаты услуг лицом, в отношении которого 
              сделана данная оферта, такое лицо считается заключившим с Исполнителем договор на условиях, 
              изложенных в настоящей оферте.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">2. Предмет договора</h2>
            <p className="text-gray-300 mb-2">
              2.1. Исполнитель обязуется предоставить Заказчику доступ к Сервису для автоматизированной 
              генерации документов (презентаций, коммерческих предложений, резюме и других документов) 
              с использованием технологий искусственного интеллекта, а Заказчик обязуется оплатить 
              услуги в порядке и на условиях, предусмотренных настоящим договором.
            </p>
            <p className="text-gray-300">
              2.2. Сервис предоставляется на основе выбранного Заказчиком тарифного плана:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mt-2">
              <li>FREE — бесплатный тариф (30 генераций в месяц)</li>
              <li>ADVANCED — платный тариф (100 генераций в месяц с AI-изображениями)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">3. Стоимость услуг и порядок оплаты</h2>
            <p className="text-gray-300 mb-2">
              3.1. Стоимость услуг составляет:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mb-2">
              <li>Тариф FREE: 0₽ (бесплатно)</li>
              <li>Тариф ADVANCED: 1000₽ в месяц</li>
              <li>Дополнительный пакет генераций: 300₽ за 30 генераций (только для тарифа ADVANCED)</li>
            </ul>
            <p className="text-gray-300 mb-2">
              3.2. Оплата производится Заказчиком онлайн на сайте Сервиса через платежную систему. 
              Моментом заключения договора является полная оплата услуг Заказчиком.
            </p>
            <p className="text-gray-300">
              3.3. Все цены указаны в российских рублях и включают НДС в размере, установленном 
              законодательством РФ (Исполнитель применяет упрощенную систему налогообложения, НДС не облагается).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">4. Условия предоставления услуг</h2>
            <p className="text-gray-300 mb-2">
              4.1. Тарифный план действует в течение 30 календарных дней с момента оплаты.
            </p>
            <p className="text-gray-300 mb-2">
              4.2. Лимит генераций обновляется 1-го числа каждого месяца для активных подписок.
            </p>
            <p className="text-gray-300 mb-2">
              4.3. Неиспользованные генерации не переносятся на следующий месяц.
            </p>
            <p className="text-gray-300">
              4.4. Исполнитель обязуется обеспечивать доступность Сервиса не менее 95% времени в месяц, 
              за исключением времени технических работ.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">5. Права и обязанности сторон</h2>
            <p className="text-gray-300 mb-2">
              5.1. Исполнитель обязуется:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mb-2">
              <li>Предоставить доступ к Сервису в течение 24 часов с момента оплаты</li>
              <li>Обеспечивать работоспособность Сервиса</li>
              <li>Не разглашать персональные данные Заказчика третьим лицам</li>
              <li>Оказывать техническую поддержку через email: useneurox@gmail.com</li>
            </ul>
            <p className="text-gray-300 mb-2">
              5.2. Заказчик обязуется:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Своевременно оплачивать услуги Исполнителя</li>
              <li>Не использовать Сервис для нарушения законодательства РФ</li>
              <li>Не передавать доступ к своей учетной записи третьим лицам</li>
              <li>Самостоятельно проверять сгенерированные документы на соответствие требованиям</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">6. Возврат средств</h2>
            <p className="text-gray-300 mb-2">
              6.1. Заказчик вправе отказаться от услуг и потребовать возврат денежных средств в течение 
              7 календарных дней с момента оплаты при условии использования не более 10% от лимита 
              генераций (10 генераций для тарифа ADVANCED).
            </p>
            <p className="text-gray-300 mb-2">
              6.2. Возврат производится на банковскую карту или счет, с которого была произведена оплата, 
              в течение 10 рабочих дней с момента получения письменного заявления на email: useneurox@gmail.com
            </p>
            <p className="text-gray-300">
              6.3. При превышении лимита 10% использованных генераций возврат денежных средств не производится.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">7. Ответственность сторон</h2>
            <p className="text-gray-300 mb-2">
              7.1. Исполнитель не несет ответственности за качество и корректность содержания документов, 
              сгенерированных с использованием искусственного интеллекта. Заказчик обязан самостоятельно 
              проверять и корректировать результаты работы Сервиса.
            </p>
            <p className="text-gray-300">
              7.2. Исполнитель не несет ответственности за убытки, возникшие в результате использования 
              или невозможности использования Сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">8. Интеллектуальная собственность</h2>
            <p className="text-gray-300 mb-2">
              8.1. Все права на Сервис принадлежат Исполнителю.
            </p>
            <p className="text-gray-300">
              8.2. Документы, созданные Заказчиком с использованием Сервиса, принадлежат Заказчику.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">9. Изменение и расторжение договора</h2>
            <p className="text-gray-300 mb-2">
              9.1. Исполнитель вправе в одностороннем порядке изменять условия настоящей оферты, 
              размещая новую редакцию на сайте Сервиса.
            </p>
            <p className="text-gray-300">
              9.2. Заказчик вправе в любой момент прекратить использование Сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">10. Реквизиты Исполнителя</h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Наименование:</span>{' '}
                Индивидуальный предприниматель Иванова Елена Эдуардовна
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">ИНН:</span> 505398520600
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Расчётный счёт:</span> 40802810820000737449
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Банк:</span> ООО &quot;Банк Точка&quot;
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">БИК:</span> 044525104
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Корр. счёт:</span> 30101810745374525104
              </p>
              <p className="text-gray-300">
                <span className="font-semibold text-purple-300">Email поддержки:</span>{' '}
                <a href="mailto:useneurox@gmail.com" className="text-blue-400 hover:text-blue-300">
                  useneurox@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">9. Заключительные положения</h2>
            <p className="text-gray-300 mb-2">
              9.1. Настоящий договор вступает в силу с момента акцепта Заказчиком настоящей оферты 
              (оплаты услуг) и действует до полного исполнения сторонами своих обязательств.
            </p>
            <p className="text-gray-300">
              9.2. Акцептом настоящей оферты является совершение Заказчиком действий по оплате услуг.
            </p>
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
