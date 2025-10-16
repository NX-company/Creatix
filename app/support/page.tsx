import { Mail, Clock, FileText } from 'lucide-react'
import Footer from '@/components/Footer'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4 flex flex-col">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Техническая поддержка
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Мы всегда рады помочь вам с любыми вопросами
          </p>

          <div className="space-y-6">
            {/* Email */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Email поддержка</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Напишите нам, и мы ответим в течение 24 часов
                  </p>
                  <a 
                    href="mailto:useneurox@gmail.com"
                    className="text-blue-400 hover:text-blue-300 font-semibold text-lg"
                  >
                    useneurox@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Время работы */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Время работы</h3>
                  <p className="text-gray-300">Понедельник — Пятница: 9:00 — 18:00 (МСК)</p>
                  <p className="text-gray-400 text-sm mt-1">Суббота, Воскресенье: выходные</p>
                </div>
              </div>
            </div>

            {/* Документы */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-3">Юридические документы</h3>
                  <div className="space-y-2">
                    <a 
                      href="/legal/offer" 
                      target="_blank"
                      className="block text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      → Договор публичной оферты
                    </a>
                    <a 
                      href="/legal/privacy" 
                      target="_blank"
                      className="block text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      → Политика конфиденциальности
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Реквизиты */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Реквизиты ИП</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-400">Наименование:</span>
                  <span className="ml-2 text-white">ИП Иванова Елена Эдуардовна</span>
                </p>
                <p>
                  <span className="text-gray-400">ИНН:</span>
                  <span className="ml-2 text-white font-mono">505398520600</span>
                </p>
                <p>
                  <span className="text-gray-400">Банк:</span>
                  <span className="ml-2 text-white">ООО &quot;Банк Точка&quot;</span>
                </p>
                <p>
                  <span className="text-gray-400">Email:</span>
                  <a href="mailto:useneurox@gmail.com" className="ml-2 text-blue-400 hover:underline">
                    useneurox@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

