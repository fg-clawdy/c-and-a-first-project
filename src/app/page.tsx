export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Shared Notepad</h1>
        <p className="text-gray-600 mb-8">A simple shared space for your thoughts</p>
        <div className="flex gap-4 justify-center">
          <a 
            href="/login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
          >
            Sign In
          </a>
          <a 
            href="/register" 
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors min-h-[44px] flex items-center"
          >
            Create Account
          </a>
        </div>
      </div>
    </div>
  )
}
