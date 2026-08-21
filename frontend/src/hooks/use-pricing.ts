import { useMutation } from "@tanstack/react-query";
import { api, type ApiResponse } from "@/lib/api";
import type { CalculatePriceDto, PriceBreakdown } from "@/types/api.types";

export function useCalculatePrice() {
  return useMutation({
    mutationFn: (dto: CalculatePriceDto) =>
      api.post<ApiResponse<PriceBreakdown>>("/api/v1/pricing/calculate", dto),
  });
}
