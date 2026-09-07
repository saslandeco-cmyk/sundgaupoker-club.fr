import type { Suit } from "@/lib/types";

const PATHS: Record<Suit, string> = {
  spade:
    "M12 2c-3.2 4-8 7.4-8 12a5 5 0 0 0 8 4c-.3 2-1 3.3-3 4.6V24h6v-1.4c-2-1.3-2.7-2.6-3-4.6a5 5 0 0 0 8-4c0-4.6-4.8-8-8-12z",
  heart:
    "M12 21S3 14.7 3 8.6C3 5.5 5.4 3 8.4 3 10 3 11.3 3.8 12 5c.7-1.2 2-2 3.6-2C18.6 3 21 5.5 21 8.6 21 14.7 12 21 12 21z",
  diamond: "M12 2 20 12 12 22 4 12z",
  club:
    "M12 3a3.6 3.6 0 0 1 3.4 4.9A3.6 3.6 0 1 1 17.8 14c-.6 0-1.1-.1-1.6-.3.4 1.8 1.3 3.1 2.8 4.3V19H7v-1c1.5-1.2 2.4-2.5 2.8-4.3-.5.2-1 .3-1.6.3a3.6 3.6 0 1 1 2.4-6.1A3.6 3.6 0 0 1 12 3z",
};

export function SuitMark({
  suit,
  className,
}: {
  suit: Suit;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[suit]} />
    </svg>
  );
}

export const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
