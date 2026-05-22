"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  ShoppingCart,
  User,
  ChevronDown,
  Menu,
  Search,
  Star,
  ChevronRight,
  Phone,
  Truck,
  ArrowRight,
  Clock3,
  CircleDot,
  ChevronLeft,
  Info,
  CarFront,
  Disc3,
  Dot,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const deals = [
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?q=80&w=1200&auto=format&fit=crop" },
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200&auto=format&fit=crop" },
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop" },
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop" },
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1200&auto=format&fit=crop" },
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?q=80&w=1200&auto=format&fit=crop" },
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200&auto=format&fit=crop" },
  { title: "Up to $200 Off", brand: "Nokian Tyres", date: "Mar 15th – Jun 15th 2026", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop" },
];

const tyres = [
  // Page 1
  { id: 1,  brand: "MICHELIN",    name: "Pilot Sport 4",    size: "225/45R17", price: "$189", oldPrice: "$236", rating: "4.8", reviews: "(412)", discount: "-20%", image: "/tyre.png" },
  { id: 2,  brand: "BRIDGESTONE", name: "Potenza Sport",    size: "245/40R18", price: "$215", oldPrice: "$268", rating: "4.7", reviews: "(389)", discount: "-19%", image: "/tyre.png" },
  { id: 3,  brand: "GOODYEAR",    name: "Eagle F1 Asymm",   size: "235/45R18", price: "$174", oldPrice: "$220", rating: "4.6", reviews: "(531)", discount: "-21%", image: "/tyre.png" },
  { id: 4,  brand: "PIRELLI",     name: "P Zero",           size: "255/40R19", price: "$248", oldPrice: "$310", rating: "4.9", reviews: "(278)", discount: "-20%", image: "/tyre.png" },
  { id: 5,  brand: "CONTINENTAL", name: "SportContact 7",   size: "225/45R17", price: "$196", oldPrice: "$245", rating: "4.7", reviews: "(342)", discount: "-20%", image: "/tyre.png" },
  { id: 6,  brand: "DUNLOP",      name: "Sport Maxx RT2",   size: "235/35R19", price: "$165", oldPrice: "$206", rating: "4.5", reviews: "(614)", discount: "-20%", image: "/tyre.png" },
  { id: 7,  brand: "MICHELIN",    name: "CrossClimate 2",   size: "205/55R16", price: "$142", oldPrice: "$178", rating: "4.8", reviews: "(820)", discount: "-20%", image: "/tyre.png" },
  { id: 8,  brand: "BRIDGESTONE", name: "Turanza T005",     size: "215/60R16", price: "$129", oldPrice: "$161", rating: "4.6", reviews: "(455)", discount: "-20%", image: "/tyre.png" },
  // Page 2
  { id: 9,  brand: "GOODYEAR",    name: "EfficientGrip",    size: "195/65R15", price: "$108", oldPrice: "$135", rating: "4.5", reviews: "(702)", discount: "-20%", image: "/tyre.png" },
  { id: 10, brand: "PIRELLI",     name: "Cinturato P7",     size: "225/50R17", price: "$155", oldPrice: "$194", rating: "4.7", reviews: "(381)", discount: "-20%", image: "/tyre.png" },
  { id: 11, brand: "CONTINENTAL", name: "EcoContact 6",     size: "205/55R16", price: "$118", oldPrice: "$148", rating: "4.6", reviews: "(593)", discount: "-20%", image: "/tyre.png" },
  { id: 12, brand: "DUNLOP",      name: "BluResponse",      size: "195/60R15", price: "$99",  oldPrice: "$124", rating: "4.4", reviews: "(477)", discount: "-20%", image: "/tyre.png" },
  { id: 13, brand: "MICHELIN",    name: "Primacy 4+",       size: "215/55R17", price: "$163", oldPrice: "$204", rating: "4.8", reviews: "(348)", discount: "-20%", image: "/tyre.png" },
  { id: 14, brand: "BRIDGESTONE", name: "Alenza 001",       size: "235/55R19", price: "$198", oldPrice: "$248", rating: "4.7", reviews: "(267)", discount: "-20%", image: "/tyre.png" },
  { id: 15, brand: "GOODYEAR",    name: "UltraGrip 9+",     size: "205/60R16", price: "$121", oldPrice: "$151", rating: "4.6", reviews: "(539)", discount: "-20%", image: "/tyre.png" },
  { id: 16, brand: "PIRELLI",     name: "Scorpion Verde",   size: "255/50R19", price: "$212", oldPrice: "$265", rating: "4.7", reviews: "(319)", discount: "-20%", image: "/tyre.png" },
  // Page 3
  { id: 17, brand: "CONTINENTAL", name: "CrossContact RX",  size: "235/65R17", price: "$178", oldPrice: "$222", rating: "4.6", reviews: "(421)", discount: "-20%", image: "/tyre.png" },
  { id: 18, brand: "DUNLOP",      name: "Grandtrek AT5",    size: "265/65R17", price: "$195", oldPrice: "$244", rating: "4.5", reviews: "(287)", discount: "-20%", image: "/tyre.png" },
  { id: 19, brand: "MICHELIN",    name: "Latitude Sport 3", size: "275/45R21", price: "$289", oldPrice: "$362", rating: "4.9", reviews: "(198)", discount: "-20%", image: "/tyre.png" },
  { id: 20, brand: "BRIDGESTONE", name: "Dueler HP Sport",  size: "255/55R18", price: "$224", oldPrice: "$280", rating: "4.7", reviews: "(305)", discount: "-20%", image: "/tyre.png" },
  { id: 21, brand: "GOODYEAR",    name: "Wrangler HP All",  size: "235/70R16", price: "$146", oldPrice: "$182", rating: "4.5", reviews: "(443)", discount: "-20%", image: "/tyre.png" },
  { id: 22, brand: "PIRELLI",     name: "Scorpion ATR",     size: "265/70R16", price: "$168", oldPrice: "$210", rating: "4.6", reviews: "(376)", discount: "-20%", image: "/tyre.png" },
  { id: 23, brand: "CONTINENTAL", name: "VanContact 200",   size: "215/65R16", price: "$134", oldPrice: "$168", rating: "4.5", reviews: "(512)", discount: "-20%", image: "/tyre.png" },
  { id: 24, brand: "DUNLOP",      name: "Econodrive",       size: "195/70R15", price: "$95",  oldPrice: "$119", rating: "4.4", reviews: "(628)", discount: "-20%", image: "/tyre.png" },
];

const TYRES_PER_PAGE = 8;

function chunkTyres(arr: typeof tyres, size: number) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

const tyrePages = chunkTyres(tyres, TYRES_PER_PAGE);

type Tyre = typeof tyres[0];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TyreCard({ item }: { item: Tyre }) {
  return (
    <Card className="group overflow-hidden rounded-3xl border border-black/5 bg-[#fbfbfb] shadow-none transition-all duration-300 hover:-translate-y-1 hover:bg-white">
      <CardContent className="p-0">
        <div className="relative flex h-60 items-center justify-center border-b border-black/5 bg-white">
          <span className="absolute left-4 top-4 z-10 rounded-full bg-[#dfad08] px-3 py-1 text-[11px] font-bold text-white">
            {item.discount}
          </span>
          <Image
            src={item.image}
            alt={item.name}
            width={200}
            height={200}
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/35">{item.brand}</p>
              <h3 className="mt-1 font-oswald text-2xl font-black leading-none tracking-tight text-black">{item.name}</h3>
              <p className="mt-1.5 text-sm text-black/45">{item.size}</p>
            </div>
            <div className="mt-0.5 flex shrink-0 items-center gap-1">
              <Star className="h-3 w-3 fill-[#dfad08] text-[#dfad08]" />
              <span className="text-xs font-semibold text-black/80">{item.rating}</span>
              <span className="text-xs text-black/35">{item.reviews}</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-oswald text-3xl font-black tracking-tight text-black">{item.price}</span>
            <span className="text-xs text-black/30 line-through">{item.oldPrice}</span>
          </div>
          <Button className="mt-4 h-10 w-full rounded-full bg-[#dfad08] text-sm font-semibold text-white hover:bg-[#c89907]">
            <ShoppingCart className="mr-2 h-3.5 w-3.5" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // ── Deals carousel ─────────────────────────────────────────────────────────
  const autoplay = useRef(Autoplay({ delay: 4500, stopOnInteraction: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", dragFree: true, loop: true },
    [autoplay.current],
  );
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // ── Tyres carousel ──────────────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const [tyresEmblaRef, tyresEmblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
  });

  const tyresScrollPrev = useCallback(() => tyresEmblaApi?.scrollPrev(), [tyresEmblaApi]);
  const tyresScrollNext = useCallback(() => tyresEmblaApi?.scrollNext(), [tyresEmblaApi]);

  const onTyresInit = useCallback(() => {
    if (!tyresEmblaApi) return;
    setScrollSnaps(tyresEmblaApi.scrollSnapList());
  }, [tyresEmblaApi]);

  const onTyresSelect = useCallback(() => {
    if (!tyresEmblaApi) return;
    setSelectedIndex(tyresEmblaApi.selectedScrollSnap());
  }, [tyresEmblaApi]);

  useEffect(() => {
    if (!tyresEmblaApi) return;
    onTyresInit();
    onTyresSelect();
    tyresEmblaApi.on("reInit", onTyresInit);
    tyresEmblaApi.on("select", onTyresSelect);
    return () => {
      tyresEmblaApi.off("reInit", onTyresInit);
      tyresEmblaApi.off("select", onTyresSelect);
    };
  }, [tyresEmblaApi, onTyresInit, onTyresSelect]);

  return (
    <main className="bg-[#f8f5ec] text-zinc-900">

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#050505]">
        <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">support@tyrevault.com.au</span>
          </div>
          <div className="hidden items-center gap-4 text-sm text-zinc-300 xl:flex">
            <span>Free shipping on all orders</span>
            <span className="text-[#dfad08]">|</span>
            <span>4.8 ★ ShopperApproved rating</span>
          </div>
          <div className="flex items-center">
            <span className="hidden px-4 text-sm text-zinc-300 lg:inline">Customer Support</span>
            <Button className="h-10 rounded-none bg-[#dfad08] px-4 text-sm font-semibold text-white hover:bg-[#c89907]">
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              666-333-7777
            </Button>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full text-white">
        <div className="border-b border-white/20 bg-black/20 backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-10">
            {/* Left */}
            <div className="flex items-center gap-5 lg:gap-10">
              <Button
                size="icon"
                variant="outline"
                aria-label="Open menu"
                className="h-12 w-12 rounded-full border-white/20 bg-transparent text-white hover:border-[#dfad08] hover:bg-[#dfad08]/10 hover:text-[#dfad08]"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <nav className="hidden items-center gap-8 lg:flex">
                {[
                  { label: "Shop Tires", chevron: true },
                  { label: "Accessories" },
                  { label: "Deals" },
                ].map(({ label, chevron }) => (
                  <Link
                    key={label}
                    href="#"
                    className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:text-[#dfad08]"
                  >
                    {label}
                    {chevron && <ChevronDown className="h-3.5 w-3.5" />}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center Logo */}
            <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
              <Image src="/logo.svg" width={240} height={60} alt="Tyre Vault" className="object-contain" />
            </div>
            <div className="lg:hidden">
              <Image src="/logo.svg" width={160} height={40} alt="Tyre Vault" className="object-contain" />
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 lg:flex">
                <Button size="icon" variant="ghost" aria-label="Account" className="text-white hover:bg-transparent hover:text-[#dfad08]">
                  <User className="h-5 w-5" />
                </Button>
                <div className="h-5 w-px bg-white/20" />
                <Button size="icon" variant="ghost" aria-label="Cart" className="text-white hover:bg-transparent hover:text-[#dfad08]">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative hidden lg:block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search tyres..."
                  className="h-11 w-64 rounded-full border-white/15 bg-white/5 pl-11 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#dfad08]"
                />
              </div>
              <Button size="icon" variant="ghost" aria-label="Search" className="text-white hover:bg-transparent hover:text-[#dfad08] lg:hidden">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[680px] overflow-hidden bg-[url('/heroBg.svg')] bg-cover bg-center bg-no-repeat text-white md:min-h-[860px]">
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-20 pt-12 sm:px-6 lg:px-10 lg:pt-16">
          <div className="grid items-center gap-8 lg:min-h-[500px] lg:grid-cols-12">
            {/* Heading */}
            <div className="lg:col-span-7">
              <div className="uppercase text-[#f8f4ea]">
                <h1 className="origin-bottom font-oswald font-black leading-[0.85] tracking-[-0.06em] [transform:scaleY(1.15)] text-[68px] sm:text-[96px] md:text-[130px] lg:text-[158px]">
                  PERFECT
                </h1>
                <div className="-mt-1 flex items-end gap-3 sm:gap-4 md:-mt-2">
                  <h1 className="font-oswald font-black leading-none tracking-[-0.06em] text-[68px] sm:text-[96px] md:text-[130px] lg:text-[158px]">
                    TYRES
                  </h1>
                  <div className="mb-2 flex flex-col font-oswald font-semibold leading-[0.9] tracking-[-0.04em] text-[20px] sm:text-[28px] md:text-[36px] lg:text-[46px]">
                    <span>FOR</span>
                    <span>EVERY</span>
                    <span>VEHICLE</span>
                  </div>
                </div>
              </div>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-base md:text-lg">
                Search by size, vehicle, or brand and get the best deals instantly — from the world's most trusted tyre makers.
              </p>
            </div>

            {/* Stat badges — desktop only */}
            <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:items-end lg:gap-5 lg:pt-6">
              {[
                { value: "24HR", label: "Fast Delivery", icon: <Clock3 className="h-5 w-5 stroke-[1.5]" /> },
                { value: "500+", label: "Tyre Options", icon: <CircleDot className="h-5 w-5 stroke-[1.5]" />, offset: "mr-20" },
                { value: "4.9★", label: "Customer Rating", icon: <User className="h-5 w-5 stroke-[1.5]" />, offset: "mr-4" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`flex w-56 items-center justify-between rounded-full border border-white/10 bg-black/40 px-5 py-2.5 backdrop-blur-md transition-transform hover:scale-105 ${stat.offset ?? ""}`}
                >
                  <div>
                    <p className="text-2xl font-black tracking-tight text-white">{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{stat.label}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400">
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search widget */}
          <div className="mt-10 rounded-3xl border border-white/10 bg-[#10141a]/90 p-4 shadow-2xl backdrop-blur-2xl sm:p-5 lg:mt-12">
            <div className="mb-4 inline-flex w-full max-w-xl rounded-2xl bg-[#161c24] p-1.5">
              <button className="flex-1 rounded-xl py-2.5 text-center text-sm font-bold text-zinc-400 transition hover:text-white">
                Search By Tyre Size
              </button>
              <button className="flex-1 rounded-xl bg-[#dfad08] py-2.5 text-center text-sm font-bold text-black shadow">
                Search By Vehicle
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_160px]">
              {["Make", "Model", "Year", "Variant"].map((label) => (
                <div
                  key={label}
                  className="group cursor-pointer rounded-2xl border border-transparent bg-[#171e27] px-4 py-3 transition hover:border-white/5"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-400">Select {label.toLowerCase()}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:translate-y-0.5" />
                  </div>
                </div>
              ))}
              <button className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-[#3a3f47] py-3 text-sm font-bold text-white transition hover:bg-[#464c56] active:scale-95 lg:col-span-1">
                <Search className="h-4 w-4" />
                Find Tyres
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEALS ───────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-[#f5f5f5] py-16 md:py-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 flex items-start justify-between px-4 sm:px-6 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfad08]">Limited Time</p>
              <h2 className="mt-2 font-oswald text-4xl font-black tracking-tight text-black sm:text-5xl">Deals & Offers</h2>
              <p className="mt-2 text-base text-black/65">Get cash back directly from the manufacturer!</p>
            </div>
            <div className="hidden shrink-0 items-center gap-3 md:flex">
              <Button
                size="icon"
                variant="outline"
                aria-label="Previous deal"
                onClick={scrollPrev}
                className="h-10 w-10 rounded-full border-[#dfad08] bg-transparent text-[#dfad08] hover:bg-[#dfad08]/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                aria-label="Next deal"
                onClick={scrollNext}
                className="h-10 w-10 rounded-full bg-[#dfad08] text-white hover:bg-[#c89907]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden pl-4 sm:pl-6 lg:pl-10" ref={emblaRef}>
            <div className="flex gap-4">
              {deals.map((deal, index) => (
                <div
                  key={index}
                  className="min-w-[240px] flex-[0_0_240px] sm:min-w-[265px] sm:flex-[0_0_265px] md:min-w-[285px] md:flex-[0_0_285px]"
                >
                  <Card className="group relative overflow-hidden rounded-3xl border-0 bg-black shadow-none">
                    <div className="relative h-[340px]">
                      <Image
                        src={deal.image}
                        alt={deal.title}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
                      <div className="absolute left-4 top-4 flex w-[calc(100%-32px)] items-start justify-between">
                        <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                          NOKIAN TYRES
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
                          <Info className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full p-5">
                        <p className="text-sm text-white/80">{deal.brand}</p>
                        <h3 className="mt-1 font-oswald text-3xl font-black leading-none tracking-tight text-white">{deal.title}</h3>
                        <p className="mt-2 text-xs text-white/55">{deal.date}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────────────── */}
      <section
        className="overflow-hidden bg-cover bg-center bg-no-repeat py-16 md:py-24"
        style={{ backgroundImage: "url('/services.svg')" }}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-10">
          {/* Left */}
          <div className="max-w-xs shrink-0 lg:max-w-[300px]">
            <h2 className="font-oswald text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl">
              Services That Keep You Moving
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              Three important things to know about Tyre Vault.
            </p>
            <Button className="mt-6 h-12 rounded-full bg-[#dfad08] px-8 font-oswald text-lg font-bold italic text-white hover:bg-[#c89907]">
              Get Expert Help
            </Button>
            <div className="mt-10">
              <svg width="160" height="36" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#dfad08]">
                <path d="M0 20C20 20 20 0 40 0C60 0 60 20 80 20C100 20 100 0 120 0C140 0 140 20 160 20C170 20 175 15 180 10" stroke="currentColor" strokeWidth="6" />
                <path d="M0 20C20 20 20 40 40 40C60 40 60 20 80 20C100 20 100 40 120 40C140 40 140 20 160 20C170 20 175 25 180 30" stroke="currentColor" strokeWidth="6" />
              </svg>
            </div>
          </div>

          {/* Cards */}
          <div className="grid flex-1 gap-5 sm:grid-cols-3">
            {[
              {
                num: "01",
                icon: <Disc3 className="h-7 w-7" />,
                title: ["Massive Tyre", "Selection"],
                desc: "Browse premium tyres for every vehicle, size, and driving style from trusted global brands.",
                accent: false,
              },
              {
                num: "02",
                icon: <Truck className="h-7 w-7" />,
                title: ["Fast &", "Reliable Delivery"],
                desc: "Get your tyres delivered quickly with secure nationwide shipping and real-time tracking.",
                accent: false,
              },
              {
                num: "03",
                icon: <CarFront className="h-7 w-7" />,
                title: ["Perfect Vehicle", "Matching"],
                desc: "Use our smart search to find the right tyres for your exact vehicle in seconds.",
                accent: true,
              },
            ].map((card) => (
              <Card
                key={card.num}
                className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  card.accent
                    ? "border-0 bg-[#dfad08] hover:bg-[#c89907]"
                    : "border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10"
                }`}
              >
                <span className={`absolute right-4 top-1 font-black leading-none text-8xl ${card.accent ? "text-white/20" : "text-white/[0.07]"}`}>
                  {card.num}
                </span>
                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
                    {card.icon}
                  </div>
                  <h3 className="mt-6 font-oswald text-3xl font-black uppercase leading-tight text-white">
                    {card.title[0]}
                    <br />
                    {card.title[1]}
                  </h3>
                  <div className={`my-5 h-px w-full ${card.accent ? "bg-white/25" : "bg-white/10"}`} />
                  <p className={`text-base leading-relaxed ${card.accent ? "text-white/90" : "text-white/70"}`}>{card.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── HELP ────────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-[#f7f6f2] py-16 md:py-24">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-10 xl:gap-20">
          {/* Image */}
          <div className="relative flex items-center">
            <div className="absolute left-[-180px] hidden h-[480px] w-[440px] rounded-r-[200px] bg-[#dfad08] lg:block" />
            <div className="relative z-10 w-full overflow-hidden rounded-3xl shadow-xl">
              <Image
                src="/help.svg"
                alt="Tyre Fitting Help"
                width={540}
                height={420}
                className="h-[300px] w-full object-cover sm:h-[380px] lg:h-[420px]"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfad08]">Expert Advice</p>
            <h2 className="mt-2 font-oswald text-4xl font-black leading-tight tracking-tight text-black sm:text-5xl">
              Need Help Finding Tyres?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-black/65 sm:text-lg">
              Choosing the right tyres makes a huge difference in safety, comfort, and performance. Our team helps you find the perfect match based on your vehicle, driving habits, and budget.
            </p>
            <p className="mt-3 text-base leading-relaxed text-black/65 sm:text-lg">
              Whether you need performance tyres, everyday options, SUV tyres, or all-season solutions — we make the process simple and stress-free.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                "Premium Global Tyre Brands",
                "Competitive Market Prices",
                "Expert Vehicle Matching",
                "Secure Online Shopping",
                "Fast & Reliable Delivery",
                "Trusted By Thousands",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-black/70 sm:text-base">
                  <Dot className="h-4 w-4 shrink-0 text-[#dfad08]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button className="mt-8 h-12 rounded-full bg-[#dfad08] px-8 font-oswald text-xl font-bold italic text-white hover:bg-[#c89907]">
              Get Expert Help
            </Button>
          </div>
        </div>
      </section>

      {/* ── VEHICLE TYPES ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f7f7f4] py-16 md:py-24">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[#f4efdf] lg:block" />
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfad08]">Browse</p>
            <h2 className="mt-2 font-oswald text-4xl font-black leading-tight tracking-tight text-black sm:text-5xl md:text-6xl">
              Shop By Vehicle Type
            </h2>
            <p className="mt-3 text-base text-black/65 sm:text-lg">
              Explore premium tyre options tailored for every vehicle, road, and driving style.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:mt-12 lg:grid-cols-5">
            {[
              { title: "Sedan", image: "/Sedan.svg" },
              { title: "SUV", image: "/SUV.svg" },
              { title: "4×4", image: "/4x4.svg" },
              { title: "Truck", image: "/Truck.svg" },
              { title: "Sports", image: "/Sports.svg" },
            ].map((item) => (
              <Card
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-black/5 bg-[#f9f9f9] shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-[#dfad08]/30 hover:bg-white"
              >
                <CardContent className="p-0">
                  <div className="relative flex h-36 items-center justify-center overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="py-3 text-center">
                    <h3 className="text-sm font-bold tracking-tight text-black">{item.title}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BRANDS ──────────────────────────────────────────────────── */}
      <section className="border-y border-black/5 bg-[#f7f7f5] py-12 md:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfad08]">Trusted Brands</p>
            <button className="group flex items-center gap-2 text-sm font-medium text-black/60 transition-colors hover:text-black">
              Shop By Brands
              <ArrowRight className="h-4 w-4 text-[#dfad08] transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
          <div className="mt-10 flex items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-between">
            {["Michelin", "Bridgestone", "Goodyear", "Pirelli", "Continental", "Dunlop"].map((brand, index, arr) => (
              <div key={brand} className="flex shrink-0 items-center">
                <button className="px-4 font-oswald text-2xl font-black tracking-tight text-black/40 transition-all duration-300 hover:text-black md:text-3xl lg:text-[32px]">
                  {brand}
                </button>
                {index !== arr.length - 1 && <div className="h-8 w-px bg-black/10" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLING TYRES ──────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-[#f7f7f5] py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfad08]">Trending</p>
              <h2 className="mt-2 font-oswald text-4xl font-black leading-tight tracking-tight text-black sm:text-5xl md:text-6xl">
                Best Selling Tyres
              </h2>
              <p className="mt-2 text-base text-black/65 sm:text-lg">
                Our most popular selections across every road condition.
              </p>
            </div>
            <div className="mt-4 hidden shrink-0 items-center gap-3 lg:flex">
              <Button
                size="icon"
                variant="outline"
                aria-label="Previous tyres"
                onClick={tyresScrollPrev}
                className="h-11 w-11 rounded-full border-[#dfad08]/30 bg-white text-[#dfad08] shadow-none hover:bg-[#dfad08]/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                aria-label="Next tyres"
                onClick={tyresScrollNext}
                className="h-11 w-11 rounded-full border-0 bg-[#dfad08] text-white hover:bg-[#c89907]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-12 overflow-hidden" ref={tyresEmblaRef}>
            <div className="flex">
              {tyrePages.map((page, pageIndex) => (
                <div key={pageIndex} className="min-w-0 flex-[0_0_100%]">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {page.map((item) => (
                      <TyreCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {scrollSnaps.length > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to page ${index + 1}`}
                  onClick={() => tyresEmblaApi?.scrollTo(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    selectedIndex === index ? "w-8 bg-[#dfad08]" : "w-4 bg-black/25"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfad08]">Process</p>
            <h2 className="mt-2 font-oswald text-4xl font-black tracking-tight text-black sm:text-5xl">How It Works</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { step: "01", title: "Find the Right Tyres", desc: "Search by vehicle, size, or brand. Use our smart system to find tyres made for your exact car." },
              { step: "02", title: "Schedule Appointment", desc: "Pick a time that works for you. We'll have your tyres ready and our team prepared for a seamless visit." },
              { step: "03", title: "Get Installation", desc: "Expert fitting at your nearest location — fast, clean, and professionally done." },
            ].map((item) => (
              <Card key={item.step} className="rounded-3xl border-none bg-[#f8f5ec]">
                <CardContent className="space-y-4 p-7 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dfad08] font-oswald text-lg font-black text-white">
                    {item.step}
                  </div>
                  <h3 className="font-oswald text-2xl font-black text-black sm:text-3xl">{item.title}</h3>
                  <p className="text-base leading-relaxed text-black/60">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[#f7f7f5] py-16 md:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div className="relative h-72 overflow-hidden rounded-3xl sm:h-96 lg:h-auto">
            <Image
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop"
              alt="FAQ"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfad08]">Support</p>
            <h2 className="mt-2 font-oswald text-4xl font-black tracking-tight text-black sm:text-5xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 space-y-3">
              {[
                "Are all tyres brand new?",
                "Do you offer fitting services?",
                "Can I return tyres?",
                "Do you provide warranty?",
              ].map((item) => (
                <Card key={item} className="rounded-2xl border-none bg-white shadow-none">
                  <CardContent className="flex items-center justify-between p-5">
                    <span className="text-sm font-semibold text-black sm:text-base">{item}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-black/35" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="bg-[#dfad08] py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-oswald text-4xl font-black text-black sm:text-5xl">4.8 ★ Customer Reviews</h2>
              <p className="mt-2 text-base text-black/65">People love the quality and service.</p>
            </div>
            <Button className="h-11 w-fit rounded-full bg-black px-6 text-sm font-semibold text-white hover:bg-zinc-800">
              View Reviews
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Muhammad Hasan", location: "Lahore, Pakistan" },
              { name: "James Walker", location: "Sydney, Australia" },
              { name: "Emily Carter", location: "Melbourne, Australia" },
            ].map((reviewer) => (
              <Card key={reviewer.name} className="rounded-3xl border-none bg-white shadow-none">
                <CardContent className="space-y-4 p-6 sm:p-7">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#dfad08] text-[#dfad08]" />
                    ))}
                  </div>
                  <p className="text-base leading-relaxed text-zinc-600">
                    "Absolutely smooth experience. Fast delivery, clean installation, and premium support throughout."
                  </p>
                  <div>
                    <p className="text-sm font-bold text-black">{reviewer.name}</p>
                    <p className="text-xs text-zinc-400">{reviewer.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-black py-16 text-white md:py-20">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:px-10">
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#dfad08] px-3 py-2 font-oswald text-lg font-black text-black">TV</div>
              <div>
                <h3 className="font-oswald text-2xl font-black">Tyre Vault</h3>
                <p className="text-sm text-zinc-400">Premium tyre ecosystem</p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              High-performance tyre commerce platform built with speed, trust, and precision engineering.
            </p>
            <div className="mt-7 flex gap-3">
              {[FaFacebookF, FaInstagram, FaTwitter, FaYoutube].map((Icon, i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 transition hover:bg-[#dfad08] hover:text-black"
                >
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
          {["Quick Links", "Brands", "Support"].map((title) => (
            <div key={title}>
              <h4 className="mb-5 font-oswald text-lg font-bold">{title}</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                {["About", "Products", "Services", "Contact"].map((link) => (
                  <li key={link}>
                    <Link href="#" className="transition hover:text-white">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-14 max-w-[1400px] border-t border-zinc-800 px-4 pt-7 text-center text-xs text-zinc-500 sm:px-6 lg:px-10">
          © 2026 Tyre Vault. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
