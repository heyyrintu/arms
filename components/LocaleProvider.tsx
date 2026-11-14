'use client';
import {createContext,useContext,type ReactNode} from 'react';
import type {Locale} from '@/lib/i18n';
const Context=createContext<Locale>('en');
export const useLocale=()=>useContext(Context);
export default function LocaleProvider({locale,children}:{locale:Locale;children:ReactNode}) {
  return <Context.Provider value={locale}>{children}</Context.Provider>;
}
