'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function DebugTrialPage() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const checkUser = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/debug/check-user')
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch user data')
      } else {
        setUserData(data)
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🐛 Debug Trial Counter</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">NextAuth Session</h2>
          {session ? (
            <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(session, null, 2)}
            </pre>
          ) : (
            <p className="text-red-400">Not authenticated</p>
          )}
        </div>

        <button
          onClick={checkUser}
          disabled={loading || !session}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded font-semibold mb-6"
        >
          {loading ? 'Loading...' : 'Check Database User'}
        </button>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {userData && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Database User Data</h2>
            
            <div className="bg-gray-900 p-4 rounded mb-4">
              <h3 className="font-semibold mb-2">User Info:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(userData.user, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-900 p-4 rounded">
              <h3 className="font-semibold mb-2">Calculated Values:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(userData.calculated, null, 2)}
              </pre>
            </div>

            <div className="mt-4 p-4 rounded bg-blue-900/30 border border-blue-500">
              <h3 className="font-semibold mb-2">✅ Status:</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <span className="text-gray-400">Trial Active:</span>{' '}
                  <span className={userData.calculated.isInTrial ? 'text-green-400' : 'text-red-400'}>
                    {userData.calculated.isInTrial ? 'YES' : 'NO'}
                  </span>
                </li>
                <li>
                  <span className="text-gray-400">Trial Days Left:</span>{' '}
                  <span className="text-blue-400">{userData.calculated.trialDaysLeft}</span>
                </li>
                <li>
                  <span className="text-gray-400">Trial Generations Used:</span>{' '}
                  <span className="text-yellow-400">{userData.user.trialGenerations}/30</span>
                </li>
                <li>
                  <span className="text-gray-400">Trial Generations Left:</span>{' '}
                  <span className="text-green-400">{userData.calculated.trialGenerationsLeft}</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

