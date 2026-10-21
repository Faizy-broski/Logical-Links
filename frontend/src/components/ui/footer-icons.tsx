import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logical Links gold footer icon set (client-supplied artwork).
 * Source files live in /public/footer-icons (transparent, 256px), cut from the
 * client's 6×3 reference sheet. Like BrandIcons, each icon takes a `className`
 * for sizing and ignores colour / stroke props.
 */
export type FooterIconProps = { className?: string };
export type FooterIcon = (props: FooterIconProps) => React.JSX.Element;

function make(name: string): FooterIcon {
  const Icon: FooterIcon = ({ className }) => (
    <Image
      src={`/footer-icons/${name}.png`}
      alt=""
      aria-hidden
      width={256}
      height={256}
      className={cn("inline-block shrink-0 object-contain", className)}
    />
  );
  return Icon;
}

export const FooterIcons = {
  partnerships: make("partnerships"),
  innovation: make("innovation"),
  connections: make("connections"),
  trackDelivery: make("track-delivery"),
  inquiry: make("inquiry"),
  address: make("address"),
  quote: make("quote"),
  bookDelivery: make("book-delivery"),
  accessHub: make("access-hub"),
  phone: make("phone"),
  email: make("email"),
  facebook: make("facebook"),
  hours: make("hours"),
  x: make("x"),
  linkedin: make("linkedin"),
  instagram: make("instagram"),
  support: make("support"),
} satisfies Record<string, FooterIcon>;
