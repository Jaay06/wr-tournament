import { ImageResponse } from "next/og";

import { SocialCard } from "@/components/brand/social-card";

export const alt = "Rift Clash, a private Wild Rift friends tournament";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<SocialCard />, size);
}
