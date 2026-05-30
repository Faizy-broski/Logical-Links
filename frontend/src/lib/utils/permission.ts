import { Load } from "@/types/load.types";

export function canEdit(
  load: Load,
  isAdmin: boolean,
  currentShipperId: string
) {
  if (!isAdmin) {
    return (
      load.shipperId === currentShipperId
    );
  }

  return !load.isPrivate;
}