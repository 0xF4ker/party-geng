import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@prisma/client";

export const useUserType = () => {
  const { user, loading } = useAuth();

  const isGuest = !user && !loading;
  const isClient = user?.role === UserRole.CLIENT;
  const isVendor = user?.role === UserRole.VENDOR;

  return {
    user,
    loading,
    isGuest,
    isClient,
    isVendor,
    hasRole: (role: UserRole) => user?.role === role,
  };
};
