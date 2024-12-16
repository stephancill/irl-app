import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseGeo(geo: string) {
  const [lat, long] = geo.split("geo:")[1].split(",").map(parseFloat);
  return { lat, long };
}
