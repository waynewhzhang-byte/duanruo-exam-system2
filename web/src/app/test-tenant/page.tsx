'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import { Tenant } from '@/types/tenant'

export default function TestTenantPage() {
  const [rawData, setRawData] = useState<any>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        // Test 1: Fetch raw data without schema
        console.log('Test 1: Fetching raw data...')
        const raw = await fetch('/api/v1/tenants/slug/default')
        const rawJson = await raw.json()
        console.log('Raw data:', rawJson)
        setRawData(rawJson)

        // Test 2: Parse with schema
        console.log('Test 2: Parsing with schema...')
        const parsed = Tenant.parse(rawJson)
        console.log('Parsed data:', parsed)
        setParsedData(parsed)

        // Test 3: Use apiGet with schema
        console.log('Test 3: Using apiGet with schema...')
        const apiData = await apiGet('/tenants/slug/default', { schema: Tenant })
        console.log('API data:', apiData)

      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || String(err))
      }
    }

    testAPI()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tenant API Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Raw Data:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Parsed Data:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(parsedData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

