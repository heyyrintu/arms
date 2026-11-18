import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
import Image from "next/image";
import hero from "@/public/photos/supplied/hero.webp";
import gig from "@/public/photos/supplied/gig.webp";
import warehouse from "@/public/photos/supplied/warehouse.webp";
import transport from "@/public/photos/supplied/transport.webp";
import hospitality from "@/public/photos/supplied/hospitality.webp";
const images = {
    hero: { src: hero, alt: "AI-generated concept of workforce representatives greeting each other with a handshake inside a warehouse." },
    people: { src: hero, alt: "AI-generated concept of a workforce coordination team meeting inside a warehouse." },
    warehouse: { src: warehouse, alt: "AI-generated concept of warehouse workers scanning and preparing parcels beside storage racks." },
    transport: { src: transport, alt: "AI-generated concept of a driver and a coordinator discussing work beside parked delivery trucks." },
    gig: { src: gig, alt: "AI-generated concept of delivery partners reviewing a pickup beside parked motorcycles." },
    hospitality: { src: hospitality, alt: "AI-generated concept of café colleagues preparing and serving coffee." },
};
type Props = {
    category: keyof typeof images;
    variant?: "card" | "feature" | "panorama";
};
export default async function WorkplaceImage({ category, variant = "card" }: Props) {
    const image = images[category];
    const isIndustry = category !== "hero" && category !== "people";
    const sizes = variant === "card"
        ? "(max-width: 650px) 90vw, (max-width: 1422px) 43vw, 624px"
        : "(max-width: 1422px) 90vw, 1280px";
    return localizeTree((<figure className={`workplace-image workplace-image-${variant}${isIndustry ? " workplace-image-industry" : ""}`}>
      <div className="workplace-image-frame">
        <Image src={image.src} alt={image.alt} sizes={sizes} preload={variant === "panorama"} loading={variant === "feature" ? "eager" : undefined}/>
      </div>
      <figcaption>AI-generated concept · illustrative people and workplaces</figcaption>
    </figure>), await getLocale());
}
