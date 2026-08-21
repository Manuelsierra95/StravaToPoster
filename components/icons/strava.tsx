import type { SVGProps } from "react";

export function Strava(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M6.146 8.582 12 18.84l1.854-3.213-3.853-7.045h-3.855zM15.853 0 6.146 18h4.708L15.853 9.45l3 5.501L21.708 9.45 15.853 0z" />
    </svg>
  );
}
