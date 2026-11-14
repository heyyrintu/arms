import type {ReactNode} from "react";
export default function SectionIntro({eyebrow,title,children}:{eyebrow:string;title:string;children?:ReactNode}) {
 return <div className="section-intro"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children&&<p className="section-summary">{children}</p>}</div>;
}
