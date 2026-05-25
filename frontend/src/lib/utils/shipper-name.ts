import { SHIPPERS } from "@/constants/shippers";

export function shipperName(id: string) {
  return (
    SHIPPERS.find(
      (s) => s.id === id
    )?.name ?? id
  );
}