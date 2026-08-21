"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

import { geocodeAddress, haversineDistanceKm, type AddressSuggestion, type Coordinates } from "@/lib/utils/geocode";
import { useRequestCorporateQuote } from "@/hooks/use-quotations";
import type { CorporateQuoteRequestDto } from "@/types/api.types";

type AddressParts = { address: string; coords: Coordinates | null; city: string; state: string; postcode: string };

const EMPTY_ADDRESS: AddressParts = { address: "", coords: null, city: "", state: "", postcode: "" };

export default function RequestCorporateQuotePage() {
  const router = useRouter();

  const [origin, setOrigin] = useState<AddressParts>(EMPTY_ADDRESS);
  const [destination, setDestination] = useState<AddressParts>(EMPTY_ADDRESS);
  const [cargoDescription, setCargoDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [geocoding, setGeocoding] = useState<"origin" | "destination" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const requestMut = useRequestCorporateQuote();

  const distanceKm = origin.coords && destination.coords
    ? Math.round(haversineDistanceKm(origin.coords, destination.coords) * 10) / 10
    : null;

  async function handleAddressBlur(field: "origin" | "destination", address: string) {
    setGeocoding(field);
    const coords = await geocodeAddress(address);
    const setter = field === "origin" ? setOrigin : setDestination;
    setter((prev) => ({ ...prev, coords }));
    setGeocoding(null);
  }

  function handleAddressSelect(field: "origin" | "destination", suggestion: AddressSuggestion) {
    const setter = field === "origin" ? setOrigin : setDestination;
    setter({
      address:  suggestion.placeName,
      coords:   suggestion.center,
      city:     suggestion.context?.city ?? "",
      state:    suggestion.context?.region ?? "",
      postcode: suggestion.context?.postcode ?? "",
    });
  }

  const canSubmit =
    origin.address && origin.coords && origin.city && origin.state && origin.postcode &&
    destination.address && destination.coords && destination.city && destination.state && destination.postcode &&
    cargoDescription.trim().length >= 3;

  async function handleSubmit() {
    if (!canSubmit) return;
    const dto: CorporateQuoteRequestDto = {
      originAddress: origin.address, originLat: origin.coords!.lat, originLng: origin.coords!.lng,
      originCity: origin.city, originState: origin.state, originPostcode: origin.postcode,
      destinationAddress: destination.address, destinationLat: destination.coords!.lat, destinationLng: destination.coords!.lng,
      destinationCity: destination.city, destinationState: destination.state, destinationPostcode: destination.postcode,
      cargoDescription: cargoDescription.trim(),
      notes: notes.trim() || null,
    };
    try {
      await requestMut.mutateAsync(dto);
      setSubmitted(true);
      toast.success("Quote request submitted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-2">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-card-border bg-card p-10 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Request submitted</h1>
            <p className="max-w-sm text-sm text-muted">
              We&apos;ll review your request and send you a priced quotation shortly — you&apos;ll get a notification once it&apos;s ready to accept.
            </p>
            <Button
              type="button"
              onClick={() => router.push("/shipper/quotations")}
              className="mt-2 rounded-lg bg-primary text-sidebar hover:bg-primary/85"
            >
              Back to Quotations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-2">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Shipper Portal</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Request a Quote</h1>
          <p className="mt-2 text-sm text-muted">
            Tell us about the delivery and we&apos;ll send you a priced quotation to review and accept.
          </p>
        </div>

        <div className="space-y-5 rounded-3xl border border-card-border bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label>Origin Address</Label>
            <AddressAutocomplete
              as="textarea"
              rows={2}
              value={origin.address}
              onChange={(v) => setOrigin((prev) => ({ ...prev, address: v }))}
              onBlur={() => handleAddressBlur("origin", origin.address)}
              onSelect={(s) => handleAddressSelect("origin", s)}
              placeholder="Street, City, Province, Postal Code"
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Destination Address</Label>
            <AddressAutocomplete
              as="textarea"
              rows={2}
              value={destination.address}
              onChange={(v) => setDestination((prev) => ({ ...prev, address: v }))}
              onBlur={() => handleAddressBlur("destination", destination.address)}
              onSelect={(s) => handleAddressSelect("destination", s)}
              placeholder="Street, City, Province, Postal Code"
              className="resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {geocoding ? (
              <span>Locating {geocoding} address…</span>
            ) : distanceKm != null ? (
              <span className="font-semibold text-foreground">≈ {distanceKm} km</span>
            ) : (
              <span>Distance appears once both addresses are selected from the dropdown</span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>What needs to be shipped?</Label>
            <Textarea
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              placeholder="Describe the freight — type, weight, pallets, special handling…"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Additional Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferred pickup window, access requirements, etc."
              rows={2}
              className="resize-none"
            />
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || requestMut.isPending}
            className="w-full rounded-lg bg-primary text-sidebar hover:bg-primary/85"
          >
            {requestMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
