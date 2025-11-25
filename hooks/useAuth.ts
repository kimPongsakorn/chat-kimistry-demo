import { getUser } from "@/app/actions";
import { User } from "@/types/user";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, isLoading, setUser };
}

