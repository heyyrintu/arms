import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
import type { ReactNode } from "react";
export default async function SectionIntro({ eyebrow, title, children }: {
    eyebrow: string;
    title: string;
    children?: ReactNode;
}) {
    return localizeTree(<div className="section-intro"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children && <p className="section-summary">{children}</p>}</div>, await getLocale());
}
