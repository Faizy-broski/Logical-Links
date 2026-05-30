"use client";

import { useEffect } from "react";
import { useLoadStore } from "@/store/load.store";
import { Role } from "@/types/load.types";

interface RoleInitializerProps {
  role: Role;
  shipperId: string;
}

export default function RoleInitializer({ role, shipperId }: RoleInitializerProps) {
  const setRole = useLoadStore((s) => s.setRole);

  useEffect(() => {
    setRole(role, shipperId);
  }, [role, shipperId]);

  return null;
}