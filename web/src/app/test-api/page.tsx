'use client'

import { useEffect, useState } from 'react'
import { useTenants } from '@/lib/api-hooks'

export default function TestAPIPage() {
  const [rawData, setRawData] = useState<any>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [cookies, setCookies] = useState<string>('')

  const { data: tenantsData, isLoading, error } = useTenants({
    page: 0,
    size: 100,
    activeOnly: false
  })

  useEffect(() => {
    // Get cookies
    setCookies(document.cookie)

    // Test direct API call
    fetch('/api/v1/tenants?page=0&size=100&activeOnly=false', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(async res => {
        const text = await res.text()
        console.log('Response status:', res.status)
        console.log('Response text:', text)
        try {
          const data = JSON.parse(text)
          setRawData(data)
        } catch (e) {
          setRawData({ error: 'Failed to parse JSON', text })
        }
      })
      .catch(err => {
        console.error('Direct API call failed:', err)
        setFetchError(err.message)
      })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>

      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Cookies</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {cookies || 'No cookies found'}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Using useTenants Hook</h2>
          <p className="mb-2">Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p className="mb-2">Error: {error ? String(error) : 'None'}</p>
          <p className="mb-2">Data: {tenantsData ? 'Received' : 'None'}</p>
          <p className="mb-2">Content Length: {tenantsData?.content?.length || 0}</p>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {JSON.stringify(tenantsData, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Direct Fetch API Call</h2>
          {fetchError && (
            <p className="text-red-600 mb-2">Fetch Error: {fetchError}</p>
          )}
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

