// utils/conversions.ts
const PT_PER_INCH = 72;
const PT_PER_CM = PT_PER_INCH / 2.54;
const PT_PER_MM = PT_PER_CM / 10;

export const convertToPt = (value: number, unit: 'pt' | 'mm' | 'cm' | 'in'): number => {
  switch (unit) {
    case 'mm': return value * PT_PER_MM;
    case 'cm': return value * PT_PER_CM;
    case 'in': return value * PT_PER_INCH;
    default: return value; // pt
  }
}

export const convertFromPt = (value: number, unit: 'pt' | 'mm' | 'cm' | 'in'): number => {
  switch (unit) {
    case 'mm': return value / PT_PER_MM;
    case 'cm': return value / PT_PER_CM;
    case 'in': return value / PT_PER_INCH;
    default: return value; // pt
  }
}
