import { BrandMark } from '../ui/Brand'
import { Button } from '../ui/Button'

type WorkspaceHeaderProps = {
  onLogout: () => Promise<void>
}

export function WorkspaceHeader({ onLogout }: WorkspaceHeaderProps) {
  return (
    <header className="flex h-[78px] items-center justify-between bg-brand px-[18px] text-[#eff5ef] min-[521px]:px-[clamp(24px,5vw,72px)]">
      <div className="flex items-center gap-3">
        <BrandMark />
        <div className="grid gap-0.5">
          <strong className="text-[0.9rem]">Job Tracker</strong>
          <span className="text-[0.7rem] text-[#eff5ef]/55">
            GraphQL workspace
          </span>
        </div>
      </div>
      <Button variant="text" onClick={() => void onLogout()}>
        Sign out
      </Button>
    </header>
  )
}
