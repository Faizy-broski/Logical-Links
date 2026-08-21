"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileQuestion, MapPin, Loader2, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { TermsAcceptanceModal, TERMS_VERSION } from "@/components/documents/terms-acceptance-modal";

import { geocodeAddress, haversineDistanceKm, type AddressSuggestion, type Coordinates } from "@/lib/utils/geocode";
import { useDeliveryRates } from "@/hooks/use-delivery-rates";
import { useCreateResidentialQuote, useAcceptQuotation } from "@/hooks/use-quotations";
import type { Quotation, ResidentialQuoteRequestDto } from "@/types/api.types";

type AddressParts = { address: string; coords: Coordinates | null; city: string; state: string; postcode: string };

const EMPTY_ADDRESS: AddressParts = { address: "", coords: null, city: "", state: "", postcode: "" };

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-foreground" : "text-muted"}`}>
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}

export default function ResidentialQuotationsPage() {
  const router = useRouter();
  const { data: ratesRes } = useDeliveryRates();
  const rates = (ratesRes?.data ?? []).filter((r) => r.is_active);

  const [origin, setOrigin] = useState<AddressParts>(EMPTY_ADDRESS);
  const [destination, setDestination] = useState<AddressParts>(EMPTY_ADDRESS);
  const [serviceType, setServiceType] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [geocoding, setGeocoding] = useState<"origin" | "destination" | null>(null);

  const [quote, setQuote] = useState<Quotation | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  const createMut = useCreateResidentialQuote();
  const acceptMut = useAcceptQuotation(quote?.id ?? "");

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
    serviceType && cargoDescription.trim().length >= 3 && distanceKm != null;

  async function handleGetQuote() {
    if (!canSubmit || distanceKm == null) return;
    const dto: ResidentialQuoteRequestDto = {
      originAddress: origin.address, originLat: origin.coords!.lat, originLng: origin.coords!.lng,
      originCity: origin.city, originState: origin.state, originPostcode: origin.postcode,
      destinationAddress: destination.address, destinationLat: destination.coords!.lat, destinationLng: destination.coords!.lng,
      destinationCity: destination.city, destinationState: destination.state, destinationPostcode: destination.postcode,
      distanceKm, serviceType, cargoDescription: cargoDescription.trim(),
    };
    try {
      const res = await createMut.mutateAsync(dto);
      setQuote(res.data);
      toast.success("Here's your quote");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleConfirmAccept() {
    try {
      await acceptMut.mutateAsync({ termsVersion: TERMS_VERSION, acknowledged: true });
      toast.success("Quote accepted — your delivery has been created");
      setTermsOpen(false);
      router.push("/residential/loads");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function startOver() {
    setQuote(null);
    setOrigin(EMPTY_ADDRESS);
    setDestination(EMPTY_ADDRESS);
    setServiceType("");
    setCargoDescription("");
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-2">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Get a Quote</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Instant Delivery Quote</h1>
          <p className="mt-2 text-sm text-muted">
            Tell us where and what you need delivered — we&apos;ll price it instantly.
          </p>
        </div>

        {!quote ? (
          <div className="space-y-5 rounded-3xl border border-card-border bg-card p-6 shadow-sm">
            <div className="space-y-1.5">
              <Label>Pickup Address</Label>
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
              <Label>Delivery Address</Label>
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
              <Label>Service Type</Label>
              <SearchableSelect
                value={serviceType}
                onValueChange={setServiceType}
                options={rates.map((r) => ({ value: r.service_type, label: r.label }))}
                placeholder="What kind of delivery is this?"
                searchPlaceholder="Search…"
              />
            </div>

            <div className="space-y-1.5">
              <Label>What needs to be delivered?</Label>
              <Textarea
                value={cargoDescription}
                onChange={(e) => setCargoDescription(e.target.value)}
                placeholder="e.g. Groceries, a small parcel, medical supplies…"
                rows={3}
                className="resize-none"
              />
            </div>

            <Button
              type="button"
              onClick={handleGetQuote}
              disabled={!canSubmit || createMut.isPending}
              className="w-full rounded-lg bg-primary text-sidebar hover:bg-primary/85"
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Instant Quote"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-card-border px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileQuestion className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{quote.quotation_number}</h2>
                  <p className="text-xs text-muted">{origin.address} → {destination.address}</p>
                </div>
              </div>
              <div className="space-y-1.5 p-5 text-sm">
                {(quote.quotation_items ?? []).map((item) => (
                  <Row key={item.id ?? item.description} label={item.description} value={item.amount} />
                ))}
                <div className="border-t border-card-border pt-1.5">
                  <Row label="Total" value={quote.total} bold />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={startOver}>
                Start Over
              </Button>
              <Button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="flex-1 rounded-lg bg-primary text-sidebar hover:bg-primary/85"
              >
                Accept &amp; Book Delivery
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-2xl border border-card-border bg-card p-4 text-xs text-muted">
          <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>Prices are calculated instantly from our published delivery rates. Accepting creates your delivery right away.</p>
        </div>
      </div>

      <TermsAcceptanceModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={handleConfirmAccept}
        loading={acceptMut.isPending}
      />
    </div>
  );
}
