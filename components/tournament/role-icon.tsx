import type { SVGProps } from "react";

import type { TournamentRole } from "@/lib/tournament-types";
import { cn } from "@/lib/utils";

/**
 * Custom vector redraws created for Rift Clash using Riot's Wild Rift
 * position guide as visual reference. These are not Riot-supplied assets or
 * official Riot branding. Keep the visible role label beside the icon.
 *
 * Reference: https://wildrift.leagueoflegends.com/en-us/news/dev/dev-picking-your-position/
 */
export type RoleIconProps = Omit<SVGProps<SVGSVGElement>, "role"> & {
  roleName: TournamentRole;
};

export function RoleIcon({ roleName, className, ...props }: RoleIconProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      className={cn("size-5 shrink-0 text-primary-muted", className)}
      data-role-icon={roleName.toLowerCase()}
      fill="currentColor"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      stroke="none"
      viewBox="0 0 80 80"
    >
      {roleName === "Baron" ? (
        <>
          <path
            d="M8 34C13 25 21 15 31 8L35 5 33 17C32 22 32 26 35 30L40 35 45 30C48 26 48 22 47 17L45 5 49 8C59 15 67 25 72 34L65 40C63 42 62 46 63 52 57 49 53 45 49 41L44 37 40 42 36 37 31 41C27 45 23 49 17 52 18 46 17 42 15 40ZM40 29L46 35 40 41 34 35Z"
            fillRule="evenodd"
          />
          <path d="M36 39H44V53L49 60 40 76 31 60 36 53Z" />
        </>
      ) : null}

      {roleName === "Jungle" ? (
        <>
          <path d="M19 4C23 10 28 17 31 21 37 32 40 39 41 43 43 52 44 62 44 67 43 72 42 76 40 79 32 72 24 65 17 57 15 50 14 44 14 38 11 34 8 29 5 25 6 24 6 24 7 24 10 25 13 27 15 29 19 32 22 35 24 38 27 42 28 45 29 47 29 41 29 35 28 29 27 21 22 9 19 4Z" />
          <path d="M60 3C58 10 55 17 52 24 50 31 50 37 50 42 50 45 49 47 48 48 47 42 45 37 43 31 44 27 47 23 50 18 54 12 58 6 60 3Z" />
          <path d="M73 24C67 27 62 30 61 35 58 39 55 44 55 46 53 51 52 56 51 59L51 68C56 64 60 60 63 56 64 50 65 45 65 40 69 34 72 29 75 25 75 24 74 24 73 24Z" />
        </>
      ) : null}

      {roleName === "Mid" ? (
        <>
          <path d="M40 2C39 11 37 22 34 31 31 41 28 51 26 58 31 65 36 72 39 77L40 79 41 77C44 72 49 65 54 58 52 51 49 41 46 31 43 22 41 11 40 2Z" />
          <path d="M5 29H19C24 29 28 25 31 19 29 29 25 42 22 54 15 48 9 39 5 29Z" />
          <path d="M75 29H61C56 29 52 25 49 19 51 29 55 42 58 54 65 48 71 39 75 29Z" />
        </>
      ) : null}

      {roleName === "Dragon" ? (
        <>
          <path d="M11 6C13 12 18 21 23 26 24 22 24 19 24 17 25 16 26 16 27 16 27 20 29 24 30 26 32 28 34 29 36 30L36 76 25 67C26 65 27 63 28 62 27 59 27 57 27 55 23 54 20 52 16 50L17 37C20 40 23 44 25 46 27 47 29 48 31 48L31 46C29 42 27 38 24 34 19 33 15 31 10 29L9 13C9 10 10 8 11 6Z" />
          <path d="M69 6C67 12 62 21 57 26 56 22 56 19 56 17 55 16 54 16 53 16 53 20 51 24 50 26 48 28 46 29 44 30L44 76 55 67C54 65 53 63 52 62 53 59 53 57 53 55 57 54 60 52 64 50L63 37C60 40 57 44 55 46 53 47 51 48 49 48L49 46C51 42 53 38 56 34 61 33 65 31 70 29L71 13C71 10 70 8 69 6Z" />
        </>
      ) : null}

      {roleName === "Support" ? (
        <>
          <path d="M29 5H51L50 11 40 24 30 11Z" />
          <path d="M5 22H28L35 29 28 35 25 47 19 43 18 37 11 34Z" />
          <path d="M75 22H52L45 29 52 35 55 47 61 43 62 37 69 34Z" />
          <path d="M35 29H45L48 62 40 75 32 62Z" />
        </>
      ) : null}
    </svg>
  );
}
