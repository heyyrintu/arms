import Image from "next/image";
import hero from "@/public/photos/concepts/hero.webp";
import warehouse from "@/public/photos/concepts/warehouse.webp";
import transport from "@/public/photos/concepts/transport.webp";
import hospitality from "@/public/photos/concepts/hospitality.webp";

const images = {
  hero: { src: hero, alt: "AI-generated concept of a mixed workforce discussing a shift plan in a shared coordination space." },
  people: { src: hero, alt: "AI-generated concept of colleagues coordinating work; these are fictional people and a fictional workplace." },
  warehouse: { src: warehouse, alt: "AI-generated concept of warehouse colleagues scanning and preparing parcels together." },
  transport: { src: transport, alt: "AI-generated concept of drivers and a fleet coordinator preparing a route beside a parked van." },
  hospitality: { src: hospitality, alt: "AI-generated concept of café colleagues preparing coffee and coordinating counter service." },
};

type Props = {
  category: keyof typeof images;
  variant?: "card" | "feature" | "panorama";
};

export default function WorkplaceImage({ category, variant = "card" }: Props) {
  const image = images[category];
  const sizes = variant === "card"
    ? "(max-width: 940px) 90vw, (max-width: 1422px) 29vw, 415px"
    : "(max-width: 1422px) 90vw, 1280px";

  return (
    <figure className={`workplace-image workplace-image-${variant}`}>
      <div className="workplace-image-frame">
        <Image src={image.src} alt={image.alt} sizes={sizes} preload={variant === "panorama"} loading={variant === "feature" ? "eager" : undefined} />
      </div>
      <figcaption>AI-generated concept · illustrative people and workplaces</figcaption>
    </figure>
  );
}
