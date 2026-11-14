import Link from "next/link";
import Image from "next/image";
import wordmark from "@/public/brand/arms-wordmark.webp";
export default function Footer(){ return <footer className="footer"><div className="container footer-main">
  <div className="footer-brand"><Image src={wordmark} alt="ARMS Talent Partners" sizes="190px" className="wordmark footer-logo"/><p>Great people.<br/>Greater possibilities.</p><small>Together for a Better Tomorrow</small></div>
  <div><h3>Explore</h3><Link href="/solutions">Solutions</Link><Link href="/industries">Industries</Link><Link href="/about">About ARMS</Link></div>
  <div><h3>Take the next step</h3><Link href="/hire-workforce">Hire Workforce</Link><Link href="/jobs">Find Jobs</Link><Link href="/talent-network">Join Talent Network</Link></div>
  <div><h3>Support</h3><Link href="/contact">Contact</Link><Link href="/candidate-support">Candidate Support</Link><Link href="/privacy">Privacy</Link></div>
</div><div className="container footer-bottom"><span>© {new Date().getFullYear()} ARMS Talent Partners. All rights reserved.</span><span>People · Opportunity · Progress</span></div></footer> }
