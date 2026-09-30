import type { ApplicationStatus } from '../gql/graphql'

export const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  REJECTED: 'Rejected',
  OFFER: 'Offer',
}

export const statusClasses: Record<ApplicationStatus, string> = {
  SAVED: 'bg-[#e3e5e2] text-[#4c5550]',
  APPLIED: 'bg-[#dcebf4] text-[#245677]',
  INTERVIEWING: 'bg-[#f5e8b9] text-[#6b4e00]',
  REJECTED: 'bg-[#f4ddd8] text-[#873629]',
  OFFER: 'bg-[#d7ecdc] text-[#205d3a]',
}
