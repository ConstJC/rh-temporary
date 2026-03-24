import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userType = (session?.user as { userType?: string })?.userType;
  if (
    !session?.user ||
    (userType !== "LANDLORD" && userType !== "SYSTEM_ADMIN")
  ) {
    redirect("/login");
  }
  return <>{children}</>;
}
