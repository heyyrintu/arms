import Link from "next/link";
import WorkplaceImage from "@/components/WorkplaceImage";
import {industries} from "@/content/site";
import {pageMetadata} from "@/lib/metadata";
export const metadata=pageMetadata("Industries We Serve","Equal commitment to warehousing, transportation and hospitality workforce solutions.");
export default function Industries(){return <><section className="page-hero container"><p className="eyebrow">INDUSTRIES WE SERVE</p><h1>Every industry moves differently.<br/><span>People move them all.</span></h1><p className="lead">Dedicated workforce thinking for different types of work. Equal attention to every industry we serve.</p></section><section className="section container"><div className="industry-grid">{industries.map((industry,index)=><article className="industry-card" key={industry.slug}><WorkplaceImage category={index===0?"warehouse":index===1?"transport":"hospitality"}/><div className="industry-card-text"><p className="eyebrow">{industry.kicker}</p><h2>{industry.name}</h2><p>{industry.summary}</p><Link className="text-link" href={`/industries/${industry.slug}`}>Explore industry ↗</Link></div></article>)}</div></section></>}
