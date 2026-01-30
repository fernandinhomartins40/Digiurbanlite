import { UnidadeProvider } from '@/contexts/UnidadeContext';

export default function SaudeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UnidadeProvider>{children}</UnidadeProvider>;
}
