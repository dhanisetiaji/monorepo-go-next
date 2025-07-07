import ApiDemo from '../components/ApiDemo'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Monorepo
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A modern monorepo with Go backend and Next.js frontend
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Frontend
            </h2>
            <p className="text-gray-600">
              Next.js with Tailwind CSS for beautiful, responsive UI
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Backend
            </h2>
            <p className="text-gray-600">
              Go server with high performance and scalability
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Monorepo
            </h2>
            <p className="text-gray-600">
              Turborepo for efficient development and deployment
            </p>
          </div>
        </div>

        <ApiDemo />
      </div>
    </main>
  )
}
