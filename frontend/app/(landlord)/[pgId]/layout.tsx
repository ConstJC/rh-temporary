import { PropertyGroupProvider } from "@/hooks/usePropertyGroup";
import { AppShell } from "@/components/layout/AppShell";

export default async function PropertyGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ pgId: string }>;
}) {
  const { pgId } = await params;
  return (
    <PropertyGroupProvider pgId={pgId}>
      <AppShell pgId={pgId} isAdmin={false} title="RentHub">
        {children}
      </AppShell>
    </PropertyGroupProvider>
  );
}
