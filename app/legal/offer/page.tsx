import Footer from '@/components/Footer'

export default function OfferPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Договор публичной оферты
          </h1>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Общие положения</h2>
              <p>
                Настоящий документ является официальной публичной офертой <strong className="text-white">Индивидуального предпринимателя Ивановой Елены Эдуардовны</strong> (ИНН: 505398520600), далее именуемой «Исполнитель», и содержит все существенные условия предоставления услуг по использованию веб-сервиса для генерации документов с использованием искусственного интеллекта (далее — «Сервис») физическим и юридическим лицам (далее — «Заказчик»).
              </p>
              <p className="mt-3">
                В соответствии с пунктом 2 статьи 437 Гражданского кодекса Российской Федерации (ГК РФ), в случае принятия изложенных ниже условий и оплаты услуг лицом, в отношении которого сделана данная оферта, такое лицо считается заключившим с Исполнителем договор на условиях, изложенных в настоящей оферте.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Предмет договора</h2>
              <p>
                2.1. Исполнитель обязуется предоставить Заказчику доступ к Сервису для автоматизированной генерации документов (презентаций, коммерческих предложений, резюме и других документов) с использованием технологий искусственного интеллекта, а Заказчик обязуется оплатить услуги в порядке и на условиях, предусмотренных настоящим договором.
              </p>
              <p className="mt-3">
                2.2. Сервис предоставляется на основе выбранного Заказчиком тарифного плана:
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li><strong className="text-blue-400">FREE</strong> — бесплатный тариф (30 генераций в месяц)</li>
                <li><strong className="text-purple-400">ADVANCED</strong> — платный тариф (100 генераций в месяц с AI-изображениями)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Стоимость услуг и порядок оплаты</h2>
              <p>3.1. Стоимость услуг составляет:</p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-2">
                <li>Тариф <strong className="text-blue-400">FREE</strong>: <strong className="text-white">0₽</strong> (бесплатно)</li>
                <li>Тариф <strong className="text-purple-400">ADVANCED</strong>: <strong className="text-white">1000₽</strong> в месяц</li>
                <li>Дополнительный пакет генераций: <strong className="text-white">300₽</strong> за 30 генераций (только для тарифа ADVANCED)</li>
              </ul>
              <p className="mt-3">
                3.2. Оплата производится Заказчиком онлайн на сайте Сервиса через платежную систему. Моментом заключения договора является полная оплата услуг Заказчиком.
              </p>
              <p className="mt-3">
                3.3. Все цены указаны в российских рублях и включают НДС в размере, установленном законодательством РФ (Исполнитель применяет упрощенную систему налогообложения, НДС не облагается).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Условия предоставления услуг</h2>
              <p>4.1. Тарифный план действует в течение 30 календарных дней с момента оплаты.</p>
              <p className="mt-3">
                4.2. Лимит генераций обновляется 1-го числа каждого месяца для активных подписок.
              </p>
              <p className="mt-3">
                4.3. Неиспользованные генерации не переносятся на следующий месяц.
              </p>
              <p className="mt-3">
                4.4. Исполнитель обязуется обеспечивать доступность Сервиса не менее 95% времени в месяц, за исключением времени технических работ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Права и обязанности сторон</h2>
              <p className="font-semibold text-white mb-2">5.1. Исполнитель обязуется:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Предоставить доступ к Сервису в течение 24 часов с момента оплаты</li>
                <li>Обеспечивать работоспособность Сервиса</li>
                <li>Не разглашать персональные данные Заказчика третьим лицам</li>
                <li>Оказывать техническую поддержку через email: <a href="mailto:useneurox@gmail.com" className="text-blue-400 hover:underline">useneurox@gmail.com</a></li>
              </ul>
              <p className="font-semibold text-white mt-4 mb-2">5.2. Заказчик обязуется:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Своевременно оплачивать услуги Исполнителя</li>
                <li>Не использовать Сервис для нарушения законодательства РФ</li>
                <li>Не передавать доступ к своей учетной записи третьим лицам</li>
                <li>Самостоятельно проверять сгенерированные документы на соответствие требованиям</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Возврат средств</h2>
              <p>
                6.1. Заказчик вправе отказаться от услуг и потребовать возврат денежных средств в течение <strong className="text-white">7 календарных дней</strong> с момента оплаты при условии использования не более <strong className="text-white">10% от лимита генераций</strong> (10 генераций для тарифа ADVANCED).
              </p>
              <p className="mt-3">
                6.2. Возврат производится на банковскую карту или счет, с которого была произведена оплата, в течение 10 рабочих дней с момента получения письменного заявления на email: <a href="mailto:useneurox@gmail.com" className="text-blue-400 hover:underline">useneurox@gmail.com</a>
              </p>
              <p className="mt-3">
                6.3. При превышении лимита 10% использованных генераций возврат денежных средств не производится.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Ответственность сторон</h2>
              <p>
                7.1. Исполнитель не несет ответственности за качество и корректность содержания документов, сгенерированных с использованием искусственного интеллекта. Заказчик обязан самостоятельно проверять и корректировать результаты работы Сервиса.
              </p>
              <p className="mt-3">
                7.2. Исполнитель не несет ответственности за убытки, возникшие в результате использования или невозможности использования Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Интеллектуальная собственность</h2>
              <p>
                8.1. Все права на Сервис принадлежат Исполнителю.
              </p>
              <p className="mt-3">
                8.2. Документы, созданные Заказчиком с использованием Сервиса, принадлежат Заказчику.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Изменение и расторжение договора</h2>
              <p>
                9.1. Исполнитель вправе в одностороннем порядке изменять условия настоящей оферты, размещая новую редакцию на сайте Сервиса.
              </p>
              <p className="mt-3">
                9.2. Заказчик вправе в любой момент прекратить использование Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Реквизиты Исполнителя</h2>
              <div className="bg-gray-800 rounded-lg p-6 mt-4 border border-gray-700">
                <p className="font-bold text-white mb-3">Индивидуальный предприниматель Иванова Елена Эдуардовна</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">ИНН:</span>
                    <span className="ml-2 text-white font-mono">505398520600</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Расчётный счёт:</span>
                    <span className="ml-2 text-white font-mono">40802810820000737449</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Банк:</span>
                    <span className="ml-2 text-white">ООО "Банк Точка"</span>
                  </div>
                  <div>
                    <span className="text-gray-400">БИК:</span>
                    <span className="ml-2 text-white font-mono">044525104</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-400">Корр. счёт:</span>
                    <span className="ml-2 text-white font-mono">30101810745374525104</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-400">Email:</span>
                    <a href="mailto:useneurox@gmail.com" className="ml-2 text-blue-400 hover:underline">useneurox@gmail.com</a>
                  </div>
                </div>
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

