'use client'

import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto">
        <div className="text-yellow-600 text-8xl mb-6">⚠️</div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator 
          if you believe this is an error.
        </p>
        
        <div className="space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-md border border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Need Access?
          </h3>
          <p className="text-sm text-yellow-700">
            Contact your system administrator to request the necessary permissions for this page.
          </p>
        </div>
      </div>
    </div>
  )
}
