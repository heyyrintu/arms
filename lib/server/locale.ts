import 'server-only';
import {cookies} from 'next/headers';
import {normalizeLocale,translate} from '@/lib/i18n';
import type {Metadata} from 'next';
export const getLocale=async()=>normalizeLocale((await cookies()).get('arms_language')?.value);
export async function localizedMetadata(metadata:Metadata):Promise<Metadata> {
  const locale=await getLocale();
  return {...metadata,title:typeof metadata.title==='string'?translate(metadata.title,locale):metadata.title,
    description:typeof metadata.description==='string'?translate(metadata.description,locale):metadata.description};
}
