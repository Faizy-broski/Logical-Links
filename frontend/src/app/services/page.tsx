"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/landingPage/Header";
import HeroScrim from "@/components/landingPage/HeroScrim";
import Footer from "@/components/landingPage/Footer";
import { useQuoteGate } from "@/hooks/use-quote-gate";

interface ServiceBullet {
  title: string;
  description: string;
}

interface ServiceDetail {
  id: string;
  navLabel: string;
  whyHeading: string;
  bullets: ServiceBullet[];
  image: string;
  imageHeading: string;
  intro: string;
  closing: string;
  ctaLabel: "Get a Quote" | "Book Now";
}

const SERVICES: ServiceDetail[] = [
  {
    id: "ftl",
    navLabel: "Full Truckload (FTL)",
    whyHeading: "Why companies rely on our FTL Solutions",
    bullets: [
      { title: "Dedicated Capacity", description: "Your shipment gets the truck space it needs without sharing capacity with other freight." },
      { title: "Direct, Efficient Transit", description: "Direct routing and fewer handling points help keep freight moving efficiently." },
      { title: "Secure, Controlled Movement", description: "Your freight is managed from pickup through delivery with fewer transfers and handling points." },
      { title: "Flexible Equipment", description: "Access to dry vans, reefers, flatbeds, and specialized equipment based on your shipment requirements." },
    ],
    image: "/service1.svg",
    imageHeading: "Your Full Delivery. Our Full Attention.",
    intro: "LLC connects businesses with dependable full truckload capacity through a trusted carrier network. As a freight broker, we match each shipment with the right equipment and carrier while managing the details from pickup through delivery.",
    closing: "We coordinate routing, carrier selection, pricing, tracking, and communication so your freight keeps moving with clear visibility throughout the journey.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "ltl",
    navLabel: "Less Than Truckload (LTL)",
    whyHeading: "Why businesses depend on our LTL Services",
    bullets: [
      { title: "Pay for the Space You Need", description: "Move smaller shipments without committing to an entire truck." },
      { title: "Smart Consolidation", description: "We match your freight with suitable carrier capacity to help manage transportation costs." },
      { title: "Flexible Shipping", description: "LTL works well for businesses with smaller, recurring, or changing shipment volumes." },
      { title: "End-to-End Visibility", description: "Track your shipment and stay informed from pickup through delivery." },
    ],
    image: "/ltl.png",
    imageHeading: "Less Than a Delivery. More Than a Priority.",
    intro: "LLC provides flexible LTL solutions for businesses that need to move smaller shipments efficiently. We work with a network of carriers to match your freight with suitable capacity, routes, and service requirements.",
    closing: "From carrier selection and pricing to tracking and delivery coordination, we manage the details so you don't have to.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "dedicated",
    navLabel: "Dedicated Freight",
    whyHeading: "Why industry leaders depend on our Dedicated Freight Solutions",
    bullets: [
      { title: "Consistent Capacity", description: "Dedicated transportation provides dependable capacity for recurring or specialized shipping needs." },
      { title: "Built Around Your Operation", description: "Routes, equipment, scheduling, and service requirements can be structured around your business." },
      { title: "Reliable Coordination", description: "We manage carrier relationships, scheduling, tracking, and communication throughout the operation." },
      { title: "Scalable Support", description: "Solutions can adapt as your shipping requirements change or expand." },
    ],
    image: "/dfs.jpg",
    imageHeading: "Dedicated to Freight. Dedicated to You.",
    intro: "LLC provides dedicated freight solutions for businesses that require consistent capacity and transportation support built around their operations.",
    closing: "We coordinate carrier selection, routing, equipment, scheduling, and ongoing shipment management, giving you a more consistent transportation solution without having to manage every detail yourself.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "heavy",
    navLabel: "Specialty & Heavy Transport",
    whyHeading: "Why companies rely on our Specialty & Heavy Transport",
    bullets: [
      { title: "Specialized Equipment", description: "Access to equipment suited to oversized, heavy, and complex freight requirements." },
      { title: "Route & Permit Coordination", description: "We coordinate routing, permits, escorts, and other requirements involved in specialized moves." },
      { title: "Careful Planning", description: "Dimensions, weight, equipment, route restrictions, and delivery requirements are considered before the move." },
      { title: "Experienced Carrier Network", description: "We connect specialized shipments with carriers equipped to handle the requirements of the move." },
    ],
    image: "/sht.jpg",
    imageHeading: "Heavy Transport. Handled with Care.",
    intro: "LLC coordinates specialty and heavy transportation for oversized, overweight, and complex freight. We manage the planning and logistics details required to move challenging shipments safely and efficiently.",
    closing: "From equipment selection and route planning to permits, escorts, carrier coordination, and tracking, we manage the process from beginning to end.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "auto",
    navLabel: "Auto Transport",
    whyHeading: "Why businesses trust our Auto Transport Solutions",
    bullets: [
      { title: "Open or Enclosed Transport", description: "Transportation options suited to the type and protection requirements of your vehicle." },
      { title: "Single or Multiple Vehicles", description: "Solutions for individual vehicles, dealership moves, and fleet transportation." },
      { title: "Careful Handling", description: "Coordinated loading, transportation, and delivery with attention to vehicle condition." },
      { title: "Clear Visibility", description: "Shipment tracking and communication throughout the transportation process." },
    ],
    image: "/auto.jpg",
    imageHeading: "Auto Transport. Managed with Precision.",
    intro: "LLC provides vehicle transportation solutions for individual vehicles, dealerships, and commercial fleets. We coordinate carrier selection, scheduling, routing, and delivery based on the requirements of each move.",
    closing: "Whether you're moving one vehicle or coordinating multiple vehicles, we manage the transportation process from pickup through delivery.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "courier",
    navLabel: "RUHSH | Courier",
    whyHeading: "Why clients depend on RUHSH | Courier",
    bullets: [
      { title: "Same-Day & Scheduled Delivery", description: "Flexible delivery options for urgent, recurring, and time-sensitive shipments." },
      { title: "Local & Regional Coverage", description: "Built around the needs of businesses requiring dependable last-mile delivery." },
      { title: "Careful Handling", description: "Parcels, documents, and other items are handled with attention throughout the delivery." },
      { title: "Real-Time Updates", description: "Tracking and delivery confirmation keep you informed from pickup to drop-off." },
    ],
    image: "/courier.png",
    imageHeading: "Courier Service. On Time, Every Time.",
    intro: "RUHSH provides courier and last-mile delivery solutions for businesses that need dependable local and regional service.",
    closing: "From documents and parcels to scheduled business deliveries, we coordinate pickup, transportation, tracking, and proof of delivery through a streamlined process.",
    ctaLabel: "Book Now",
  },
  {
    id: "medics",
    navLabel: "RUHSH | Medical",
    whyHeading: "Why healthcare providers trust our deliveries",
    bullets: [
      { title: "Time-Sensitive Delivery", description: "Designed for medical supplies and other healthcare shipments where timing matters." },
      { title: "Careful Handling", description: "Delivery procedures are structured around the specific requirements of the shipment." },
      { title: "Secure Transportation", description: "Shipments are managed with attention to security, chain of custody, and delivery requirements." },
      { title: "Clear Delivery Visibility", description: "Tracking and proof of delivery provide visibility throughout the journey." },
    ],
    image: "/medics.jpg",
    imageHeading: "Trusted Care in Every Delivery.",
    intro: "RUHSH provides medical delivery solutions for healthcare providers, pharmacies, laboratories, clinics, and other organizations that require dependable transportation.",
    closing: "From medical supplies and equipment to time-sensitive healthcare materials, we coordinate pickup, secure transportation, tracking, and delivery according to the requirements of each shipment.",
    ctaLabel: "Book Now",
  },
  {
    id: "ecommerce",
    navLabel: "RUHSH | E-Commerce Delivery",
    whyHeading: "Why businesses rely on our E-Commerce Delivery",
    bullets: [
      { title: "Last-Mile Delivery", description: "Dependable delivery from local pickup points to the customer's door." },
      { title: "Flexible Scheduling", description: "Delivery options designed around business and customer requirements." },
      { title: "Order Accuracy", description: "Clear pickup and delivery processes help keep orders moving correctly." },
      { title: "Delivery Visibility", description: "Tracking and proof of delivery provide visibility throughout the final mile." },
    ],
    // Placeholder until a dedicated e-commerce image is supplied.
    image: "/courier.png",
    imageHeading: "E-Commerce. Delivered Simply.",
    intro: "RUHSH provides last-mile delivery solutions for businesses that need dependable delivery to their customers.",
    closing: "Whether you're managing recurring deliveries or growing your online operation, we coordinate pickup, routing, tracking, and final delivery to create a straightforward experience for your business and its customers.",
    ctaLabel: "Book Now",
  },
  {
    id: "air",
    navLabel: "Air Freight",
    whyHeading: "Why companies rely on our Air Freight Solutions",
    bullets: [
      { title: "Time-Sensitive Shipping", description: "Air freight provides an option when transit time is critical." },
      { title: "Global Connectivity", description: "Access to air carrier networks for domestic and international shipments." },
      { title: "Flexible Service Options", description: "Solutions can be matched to shipment requirements, timing, and budget." },
      { title: "End-to-End Coordination", description: "We manage carrier coordination, routing, documentation, tracking, and delivery." },
    ],
    image: "/air.png",
    imageHeading: "Air Freight. When Time Matters.",
    intro: "LLC coordinates air freight solutions for time-sensitive and high-priority shipments. We work with carrier partners to arrange suitable capacity and manage the shipment from origin through final delivery.",
    closing: "From routing and documentation to tracking and delivery coordination, we manage the logistics details so your freight keeps moving.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "consultancy",
    navLabel: "Consultancy & Advisory Services",
    whyHeading: "Why companies turn to our Expertise",
    bullets: [
      { title: "Operational Insight", description: "Practical guidance based on real logistics and transportation requirements." },
      { title: "Tailored Recommendations", description: "Advice shaped around your business, challenges, and objectives." },
      { title: "Process Improvement", description: "Identify opportunities to improve efficiency, reduce unnecessary costs, and streamline operations." },
      { title: "Ongoing Support", description: "From a specific challenge to longer-term planning, we provide practical guidance when you need it." },
    ],
    image: "/adv.png",
    imageHeading: "Complex Challenges. Solved with Expertise.",
    intro: "LLC provides logistics and transportation consulting designed to help businesses make better operational decisions.",
    closing: "We can help assess transportation processes, identify inefficiencies, review logistics requirements, and develop practical recommendations around cost, service, and operational performance.",
    ctaLabel: "Get a Quote",
  },
];

type NavEntry =
  | { kind: "link"; id: string }
  | { kind: "group"; label: string; children: string[] };

const NAV_STRUCTURE: NavEntry[] = [
  { kind: "link", id: "ftl" },
  { kind: "link", id: "ltl" },
  { kind: "link", id: "dedicated" },
  { kind: "link", id: "heavy" },
  { kind: "link", id: "auto" },
  {
    kind: "group",
    label: "RUHSH Services",
    children: ["courier", "medics", "ecommerce"],
  },
  { kind: "link", id: "air" },
  { kind: "link", id: "consultancy" },
];

const SERVICE_MAP = Object.fromEntries(
  SERVICES.map((service) => [service.id, service]),
);

export default function ServicesPage() {
  const [activeId, setActiveId] = useState<string>("ftl");
  const requestQuote = useQuoteGate();
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && SERVICE_MAP[hash]) {
      setActiveId(hash);
    }
  }, []);

  function selectService(id: string) {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  const active = SERVICE_MAP[activeId];

  return (
    <div className="landing-page min-h-screen bg-white flex flex-col">
      <Header />
      <div className="relative isolate flex flex-col bg-[url('/service-hero.svg?v=2')] bg-[length:100%_100%] bg-center bg-no-repeat min-h-[50vw] pt-10">
        <HeroScrim />

        <section className="w-full max-w-6xl mx-auto my-auto pt-24 pb-12 px-6 text-start">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-3xl sm:text-6xl text-black font-bold leading-tight mb-6 uppercase"
          >
            Our
            <br className="hidden sm:block" />{" "}
            <span className="text-primary">Services</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-base sm:text-xl font-medium text-black max-w-xl"
          >
            Explore our transportation and delivery solutions designed to
            support businesses of all sizes.
          </motion.p>
        </section>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="overflow-x-clip rounded-2xl bg-[#FBF3E5] p-4 sm:p-8 lg:p-10">
          <div className="grid items-stretch gap-8 lg:grid-cols-[240px_1fr_1fr] lg:gap-10">
            {/* Nav column â€” sits on top like a book cover, overlapping the
                "why" column so its content can slide out from underneath it.
                Its right edge is squared off (no rounding) so it sits flush
                against the "why" column, with a clickable indicator line
                running down the seam between them. */}
            <nav className="relative z-20 flex h-full gap-1 overflow-x-auto rounded-2xl bg-white p-3 shadow-[6px_0_24px_-8px_rgba(0,0,0,0.18)] pb-2 lg:flex-col lg:overflow-visible lg:rounded-r-none lg:p-4 lg:pb-4 lg:mr-[-2.5rem] lg:pr-10">
              {/* Static guide line running the full height of the seam */}
              <div className="pointer-events-none absolute right-5 top-4 bottom-4 hidden w-px bg-gray-200 lg:block" />

              {NAV_STRUCTURE.map((entry, i) =>
                entry.kind === "link" ? (
                  <NavLink
                    key={entry.id}
                    label={SERVICE_MAP[entry.id].navLabel}
                    active={activeId === entry.id}
                    onClick={() => selectService(entry.id)}
                  />
                ) : (
                  <div key={`group-${i}`} className="shrink-0 lg:shrink lg:mt-1">
                    <p className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black lg:whitespace-normal">
                      {entry.label}
                    </p>
                    <div className="flex gap-1 lg:flex-col">
                      {entry.children.map((id) => (
                        <NavLink
                          key={id}
                          label={SERVICE_MAP[id].navLabel}
                          active={activeId === id}
                          onClick={() => selectService(id)}
                          indent
                        />
                      ))}
                    </div>
                  </div>
                ),
              )}
            </nav>

            {/* Why column â€” pulled out from underneath the nav "book cover" */}
            <div className="relative z-10 h-full overflow-hidden rounded-2xl lg:overflow-visible lg:rounded-l-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${active.id}-why`}
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-2xl bg-white p-6 shadow-md lg:rounded-l-none lg:pl-12"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-primary mb-6">
                    {active.whyHeading}
                  </h2>

                  <div className="space-y-4">
                    {active.bullets.map((bullet) => (
                      <div key={bullet.title}>
                        <p className="text-sm font-semibold text-black">
                          {bullet.title}:
                        </p>
                        <p className="text-sm text-black leading-relaxed">
                          {bullet.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => requestQuote(() => router.push("/#quote"))}
                    className="mt-8 inline-block rounded-[8px] bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-primary-dark"
                  >
                    {active.ctaLabel}
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Image + description column â€” the card itself stays put, only its
                content (image + copy) crossfades between services */}
            <div className="h-full rounded-2xl bg-white p-6 shadow-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${active.id}-detail`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="relative aspect-[1.4] overflow-hidden rounded-lg">
                    <Image
                      src={active.image}
                      alt={active.navLabel}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-primary">
                    {active.imageHeading}
                  </h3>

                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-black leading-relaxed">
                      {active.intro}
                    </p>
                    <p className="text-sm text-black leading-relaxed">
                      {active.closing}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function NavLink({
  label,
  active,
  onClick,
  indent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors lg:w-full lg:whitespace-normal ${
        indent ? "lg:pl-6" : ""
      } ${
        active
          ? "font-semibold text-primary"
          : "text-black hover:text-primary"
      }`}
    >
      {label}
      {/* Extends the click target into the seam gutter and highlights the
          portion of the divider line level with this item when it's active */}
      <span
        aria-hidden
        className="absolute -right-10 top-0 bottom-0 hidden w-10 lg:block"
      >
        <span
          className={`absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full transition-colors ${
            active ? "bg-primary" : "bg-transparent group-hover:bg-primary/40"
          }`}
        />
      </span>
    </button>
  );
}
