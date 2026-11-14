import {cloneElement,isValidElement} from 'react';
export const normalizeLanguage=value=>value==='hi'?'hi':'en';
export function createTranslator(dictionary) {
  return (text,locale)=>{
    if(locale==='en'||!text.trim())return text;
    const core=text.trim(),translated=Object.hasOwn(dictionary,core)?dictionary[core]:undefined;
    if(typeof translated==='string'&&translated)return text.replace(core,translated);
    const bound=core.match(/^Use (\d+) characters or fewer\.$/);
    if(bound)return `अधिकतम ${bound[1]} अक्षर लिखें।`;
    const revision=core.match(/^Saved revision (\d+)$/);
    if(revision)return `सहेजा संशोधन ${revision[1]}`;
    const rupees=core.match(/^(.*) (per month|per year|per hour)$/);
    if(rupees&&dictionary[rupees[2]])return `${rupees[1]} ${dictionary[rupees[2]]}`;
    return text;
  };
}
export function localizeContent(node,locale,translate) {
  if(typeof node==='string')return translate(node,locale);
  // Preserve exact array structure and keys so changing language cannot remount
  // controlled forms or reset job filters during a server refresh.
  if(Array.isArray(node))return node.map((child,index)=>{
    const localized=localizeContent(child,locale,translate);
    // Cloning static JSX siblings makes them a new array to React. Give only
    // unkeyed siblings stable keys in BOTH languages; retain all authored keys.
    return isValidElement(localized)&&localized.key===null?cloneElement(localized,{key:`locale-static-${index}`}):localized;
  });
  if(!isValidElement(node)||node.props['data-original']!==undefined)return node;
  const props={};
  for(const name of ['aria-label','aria-description','placeholder','title','alt']) {
    if(typeof node.props[name]==='string')props[name]=translate(node.props[name],locale);
  }
  if(node.type==='option'&&node.props.value===undefined&&typeof node.props.children==='string')props.value=node.props.children;
  if(node.props.children!==undefined)props.children=localizeContent(node.props.children,locale,translate);
  return cloneElement(node,props);
}
