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
  ctaLabel: "Get a Quote" | "Book Now" | "Request a Quote" | "Request a Consultation";
}

const SERVICES: ServiceDetail[] = [
  {
    id: "ftl",
    navLabel: "Full Truckload (FTL)",
    whyHeading: "Why companies rely on our FTL Solutions",
    bullets: [
      { title: "Dedicated Capacity", description: "Your shipment gets the truck space it needs without sharing capacity with other freight." },
      { title: "Direct, Efficient Transit", description: "Direct routing and fewer handling points help keep freight moving efficiently." },
      { title: "Secure, Controlled Movement", description: "Your freight is coordinated from pickup through delivery, with fewer transfers and handling points where the selected service allows." },
      { title: "Flexible Equipment", description: "Access to dry vans, reefers, flatbeds, and specialized equipment based on your shipment requirements and carrier availability." },
    ],
    image: "/service1.svg",
    imageHeading: "Your Full Truckload. Our Full Attention.",
    intro: "LLC connects businesses with dependable full truckload capacity through a trusted carrier network. As a freight broker, we match each shipment with suitable equipment and a carrier while coordinating the details from pickup through delivery.",
    closing: "We coordinate routing, carrier selection, pricing, shipment updates, and communication to help keep your freight moving efficiently.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "ltl",
    navLabel: "Less Than Truckload (LTL)",
    whyHeading: "Why companies rely on our LTL Solutions",
    bullets: [
      { title: "Cost-Effective Shipping", description: "Pay for the freight capacity your shipment requires rather than booking an entire truck." },
      { title: "Flexible Shipping Options", description: "Suitable for smaller freight shipments that do not require a full truckload." },
      { title: "Coordinated Freight Movement", description: "We help arrange suitable carrier services based on your shipment requirements." },
      { title: "Shipment Communication", description: "Receive updates through the communication and tracking services available for your shipment." },
    ],
    image: "/ltl.png",
    imageHeading: "The Right Load. The Right Solution.",
    intro: "LLC connects businesses with less-than-truckload services for freight that does not require an entire truck. Through our carrier network, we help identify suitable shipping options based on shipment size, weight, destination, timing, and budget.",
    closing: "We coordinate carrier selection, routing, pricing, and communication to help make your freight arrangements easier to manage.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "dedicated",
    navLabel: "Dedicated Freight Services",
    whyHeading: "Why companies rely on our Dedicated Freight Services",
    bullets: [
      { title: "Dedicated Capacity", description: "Explore dedicated truck capacity for shipments requiring specific scheduling or transport arrangements." },
      { title: "Planned Shipping Schedules", description: "Coordinate recurring shipments around your operational requirements." },
      { title: "Tailored Equipment Options", description: "Identify suitable equipment and carrier services for your freight." },
      { title: "Consistent Coordination", description: "Keep scheduling, carrier arrangements, and shipment communication organized." },
    ],
    image: "/dfs.jpg",
    imageHeading: "Dedicated Freight. Coordinated Around Your Needs.",
    intro: "LLC connects businesses with dedicated freight solutions suited to their shipment volumes, schedules, and operational requirements. Through our carrier network, we help identify suitable arrangements for recurring shipments or specific freight movements.",
    closing: "We coordinate carrier selection, scheduling, pricing, and communication according to each customer's needs and available service options.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "heavy",
    navLabel: "Specialty & Heavy Transport",
    whyHeading: "Why companies rely on our Specialty & Heavy Transport Solutions",
    bullets: [
      { title: "Specialized Equipment", description: "Identify equipment suited to the dimensions, weight, and requirements of your cargo." },
      { title: "Shipment Planning", description: "Consider routing, loading requirements, and transportation constraints when arranging a shipment." },
      { title: "Permit Coordination", description: "Coordinate applicable permit requirements with the appropriate service providers when required." },
      { title: "Specialized Carrier Options", description: "Connect with suitable carriers for specialized, oversized, or heavy freight, subject to availability." },
    ],
    image: "/sht.jpg",
    imageHeading: "Specialized Freight. Carefully Coordinated.",
    intro: "LLC helps businesses arrange transportation for specialized, oversized, and heavy cargo through its carrier network. Each shipment is assessed according to its dimensions, weight, destination, equipment requirements, and applicable transportation considerations.",
    closing: "We coordinate carrier selection, routing considerations, and related arrangements to help identify a suitable solution for the shipment.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "auto",
    navLabel: "Auto Transport",
    whyHeading: "Why customers choose our Auto Transport Services",
    bullets: [
      { title: "Suitable Transport Options", description: "Explore open or enclosed vehicle transport options based on your requirements and availability." },
      { title: "Coordinated Pickup and Delivery", description: "Arrange collection and delivery details with the selected transport provider." },
      { title: "Flexible Shipping Arrangements", description: "Request options for individual vehicles or multiple-vehicle shipments, subject to availability." },
      { title: "Clear Communication", description: "Stay informed through coordinated communication and the updates available from your provider." },
    ],
    image: "/auto.jpg",
    imageHeading: "Your Vehicle. The Right Transport Solution.",
    intro: "LLC connects individuals and businesses with vehicle transport services through its carrier network. Whether you need to move a personal vehicle or arrange transport for multiple vehicles, we help identify suitable options based on vehicle type, locations, timing, and budget.",
    closing: "We coordinate carrier selection, pricing, pickup and delivery arrangements, and communication throughout the process.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "courier",
    navLabel: "Courier Services",
    whyHeading: "Why customers choose our Courier Services",
    bullets: [
      { title: "Convenient Delivery Options", description: "Arrange courier services for eligible documents, parcels, and other shipments." },
      { title: "Flexible Scheduling", description: "Explore available pickup and delivery arrangements based on your location and timing requirements." },
      { title: "Coordinated Deliveries", description: "Organize the movement of your shipment from pickup to its intended destination." },
      { title: "Clear Communication", description: "Receive available updates through coordinated delivery communication." },
    ],
    image: "/courier.png",
    imageHeading: "Deliveries Made Simpler.",
    intro: "LLC connects individuals and businesses with courier solutions suited to their delivery requirements. We help coordinate pickup and delivery arrangements based on shipment type, destination, timing, and available service options.",
    closing: "",
    ctaLabel: "Book Now",
  },
  {
    id: "medics",
    navLabel: "Medical Delivery",
    whyHeading: "Why organizations choose our Medical Delivery Services",
    bullets: [
      { title: "Careful Coordination", description: "Arrange deliveries according to the shipment's handling instructions and requirements." },
      { title: "Time-Sensitive Deliveries", description: "Explore suitable options for shipments with specific delivery timeframes." },
      { title: "Special Handling Requirements", description: "Identify applicable handling and documentation requirements before arranging service." },
      { title: "Coordinated Communication", description: "Help keep customers informed throughout the delivery process." },
    ],
    image: "/medics.jpg",
    imageHeading: "Medical Deliveries. Carefully Coordinated.",
    intro: "LLC connects healthcare organizations, clinics, laboratories, pharmacies, and medical suppliers with delivery solutions suited to their requirements. We coordinate available services based on shipment contents, handling instructions, destinations, and required delivery timeframe.",
    closing: "Specialized requirements, such as temperature control or chain-of-custody procedures, must be confirmed with the selected provider before booking.",
    ctaLabel: "Request a Quote",
  },
  {
    id: "ecommerce",
    navLabel: "E-Commerce Delivery",
    whyHeading: "Why businesses choose our E-Commerce Delivery Services",
    bullets: [
      { title: "Online Order Delivery", description: "Arrange delivery of eligible online orders to residential and business destinations." },
      { title: "Flexible Delivery Options", description: "Explore available services based on shipment volume, delivery locations, and scheduling requirements." },
      { title: "Coordinated Order Movement", description: "Coordinate shipments from the designated pickup location to the recipient." },
      { title: "Delivery Communication", description: "Access available delivery updates through the selected service provider." },
    ],
    image: "/courier.png",
    imageHeading: "From Order to Doorstep.",
    intro: "LLC connects businesses with e-commerce delivery solutions to help move customer orders from designated pickup locations to their final destinations. We coordinate available carrier services according to shipment volume, delivery locations, scheduling needs, and service requirements.",
    closing: "Our focus is on making delivery arrangements easier to manage through clear communication and practical coordination.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "air",
    navLabel: "Air Freight",
    whyHeading: "Why companies rely on our Air Freight Solutions",
    bullets: [
      { title: "Time-Sensitive Shipments", description: "Explore air cargo options when transit time is a priority." },
      { title: "International Reach", description: "Identify available domestic and international air freight options for your shipment." },
      { title: "Customs Coordination", description: "Coordinate applicable documentation and customs arrangements through appropriate service providers." },
      { title: "Specialized Cargo", description: "Explore suitable options for eligible technical, high-value, and specialized shipments." },
      { title: "Flexible Routing", description: "Consider available routes and service options based on your shipment requirements." },
    ],
    image: "/air.png",
    imageHeading: "Air Freight. Thoughtfully Coordinated.",
    intro: "LLC connects customers with air freight solutions for shipments requiring air cargo services, international reach, or time-sensitive arrangements. We help identify suitable options through our service provider network based on cargo requirements, destination, timing, and budget.",
    closing: "We coordinate available routing, carrier selection, pricing, documentation requirements, and related arrangements according to the shipment's needs.",
    ctaLabel: "Get a Quote",
  },
  {
    id: "consultancy",
    navLabel: "Consultancy & Advisory Services",
    whyHeading: "Why organizations choose our Logistics Consultancy Services",
    bullets: [
      { title: "Logistics Assessment", description: "Review shipping requirements, existing arrangements, and operational challenges." },
      { title: "Freight Strategy", description: "Explore shipping methods and carrier options suited to your requirements." },
      { title: "Cost Considerations", description: "Assess freight arrangements and identify potential opportunities to improve efficiency." },
      { title: "Process Improvement", description: "Explore practical approaches to improve shipment planning, coordination, and communication." },
    ],
    image: "/adv.png",
    imageHeading: "Better Decisions. Smarter Logistics.",
    intro: "LLC provides logistics consultancy and advisory support to businesses seeking to better understand and manage their shipping requirements. We help assess existing arrangements, explore suitable service options, and identify practical opportunities to improve coordination and decision-making.",
    closing: "Our recommendations are guided by each organization's requirements, priorities, and operational objectives.",
    ctaLabel: "Request a Consultation",
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
    label: "Last-Mile Delivery Services",
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
                    {active.closing && (
                      <p className="text-sm text-black leading-relaxed">
                        {active.closing}
                      </p>
                    )}
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
