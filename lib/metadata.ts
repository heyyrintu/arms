import type { Metadata } from "next";
export const siteTitle = "ARMS Talent Partners";
export const siteDescription = "Workforce sourcing, deployment, attendance coordination and payroll support — connecting businesses with people and people with opportunities.";
export function pageMetadata(title: string, description: string): Metadata {
  return { title, description };
}
