import type { ApplicationStatus } from '../gql/graphql'
import { Badge } from '../ui/Badge'
import { cn } from '../ui/cn'
import { statusClasses, statusLabels } from './application-status'

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge className={cn('py-[7px]', statusClasses[status])}>
      {statusLabels[status]}
    </Badge>
  )
}
