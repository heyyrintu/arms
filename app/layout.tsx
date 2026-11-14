import type {Metadata} from "next";
import type {ReactNode} from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {isDemo} from "@/content/site";
const launchReady=process.env.NEXT_PUBLIC_SITE_LAUNCH_READY === "true" && !isDemo;
import {siteTitle,siteDescription} from "@/lib/metadata";
import "./globals.css";
export const metadata:Metadata={title:{default:`${siteTitle} — Great people. Greater possibilities.`,template:`%s | ${siteTitle}`},description:siteDescription,robots:launchReady?undefined:{index:false,follow:false}};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main-content">Skip to content</a>{!launchReady&&<div className="preview-banner">{isDemo?"Local website preview · fictional example jobs · submissions are disabled":"Website preview · no live vacancies · submissions are unavailable"}</div>}<Header/><main id="main-content" tabIndex={-1}>{children}</main><Footer/></body></html>}
