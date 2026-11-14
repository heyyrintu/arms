import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return ['/admin/:path*','/api/staff/:path*'].map(source=>({source,headers:[
      {key:'Cache-Control',value:'no-store'},
      {key:'X-Robots-Tag',value:'noindex, nofollow'},
      {key:'Referrer-Policy',value:'no-referrer'},
    ]}));
  }
};
export default nextConfig;
