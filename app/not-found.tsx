import {localizeTree} from '@/lib/i18n';
import {getLocale} from '@/lib/server/locale';
import Link from "next/link";
export default async function NotFound() { return localizeTree(<section className="page-hero container"><p className="eyebrow">PAGE NOT FOUND</p><h1>Let’s find your way forward.</h1><p className="lead">The page you’re looking for isn’t available.</p><Link href="/" className="button button-dark">Return Home ↗</Link></section>, await getLocale()); }
