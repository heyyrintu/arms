import type {MetadataRoute} from "next";
import {isDemo} from "@/content/site";
export default function robots():MetadataRoute.Robots {const ready=process.env.NEXT_PUBLIC_SITE_LAUNCH_READY === "true" && !isDemo;return {rules:ready?{userAgent:"*",allow:"/"}:{userAgent:"*",disallow:"/"}};}
