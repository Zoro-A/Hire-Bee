export function AppSessionLoading() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-2 bg-[#f4f6fb] text-[#161a2f] dark:bg-[#0a1022] dark:text-[#e8edff]">
      <p className="text-sm font-medium text-[#374151] dark:text-[#cbd5e1]">Loading your session…</p>
      <p className="text-xs text-[#65709a]">Please wait</p>
    </div>
  )
}
