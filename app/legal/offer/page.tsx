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
            <p className="text-gray-300">
              Настоящий документ является официальным предложением (публичной офертой) 
              Индивидуального предпринимателя Ивановой Елены Эдуардовны (далее — «Исполнитель») 
              для физических и юридических лиц (далее — «Заказчик») заключить договор на оказание 
              услуг по предоставлению доступа к платформе Creatix AI (далее — «Сервис»).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">2. Предмет договора</h2>
            <p className="text-gray-300 mb-2">
              2.1. Исполнитель обязуется предоставить Заказчику доступ к Сервису для создания 
              документов с использованием технологий искусственного интеллекта, а Заказчик 
              обязуется оплатить услуги в соответствии с выбранным тарифом.
            </p>
            <p className="text-gray-300">
              2.2. Услуги предоставляются в электронном виде через веб-интерфейс по адресу 
              <a href="https://aicreatix.ru" className="text-blue-400 hover:text-blue-300 ml-1">
                aicreatix.ru
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">3. Стоимость услуг</h2>
            <p className="text-gray-300 mb-2">
              3.1. Стоимость услуг указана на сайте в разделе тарифов и является окончательной.
            </p>
            <p className="text-gray-300 mb-2">
              3.2. Исполнитель вправе изменять стоимость услуг, уведомив об этом Заказчика 
              не менее чем за 7 дней до вступления изменений в силу.
            </p>
            <p className="text-gray-300">
              3.3. Оплата производится онлайн через платежные системы, доступные на сайте.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">4. Порядок оказания услуг</h2>
            <p className="text-gray-300 mb-2">
              4.1. Услуги считаются оказанными с момента предоставления Заказчику доступа к 
              функционалу в соответствии с выбранным тарифом.
            </p>
            <p className="text-gray-300">
              4.2. Исполнитель не несет ответственности за содержание создаваемых Заказчиком 
              документов и их соответствие законодательству РФ.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">5. Права и обязанности сторон</h2>
            <p className="text-gray-300 mb-2">
              5.1. Заказчик обязуется использовать Сервис исключительно в законных целях.
            </p>
            <p className="text-gray-300 mb-2">
              5.2. Исполнитель обязуется обеспечить работоспособность Сервиса 24/7, за исключением 
              времени технических работ.
            </p>
            <p className="text-gray-300">
              5.3. Исполнитель вправе приостановить доступ к Сервису в случае нарушения Заказчиком 
              условий настоящего договора.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">6. Ответственность сторон</h2>
            <p className="text-gray-300 mb-2">
              6.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему договору 
              стороны несут ответственность в соответствии с законодательством РФ.
            </p>
            <p className="text-gray-300">
              6.2. Исполнитель не несет ответственности за убытки, возникшие вследствие неправильного 
              использования Сервиса Заказчиком.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">7. Возврат средств</h2>
            <p className="text-gray-300 mb-2">
              7.1. Возврат средств за неиспользованный период подписки возможен в течение 14 дней 
              с момента оплаты при условии, что услуги не были использованы.
            </p>
            <p className="text-gray-300">
              7.2. Возврат средств осуществляется на основании письменного заявления Заказчика 
              на электронную почту поддержки.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-purple-300">8. Реквизиты Исполнителя</h2>
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
                <span className="font-semibold text-purple-300">Банк:</span> ООО "Банк Точка"
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
