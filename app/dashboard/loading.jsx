export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="text-center p-8 max-w-sm w-full">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            Logo
          </div>
        </div>

        {/* Modern Loader */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Outer pulsing ring */}
          <div className="absolute animate-ping inline-flex h-12 w-12 rounded-full bg-indigo-400 opacity-20"></div>
          {/* Inner spinning wheel */}
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>

        {/* Status Text */}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Securing your session
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Preparing your personalized dashboard...
        </p>
      </div>
    </div>
  );
}
