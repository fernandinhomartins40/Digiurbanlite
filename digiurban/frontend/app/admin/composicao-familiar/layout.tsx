import { CitizensTabs } from '@/components/admin/citizens/CitizensTabs'

export default function FamiliasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CitizensTabs />
      {children}
    </>
  )
}
