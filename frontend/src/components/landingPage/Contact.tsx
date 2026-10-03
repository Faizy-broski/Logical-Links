"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Headset,
  MessageCircleQuestion,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuoteGate } from "@/hooks/use-quote-gate";
import { useDeliveryRates } from "@/hooks/use-delivery-rates";
import { useServiceLevels } from "@/hooks/use-service-levels";
import { useAuthStore } from "@/store/auth.store";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import {
  geocodeAddressFull,
  type AddressSuggestion,
  type Coordinates,
} from "@/lib/utils/geocode";
import { clearPendingQuote, quotePathForRole, writePendingQuote, writePendingSupport } from "@/lib/pending-intent";
import { api, ApiError, type ApiResponse } from "@/lib/api";
import {
  CONTACT_OPEN_EVENT,
  CONTACT_SECTION_ID,
  type ContactFormKind,
} from "@/lib/contact-section";

// Placeholder background — swap for the dedicated Contact/Help image once it's
// supplied.
const CONTACT_BG = "/quoteBg.svg";

const OPTIONS: {
  kind: ContactFormKind;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    kind: "quote",
    title: "Request a Quote",
    description:
      "Need pricing for an upcoming shipment or logistics requirement?",
    icon: FileText,
  },
  {
    kind: "support",
    title: "Customer Support",
    description:
      "Already have a shipment or need assistance with an existing delivery?",
    icon: Headset,
  },
  {
    kind: "inquiry",
    title: "General Inquiry",
    description: "Have a question about Logical Links or our services?",
    icon: MessageCircleQuestion,
  },
];

const FIELD_CLASS = "border-white/10 bg-white text-black rounded-xs";

export default function Contact() {
  const [active, setActive] = useState<ContactFormKind | null>(null);

  // "/#quote" (footer, services page, access hub) lands with the quote form
  // already open; the header CTA opens it in place via openContactForm.
  useEffect(() => {
    if (window.location.hash === "#quote") {
      setActive("quote");
      document
        .getElementById(CONTACT_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth" });
    }

    const onOpen = (e: Event) =>
      setActive((e as CustomEvent<ContactFormKind>).detail);
    window.addEventListener(CONTACT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONTACT_OPEN_EVENT, onOpen);
  }, []);

  return (
    <section
      id={CONTACT_SECTION_ID}
      className="relative min-h-screen overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${CONTACT_BG}')` }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full items-stretch gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-0">
          {/* Options column — sits on top so the chosen form slides out from
              underneath its edge, like the nav on the Services page. */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-20 text-white lg:pr-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Contact Us
            </p>
            <h2 className="mt-3 mb-4 text-4xl sm:text-6xl font-bold leading-tight">
              How Can
              <br />
              We Help?
            </h2>
            <p className="mb-10 text-lg text-white/80">
              Choose an option below and we&apos;ll point you to the right
              team.
            </p>

            <div className="space-y-4">
              {OPTIONS.map((option) => (
                <OptionCard
                  key={option.kind}
                  {...option}
                  active={active === option.kind}
                  onClick={() => setActive(option.kind)}
                />
              ))}
            </div>
          </motion.div>

          {/* Form column — the selected form slides out from the options
              column; overflow is clipped so it emerges from the seam. */}
          <div className="relative z-10 overflow-hidden">
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active}
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="flex min-h-full w-full flex-col rounded-sm border border-white/30 bg-white/10 p-8 backdrop-blur-xl"
                >
                  {active === "quote" ? (
                    <QuoteForm />
                  ) : (
                    <MessageForm kind={active} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function OptionCard({
  title,
  description,
  icon: Icon,
  active,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center gap-4 rounded-sm border p-5 text-left backdrop-blur-xl transition-colors ${
        active
          ? "border-primary bg-primary/25"
          : "border-white/30 bg-white/10 hover:border-white/60 hover:bg-white/15"
      }`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${
          active ? "bg-primary text-white" : "bg-white/15 text-white"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block text-base font-semibold text-white">
          {title}
        </span>
        <span className="mt-1 block text-sm text-white/75">{description}</span>
      </span>
      <ChevronRight
        className={`h-5 w-5 shrink-0 text-white transition-transform ${
          active ? "translate-x-1" : "opacity-60 group-hover:translate-x-1"
        }`}
      />
    </button>
  );
}

type QuoteAddress = {
  address: string;
  coords: Coordinates | null;
  city: string;
  state: string;
  postcode: string;
};

const EMPTY_ADDRESS: QuoteAddress = { address: "", coords: null, city: "", state: "", postcode: "" };

const SELECT_CLASS =
  "h-9 w-full rounded-xs border border-white/10 bg-white px-3 text-sm text-black outline-none focus:border-primary";

// Collects the same fields as the dashboard quote request. Nothing is sent from
// here: the draft is stashed and the dashboard quote page (corporate: submits it
// as a quote request; residential: prefills the instant quote) takes over after
// sign-in, so the visitor lands on the Get a Quote page with it already there.
function QuoteForm() {
  const requestQuote = useQuoteGate();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);

  const { data: ratesRes } = useDeliveryRates();
  const rates = (ratesRes?.data ?? []).filter((r) => r.is_active);
  const { data: levelsRes } = useServiceLevels();
  const levels = (levelsRes?.data ?? []).filter((l) => l.is_active);

  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [origin, setOrigin] = useState<QuoteAddress>(EMPTY_ADDRESS);
  const [destination, setDestination] = useState<QuoteAddress>(EMPTY_ADDRESS);
  const [serviceType, setServiceType] = useState("");
  const [serviceLevel, setServiceLevel] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [pieces, setPieces] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [geocoding, setGeocoding] = useState<"origin" | "destination" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceLevel && levels.length > 0) {
      setServiceLevel((levels.find((l) => l.slug === "standard") ?? levels[0]).slug);
    }
  }, [levels, serviceLevel]);

  async function handleAddressBlur(field: "origin" | "destination", address: string) {
    if (!address.trim()) return;
    setGeocoding(field);
    const result = await geocodeAddressFull(address);
    const setter = field === "origin" ? setOrigin : setDestination;
    setter((prev) => ({
      ...prev,
      coords: result?.center ?? prev.coords,
      city: prev.city || result?.context?.city || "",
      state: prev.state || result?.context?.region || "",
      postcode: prev.postcode || result?.context?.postcode || "",
    }));
    setGeocoding(null);
  }

  function handleAddressSelect(field: "origin" | "destination", suggestion: AddressSuggestion) {
    const setter = field === "origin" ? setOrigin : setDestination;
    setter({
      address: suggestion.placeName,
      coords: suggestion.center,
      city: suggestion.context?.city ?? "",
      state: suggestion.context?.region ?? "",
      postcode: suggestion.context?.postcode ?? "",
    });
  }

  function firstProblem(): string | null {
    if (!customerName.trim()) return "Enter a contact name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return "Enter a valid email address";
    if (!customerPhone.trim()) return "Enter a phone number";
    for (const [label, a] of [["pickup", origin], ["delivery", destination]] as const) {
      if (!a.address) return `Enter a ${label} address`;
      if (!a.coords || !a.city || !a.state || !a.postcode) {
        return `The ${label} address isn't fully recognised — pick it from the suggestions`;
      }
    }
    if (!serviceType) return "Choose a service type";
    if (!serviceLevel) return "Choose a service level";
    if (cargoDescription.trim().length < 3) return "Describe what needs to be shipped";
    if (!(Number(pieces) >= 1)) return "Enter the number of packages";
    if (!(Number(weightKg) > 0)) return "Enter the weight";
    if (!preferredDeliveryDate) return "Choose a preferred delivery date";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = firstProblem();
    setError(problem);
    if (problem) return;

    const toDraftAddress = (a: QuoteAddress) => ({
      address: a.address,
      lat: a.coords!.lat,
      lng: a.coords!.lng,
      city: a.city,
      state: a.state,
      postcode: a.postcode,
    });

    writePendingQuote({
      customerName: customerName.trim(),
      customerCompany: customerCompany.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      origin: toDraftAddress(origin),
      destination: toDraftAddress(destination),
      serviceType,
      serviceLevel,
      cargoDescription: cargoDescription.trim(),
      pieces,
      weightKg,
      preferredDeliveryDate,
      notes: notes.trim(),
    });

    // Not signed in → /login (then straight to the quote page afterwards).
    // Signed in → go there now. Admins have no quote page; drop the stash.
    requestQuote(() => {
      const path = quotePathForRole(role);
      if (path) router.push(path);
      else clearPendingQuote();
    });
  }

  return (
    <>
      <p className="text-2xl font-semibold text-white">Get Your Quote</p>
      <p className="mt-2 text-sm text-white/70">
        Tell us about your shipment and we&apos;ll take you straight to your
        quote once you&apos;re signed in.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Contact Name" className={FIELD_CLASS} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <Input placeholder="Company (optional)" className={FIELD_CLASS} value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Email Address" type="email" className={FIELD_CLASS} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          <Input placeholder="Phone Number" type="tel" className={FIELD_CLASS} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </div>

        <AddressAutocomplete
          value={origin.address}
          onChange={(v) => setOrigin((prev) => ({ ...prev, address: v }))}
          onBlur={() => handleAddressBlur("origin", origin.address)}
          onSelect={(sg) => handleAddressSelect("origin", sg)}
          placeholder="Pickup address"
        />
        <AddressAutocomplete
          value={destination.address}
          onChange={(v) => setDestination((prev) => ({ ...prev, address: v }))}
          onBlur={() => handleAddressBlur("destination", destination.address)}
          onSelect={(sg) => handleAddressSelect("destination", sg)}
          placeholder="Delivery address"
        />
        {geocoding && (
          <p className="text-xs text-white/60">Locating {geocoding} address…</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <select aria-label="Service Type" className={SELECT_CLASS} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            <option value="">Service Type</option>
            {rates.map((r) => (
              <option key={r.service_type} value={r.service_type}>{r.label}</option>
            ))}
          </select>
          <select aria-label="Service Level" className={SELECT_CLASS} value={serviceLevel} onChange={(e) => setServiceLevel(e.target.value)}>
            <option value="">Service Level</option>
            {levels.map((l) => (
              <option key={l.slug} value={l.slug}>{l.label}</option>
            ))}
          </select>
        </div>

        <Textarea
          placeholder="What needs to be shipped?"
          className={`min-h-20 ${FIELD_CLASS}`}
          value={cargoDescription}
          onChange={(e) => setCargoDescription(e.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Input placeholder="Packages" type="number" min={1} step={1} className={FIELD_CLASS} value={pieces} onChange={(e) => setPieces(e.target.value)} />
          <Input placeholder="Weight (kg)" type="number" min={0.1} step={0.1} className={FIELD_CLASS} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          <Input aria-label="Preferred Delivery Date" type="date" className={FIELD_CLASS} value={preferredDeliveryDate} onChange={(e) => setPreferredDeliveryDate(e.target.value)} />
        </div>

        <Textarea
          placeholder="Special instructions (optional)"
          className={`min-h-16 ${FIELD_CLASS}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full bg-primary font-semibold text-white hover:bg-primary-dark"
        >
          Get My Quote →
        </Button>
        <p className="text-center text-xs text-white/60">
          By submitting this form, you agree to our terms and privacy policy
        </p>
      </form>
    </>
  );
}

// ── Support / general inquiry ─────────────────────────────────────────────────
// Both post to the public contact endpoint (admin Contact Messages inbox); the
// subject is prefixed with the request type so the team can triage at a glance.

interface MessageFormState {
  name: string;
  email: string;
  phone: string;
  reference: string;
  subject: string;
  message: string;
}

const EMPTY_MESSAGE_FORM: MessageFormState = {
  name: "",
  email: "",
  phone: "",
  reference: "",
  subject: "",
  message: "",
};

const MESSAGE_COPY = {
  support: {
    title: "Customer Support",
    intro:
      "Share your delivery details and our support team will help you out.",
    messagePlaceholder: "How can we help with your delivery?",
    subjectPrefix: "Customer Support",
  },
  inquiry: {
    title: "General Inquiry",
    intro: "Ask us anything about Logical Links or our services.",
    messagePlaceholder: "What would you like to know?",
    subjectPrefix: "General Inquiry",
  },
} as const;

function MessageForm({ kind }: { kind: "support" | "inquiry" }) {
  const copy = MESSAGE_COPY[kind];
  const [form, setForm] = useState<MessageFormState>(EMPTY_MESSAGE_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof MessageFormState, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof MessageFormState>(
    key: K,
    value: MessageFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof MessageFormState, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";
    if (kind === "inquiry" && !form.subject.trim())
      next.subject = "Subject is required";
    if (!form.message.trim()) next.message = "Message is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const detail =
      kind === "support" ? form.reference.trim() : form.subject.trim();

    setSubmitting(true);
    try {
      await api.post<ApiResponse<unknown>>("/api/v1/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        subject: detail ? `${copy.subjectPrefix}: ${detail}` : copy.subjectPrefix,
        message: form.message.trim(),
      });
      // Support requests can be turned into a trackable ticket after sign-in.
      if (kind === "support") {
        writePendingSupport({
          subject: detail ? `${copy.subjectPrefix}: ${detail}` : copy.subjectPrefix,
          description: form.message.trim(),
        });
      }
      setSubmitted(true);
      setForm(EMPTY_MESSAGE_FORM);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-lg font-semibold text-white">Message sent</p>
        <p className="max-w-xs text-sm text-white/70">
          Thanks for reaching out — our team will get back to you shortly.
        </p>
        {kind === "support" && (
          <p className="max-w-xs text-sm text-white/70">
            <Link href="/login" className="font-semibold text-primary underline">
              Sign in
            </Link>{" "}
            to track this request as a support ticket in your dashboard.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-2"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-2xl font-semibold text-white">{copy.title}</p>
      <p className="mt-2 text-sm text-white/70">{copy.intro}</p>

      <form
        className="mt-8 flex flex-1 flex-col gap-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Input
              placeholder="Full Name"
              className={FIELD_CLASS}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Input
              placeholder="Phone Number (optional)"
              type="tel"
              className={FIELD_CLASS}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Input
            placeholder="Email Address"
            type="email"
            className={FIELD_CLASS}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <FieldError message={errors.email} />
        </div>

        {kind === "support" ? (
          <Input
            placeholder="Delivery / Tracking Number (optional)"
            className={FIELD_CLASS}
            value={form.reference}
            onChange={(e) => update("reference", e.target.value)}
          />
        ) : (
          <div>
            <Input
              placeholder="Subject"
              className={FIELD_CLASS}
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
            <FieldError message={errors.subject} />
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <Textarea
            placeholder={copy.messagePlaceholder}
            className={`min-h-30 flex-1 ${FIELD_CLASS}`}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
          />
          <FieldError message={errors.message} />
        </div>

        {submitError && <p className="text-sm text-red-300">{submitError}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-12 w-full bg-primary font-semibold text-white hover:bg-primary-dark"
        >
          {submitting ? "Sending…" : "Send Message →"}
        </Button>
        <p className="text-center text-xs text-white/60">
          By submitting this form, you agree to our terms and privacy policy
        </p>
      </form>
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}
