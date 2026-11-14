// Shared draft source. Approval is never inferred from a browser checkbox.
export const intakePolicy = Object.freeze({version:'2026-11-14.v2',status:'draft'});
export function calendarMonths(value,months) {
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()) || !Number.isInteger(months) || months<0 || months>120) throw new Error('INVALID_RETENTION_DATE');
  const day=date.getUTCDate();
  date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+months);
  const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  date.setUTCDate(Math.min(day,last));return date;
}
