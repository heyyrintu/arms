import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
import Image from "next/image";
import hero from "@/public/photos/concepts/hero-partnership.webp";
import gig from "@/public/photos/concepts/gig.webp";
import warehouse from "@/public/photos/concepts/warehouse.webp";
import transport from "@/public/photos/concepts/transport.webp";
import hospitality from "@/public/photos/concepts/hospitality.webp";
const images = {
    hero: { src: hero, alt: "AI-generated concept of a staffing coordinator greeting a gig worker, with colleagues planning workforce tasks." },
    people: { src: hero, alt: "AI-generated concept of colleagues coordinating work; these are fictional people and a fictional workplace." },
    warehouse: { src: warehouse, alt: "AI-generated concept of warehouse colleagues scanning and preparing parcels together." },
    transport: { src: transport, alt: "AI-generated concept of drivers and a fleet coordinator preparing a route beside a parked van." },
    gig: { src: gig, alt: "AI-generated concept of gig workers and a field coordinator reviewing tasks beside parked delivery equipment." },
    hospitality: { src: hospitality, alt: "AI-generated concept of café colleagues preparing coffee and coordinating counter service." },
};
type Props = {
    category: keyof typeof images;
    variant?: "card" | "feature" | "panorama";
};
export default async function WorkplaceImage({ category, variant = "card" }: Props) {
    const image = images[category];
    const sizes = variant === "card"
        ? "(max-width: 650px) 90vw, (max-width: 1422px) 43vw, 624px"
        : "(max-width: 1422px) 90vw, 1280px";
    return localizeTree((<figure className={`workplace-image workplace-image-${variant}`}>
      <div className="workplace-image-frame">
        <Image src={image.src} alt={image.alt} sizes={sizes} preload={variant === "panorama"} loading={variant === "feature" ? "eager" : undefined}/>
      </div>
      <figcaption>AI-generated concept · illustrative people and workplaces</figcaption>
    </figure>), await getLocale());
}
