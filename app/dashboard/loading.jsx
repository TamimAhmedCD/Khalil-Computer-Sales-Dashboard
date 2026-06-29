export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-sm text-center">
        {/* Modern Corporate Linear/Bar Loader */}
        <div className="w-full max-w-[240px] h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-1/2 bg-slate-900 dark:bg-slate-50 rounded-full animate-[loading-bar_1.5s_infinite_ease-in-out]"></div>
        </div>

        {/* Corporate Status Text */}
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 mb-1.5">
          Authenticating Session
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Verifying permissions and loading your workspace...
        </p>
      </div>
    </div>
  );
}
