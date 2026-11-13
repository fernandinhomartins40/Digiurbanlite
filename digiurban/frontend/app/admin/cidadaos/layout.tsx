import { CitizensTabs } from '@/components/admin/citizens/CitizensTabs'

export default function CidadaosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CitizensTabs />
      {children}
    </>
  )
}
