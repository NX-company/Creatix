export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-3">
          <a href="/legal/offer" target="_blank" className="hover:text-white transition">
            Договор оферты
          </a>
          <a href="/legal/privacy" target="_blank" className="hover:text-white transition">
            Политика конфиденциальности
          </a>
          <a href="/support" className="hover:text-white transition">
            Поддержка
          </a>
          <a href="mailto:useneurox@gmail.com" className="hover:text-white transition">
            useneurox@gmail.com
          </a>
        </div>
        <p className="text-center text-xs text-gray-500">
          ИП Иванова Елена Эдуардовна | ИНН: 505398520600
        </p>
      </div>
    </footer>
  )
}

