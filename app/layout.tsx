import type {Metadata} from "next";
import type {ReactNode} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {isDemo} from "@/content/site";
const demoPreview=isDemo&&process.env.JOBS_ENABLED!=='true';
const launchReady=process.env.NEXT_PUBLIC_SITE_LAUNCH_READY === "true" && !isDemo;
import {siteTitle,siteDescription} from "@/lib/metadata";
import LocaleProvider from '@/components/LocaleProvider';
import {getLocale} from '@/lib/server/locale';
import {localizeTree,translate} from '@/lib/i18n';
import "./globals.css";
export async function generateMetadata():Promise<Metadata> {
  const locale=await getLocale();
  return {title:{default:`${siteTitle} — ${translate('Great people.',locale)} ${translate('Greater possibilities.',locale)}`,template:`%s | ${siteTitle}`},description:translate(siteDescription,locale),robots:launchReady?undefined:{index:false,follow:false}};
}
export default async function RootLayout({children}:{children:ReactNode}) {
  const locale=await getLocale();
  return <html lang={locale} data-scroll-behavior="smooth"><body><LocaleProvider locale={locale}>
    {localizeTree(<><a className="skip-link" href="#main-content">Skip to content</a>{!launchReady&&<div className="preview-banner">{demoPreview?"Local website preview · fictional example jobs · submissions are disabled":"Website preview · submissions are unavailable"}</div>}</>,locale)}
    {process.env.ARMS_PRIVATE_STAGING==='true'&&<div className="preview-banner">PRIVATE SYNTHETIC STAGING · no real applications · <a href="/admin/staging">Workflow tests</a> · <a href="/staging/mailbox">Captured test mailbox</a></div>}<Header/><main id="main-content" tabIndex={-1}>{children}</main><Footer/>
  </LocaleProvider></body></html>;
}
