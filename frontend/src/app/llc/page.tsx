"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandIcons } from "@/components/ui/brand-icons";
import { motion } from "framer-motion";
import Header from "@/components/landingPage/Header";
import HeroScrim from "@/components/landingPage/HeroScrim";
import Footer from "@/components/landingPage/Footer";

const drivers = [
  {
    icon: BrandIcons.shieldTime,
    title: "Reliability",
    description:
      "We understand that timing and dependability matter. Every movement is managed with care, communication, and attention to detail.",
  },
  {
    icon: BrandIcons.target,
    title: "Precision Execution",
    description:
      "Effective logistics requires planning and coordination. We combine operational discipline with technology to keep services organized and on track.",
  },
  {
    icon: BrandIcons.handshake,
    title: "Genuine Partnership",
    description:
      "You're more than a customer. We take the time to understand your needs and work with you to develop the right solution.",
  },
  {
    icon: BrandIcons.growth,
    title: "Continuous Growth",
    description:
      "We continue to improve our technology, processes, and capabilities so we can respond to changing customer needs and the evolving logistics landscape.",
  },
];

interface Pillar {
  id: string;
  title: string;
  image: string;
  /** Native width/height of the image so nothing is cropped. */
  aspect: string;
  /** Optional cap on rendered width (e.g. to shrink an oversized image). */
  maxWidth?: string;
  paragraphs: string[];
  items?: { title: string; description: string }[];
}

const pillars: Pillar[] = [
  {
    id: "mission",
    title: "Our Mission",
    image: "/mission.png",
    aspect: "1672 / 940",
    paragraphs: [
      "Our mission is to make shipping and delivery easier to manage by connecting businesses and individuals with solutions suited to their requirements. Through trusted carrier partnerships, careful planning, and responsive service, we work to meet a wide range of shipping needs with efficiency and care. We are committed to fair business practices, quality service, and lasting relationships built on trust.",
    ],
  },
  {
    id: "vision",
    title: "Our Vision",
    image: "/vision.png",
    aspect: "3 / 2",
    maxWidth: "85%",
    paragraphs: [
      "Our vision is to establish Logical Links as a respected Canadian logistics brand, recognized for its industry knowledge, forward-thinking approach, and ability to adapt to the changing needs of businesses and individuals. We aspire to build a company that creates lasting value through strong partnerships, continuous improvement, and smarter ways to manage shipping and delivery.",
    ],
  },
  {
    id: "values",
    title: "Our Values",
    image: "/value.png",
    aspect: "3 / 2",
    paragraphs: [
      "Our values shape how we conduct business, serve our customers, and work with our partners.",
    ],
    items: [
      { title: "Integrity", description: "We act honestly, treat others fairly, and communicate openly in all our business dealings." },
      { title: "Reliability", description: "We take our responsibilities seriously, follow through on our work, and strive to provide consistent service." },
      { title: "Customer Commitment", description: "We listen to our customers, understand their requirements, and work to identify suitable solutions for their shipping and delivery needs." },
      { title: "Innovation", description: "We embrace useful technology and new approaches that can improve our services and the way shipping requirements are managed." },
      { title: "Excellence", description: "We uphold high standards of quality, accuracy, and professionalism in our work." },
      { title: "Accountability", description: "We take ownership of our decisions, address challenges directly, and work toward effective resolutions." },
    ],
  },
];

export default function LLCPage() {
  return (
    <div className="landing-page min-h-screen bg-white flex flex-col">
      <Header />
      <div className="relative isolate flex flex-col bg-[url('/aboutus-hero.svg?v=2')] bg-[length:100%_100%] bg-center bg-no-repeat min-h-[50vw] pt-10">
        <HeroScrim />

        <section className="w-full max-w-6xl mx-auto my-auto pt-24 pb-12 px-6 text-start">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-3xl sm:text-6xl text-black font-bold leading-tight mb-6 uppercase"
          >
            Logical Links
            <br className="hidden sm:block" />{" "}
            <span className="text-primary">LLC</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-base sm:text-xl font-medium text-black max-w-xl"
          >
            Setting a higher standard in Canadian logistics.
          </motion.p>
        </section>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-black mb-4">
            About Us
          </h2>
          <p className="text-black leading-relaxed mb-4">
            Logical Links is a Canadian logistics company connecting
            businesses, organizations, and individuals with shipping and
            delivery solutions suited to their requirements. From freight
            brokerage and courier services to medical deliveries and
            specialized transport, we work across a range of shipping needs,
            recognizing that every shipment comes with its own priorities,
            timelines, and considerations.
          </p>
          <p className="text-black leading-relaxed mb-4">
            We believe effective logistics begins with understanding what needs
            to be moved, where it needs to go, and what matters most to the
            customer. By drawing on transportation partners, careful planning,
            and informed decision-making, we bring together the resources
            needed to address different shipping requirements. Our approach is
            built around clear communication, thoughtful service, and an
            understanding that every shipment matters to the person or
            organization relying on it.
          </p>
          <p className="text-black leading-relaxed mb-4">
            As Logical Links grows, we are committed to building lasting
            relationships with customers and industry partners through
            integrity, professionalism, and responsible business practices. We
            continue to explore ways to improve how shipping and delivery are
            managed, including the use of technology to support communication,
            access to information, and shipment visibility.
          </p>
          <p className="text-black leading-relaxed font-semibold mb-1">
            Driven by logic. Built on reliability. Delivered with purpose.
          </p>
          <p className="text-black leading-relaxed italic">
            Choose LLC with confidence.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-[8px] shadow-sm transition-colors"
          >
            Get Started
          </Link>
        </motion.div>

        <div className="mt-24 space-y-24">
          {pillars.map((pillar, i) => (
            <motion.section
              key={pillar.id}
              id={pillar.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="scroll-mt-28 grid gap-10 lg:grid-cols-2 lg:items-center"
            >
              <div
                className={`relative w-full overflow-hidden rounded-xs ${
                  i % 2 === 1 ? "lg:order-2" : ""
                }`}
                style={{
                  aspectRatio: pillar.aspect,
                  maxWidth: pillar.maxWidth,
                  marginInline: pillar.maxWidth ? "auto" : undefined,
                }}
              >
                <Image
                  src={pillar.image}
                  alt={pillar.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain"
                />
              </div>

              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <h2 className="text-2xl sm:text-4xl font-bold text-black mb-4">
                  {pillar.title}
                </h2>
                {pillar.paragraphs.map((paragraph, j) => (
                  <p
                    key={j}
                    className="text-black leading-relaxed mb-4 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
                {pillar.items && (
                  <div className="mt-6 space-y-4">
                    {pillar.items.map((item) => (
                      <div key={item.title}>
                        <p className="font-semibold text-primary">
                          {item.title}
                        </p>
                        <p className="text-black leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="mt-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-2xl sm:text-4xl font-bold text-black mb-10 text-center"
          >
            What Drives Us
          </motion.h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {drivers.map((driver, i) => (
              <motion.div
                key={driver.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                className="rounded-xs border border-gray-100 p-6 shadow-sm"
              >
                <div className="mb-4 flex h-20 items-center justify-start">
                  <driver.icon className="h-16 w-16" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  {driver.title}
                </h3>
                <p className="text-sm text-black leading-relaxed">
                  {driver.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
