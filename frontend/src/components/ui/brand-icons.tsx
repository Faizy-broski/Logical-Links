import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logical Links brand icon set (3D black & gold artwork).
 * Source files live in /public/brand-icons (transparent, 256px), derived from
 * /public/logical-links-icons. Every icon is a drop-in replacement for a lucide
 * icon: it takes a `className` for sizing and ignores colour / stroke props.
 */
export type BrandIconProps = { className?: string };
export type BrandIcon = (props: BrandIconProps) => React.JSX.Element;

function make(n: number): BrandIcon {
  const Icon: BrandIcon = ({ className }) => (
    <Image
      src={`/brand-icons/${n}.png`}
      alt=""
      aria-hidden
      width={256}
      height={256}
      className={cn("inline-block shrink-0 object-contain", className)}
    />
  );
  return Icon;
}

export const BrandIcons = {
  deviceTracking: make(1),
  location: make(2),
  dashboard: make(3),
  map: make(4),
  network: make(5),
  freight: make(6),
  truck: make(7),
  checklist: make(8),
  signal: make(9),
  shield: make(10),
  phone: make(11),
  mail: make(12),
  packageTracking: make(13),
  login: make(14),
  userAdd: make(15),
  fastDelivery: make(16),
  support: make(17),
  shieldTime: make(18),
  target: make(19),
  handshake: make(20),
  growth: make(21),
  bookDelivery: make(22),
  pickup: make(23),
  deliveredCare: make(24),
  freightBrokerage: make(25),
  transportTruck: make(26),
  coordination: make(27),
  dispatchRoute: make(28),
  lastMile: make(29),
  shipmentTracking: make(30),
} satisfies Record<string, BrandIcon>;
