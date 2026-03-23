// Origin: v7 — extracted to library 2026-03-23
import { Easing } from "remotion";

// Smooth ease-in-out for general transitions
export const smoothEase = Easing.bezier(0.4, 0, 0.2, 1);

// Gentle fade for opacity transitions
export const gentleFade = Easing.bezier(0.25, 0.1, 0.25, 1);

// Dramatic ease for emphasis moments (thesis reveal, title card)
export const dramaticEase = Easing.bezier(0.16, 1, 0.3, 1);

// Organic ease for natural motion (tendrils, particles)
export const organicEase = Easing.bezier(0.34, 1.56, 0.64, 1);

// Weighted ease for "carrying the weight" throb
export const weightedEase = Easing.bezier(0.6, 0, 0.4, 1);

// Snap ease for sharp moments (plan locks, line connects)
export const snapEase = Easing.bezier(0.68, -0.55, 0.27, 1.55);

// Dissolve ease for typography transitions
export const dissolveEase = Easing.bezier(0.4, 0, 0.6, 1);

// Pulse function: returns 0..1..0 over a cycle
export function pulse(frame: number, cycleDuration: number, offset = 0): number {
  const t = ((frame + offset) % cycleDuration) / cycleDuration;
  return Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
}

// Slow throb: smoother, more organic pulse
export function throb(frame: number, cycleDuration: number): number {
  const t = (frame % cycleDuration) / cycleDuration;
  return (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
}

// Stagger delay calculator
export function staggerDelay(index: number, staggerFrames: number): number {
  return index * staggerFrames;
}
