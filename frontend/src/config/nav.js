import {
  PiSquaresFour,
  PiFileArrowUp,
  PiNotePencil,
  PiBriefcase,
  PiListChecks,
  PiChartLineUp,
  PiUserCircle,
  PiUsersThree,
  PiCalendarCheck,
  PiEnvelopeSimple,
  PiBuildings,
} from "react-icons/pi"

export const SEEKER_NAV = [
  { to: "/app/seeker/overview",     label: "Dashboard",      Icon: PiSquaresFour },
  { to: "/app/seeker/resume",       label: "Upload Resume",  Icon: PiFileArrowUp },
  { to: "/app/seeker/cv",           label: "Generate CV",    Icon: PiNotePencil },
  { to: "/app/seeker/jobs",         label: "Jobs",           Icon: PiBriefcase },
  { to: "/app/seeker/applications", label: "Applications",   Icon: PiListChecks },
  { to: "/app/seeker/evaluation",   label: "Evaluation",     Icon: PiChartLineUp },
  { to: "/app/seeker/profile",      label: "Profile",        Icon: PiUserCircle },
]

export const RECRUITER_NAV = [
  { to: "/app/recruiter/overview",   label: "Overview",   Icon: PiSquaresFour },
  { to: "/app/recruiter/jobs",       label: "Jobs",       Icon: PiBriefcase },
  { to: "/app/recruiter/applicants", label: "Applicants", Icon: PiUsersThree },
  { to: "/app/recruiter/interviews", label: "Interviews", Icon: PiCalendarCheck },
  { to: "/app/recruiter/emails",     label: "Email logs", Icon: PiEnvelopeSimple },
  { to: "/app/recruiter/profile",    label: "Company",    Icon: PiBuildings },
]

export const ADMIN_NAV = [
  { to: "/app/admin/overview",   label: "Overview",   Icon: PiSquaresFour },
  { to: "/app/admin/users",      label: "Users",      Icon: PiUsersThree },
  { to: "/app/admin/recruiters", label: "Recruiters", Icon: PiBuildings },
  { to: "/app/admin/jobs",       label: "Jobs",       Icon: PiBriefcase },
  { to: "/app/admin/emails",     label: "Email logs", Icon: PiEnvelopeSimple },
]
