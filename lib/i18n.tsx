import type {ReactNode} from 'react';
import hindi from '@/content/hi.json';
import {createTranslator,localizeContent,normalizeLanguage} from './i18n-core.mjs';
export type Locale='en'|'hi';
export const normalizeLocale=(value:unknown):Locale=>normalizeLanguage(value);
export const translate:(text:string,locale:Locale)=>string=createTranslator(hindi);
// Translate owned UI text before rendering, on both server and client. Never
// rewrite the DOM, identifiers, URLs, event handlers, control values or source data.
export function localizeTree(node:ReactNode,locale:Locale):ReactNode {
  return localizeContent(node,locale,translate);
}
