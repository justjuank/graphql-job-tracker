import { Badge } from '../ui/Badge'
import { Eyebrow } from '../ui/Typography'
import { cn } from '../ui/cn'

type StatCardProps = {
  accent?: boolean
  label: string
  value: number
}

function StatCard({ accent = false, label, value }: StatCardProps) {
  return (
    <article
      className={cn(
        'flex min-h-[140px] flex-col justify-between border p-6 min-[851px]:min-h-[170px]',
        accent
          ? 'border-brand bg-brand text-[#f3f7f1]'
          : 'border-line bg-white/50 text-ink',
      )}
    >
      <span className={cn('text-[0.78rem] font-bold', !accent && 'text-muted')}>
        {label}
      </span>
      <strong className="font-display text-[3.4rem] font-medium">{value}</strong>
    </article>
  )
}

type DashboardSummaryProps = {
  email: string
  interviewing: number
  offers: number
  role: string
  total: number
}

export function DashboardSummary({
  email,
  interviewing,
  offers,
  role,
  total,
}: DashboardSummaryProps) {
  return (
    <>
      <div className="flex flex-col items-start justify-between gap-6 min-[521px]:flex-row min-[521px]:items-end">
        <div>
          <Eyebrow>Application pipeline</Eyebrow>
          <h1 className="font-display text-[clamp(3rem,6vw,5rem)] leading-none font-medium tracking-[-0.045em]">
            Good to see you.
          </h1>
          <p className="mt-3.5 mb-0 text-muted">
            Signed in as <strong>{email}</strong>
          </p>
        </div>
        <Badge className="mb-2 border border-[#b9c7bd] bg-brand-soft text-brand">
          {role}
        </Badge>
      </div>

      <div
        className="mt-[52px] grid grid-cols-1 gap-4 min-[851px]:grid-cols-3"
        aria-label="Application summary"
      >
        <StatCard accent label="Total applications" value={total} />
        <StatCard label="Interviewing" value={interviewing} />
        <StatCard label="Offers" value={offers} />
      </div>
    </>
  )
}
