import Link from 'next/link'

export default function ForbiddenAccess() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-600">403</h2>
        <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
          Forbidden Access
        </h1>
        <p className="mt-6 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
          You do not have permission to access this service. If you believe this is a mistake, please contact the barangay office.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">

        </div>
      </div>
    </main>
  )
}
