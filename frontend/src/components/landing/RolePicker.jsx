import { PiUserFocus, PiBuildings, PiShieldCheck } from "react-icons/pi"
import { RoleCard } from "@/components/landing/RoleCard.jsx"

const ROLE_ICONS = {
  job_seeker: PiUserFocus,
  recruiter: PiBuildings,
  admin: PiShieldCheck,
}

// Asymmetric grid: one tall featured card on the left, two compact cards
// stacked on the right. Deliberately not three equal columns — see the
// Task 4.1 brief (spec flags equal-column role grids as an AI-default
// pattern to avoid).
export function RolePicker({ roles }) {
  const [primary, secondaryA, secondaryB] = roles

  return (
    <div className="group/picker grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <RoleCard {...primary} Icon={ROLE_ICONS[primary.id]} featured className="lg:row-span-2" />
      <RoleCard {...secondaryA} Icon={ROLE_ICONS[secondaryA.id]} />
      <RoleCard {...secondaryB} Icon={ROLE_ICONS[secondaryB.id]} />
    </div>
  )
}
