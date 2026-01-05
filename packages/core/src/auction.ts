export type BidIncrementRule = {
  upTo?: number;
  increment: number;
};

export const defaultBidIncrementRules: BidIncrementRule[] = [
  { upTo: 99, increment: 5 },
  { upTo: 499, increment: 10 },
  { upTo: 999, increment: 25 },
  { upTo: 2499, increment: 50 },
  { upTo: 4999, increment: 100 },
  { increment: 250 },
];

export function getBidIncrement(
  currentAmount: number,
  rules: BidIncrementRule[] = defaultBidIncrementRules,
) {
  const normalized = [...rules].sort((a, b) => {
    if (a.upTo === undefined) return 1;
    if (b.upTo === undefined) return -1;
    return a.upTo - b.upTo;
  });

  for (const rule of normalized) {
    if (rule.upTo === undefined || currentAmount <= rule.upTo) {
      return rule.increment;
    }
  }

  return normalized[normalized.length - 1]?.increment ?? 1;
}

export type ProxyBidderState = {
  bidderId: string;
  currentBidAmount: number;
  maxBidAmount: number;
  maxBidPlacedAt: Date;
};

export type IncomingBid = {
  bidderId: string;
  bidAmount: number;
  maxBidAmount?: number;
  placedAt: Date;
};

export type ProxyBidResolution = {
  winningBidderId: string;
  winningBidAmount: number;
  winningMaxBidAmount: number;
  outbidBidderId?: string;
  outbidMaxBidAmount?: number;
  isTie: boolean;
};

export function resolveProxyBid(
  current: ProxyBidderState | null,
  incoming: IncomingBid,
  rules: BidIncrementRule[] = defaultBidIncrementRules,
): ProxyBidResolution {
  const incomingMax = Math.max(
    incoming.bidAmount,
    incoming.maxBidAmount ?? incoming.bidAmount,
  );

  if (!current) {
    return {
      winningBidderId: incoming.bidderId,
      winningBidAmount: incoming.bidAmount,
      winningMaxBidAmount: incomingMax,
      isTie: false,
    };
  }

  if (incoming.bidderId === current.bidderId) {
    const updatedMax = Math.max(current.maxBidAmount, incomingMax);
    return {
      winningBidderId: current.bidderId,
      winningBidAmount: current.currentBidAmount,
      winningMaxBidAmount: updatedMax,
      isTie: false,
    };
  }

  const increment = getBidIncrement(current.currentBidAmount, rules);

  if (incomingMax > current.maxBidAmount) {
    return {
      winningBidderId: incoming.bidderId,
      winningBidAmount: Math.min(incomingMax, current.maxBidAmount + increment),
      winningMaxBidAmount: incomingMax,
      outbidBidderId: current.bidderId,
      outbidMaxBidAmount: current.maxBidAmount,
      isTie: false,
    };
  }

  if (incomingMax < current.maxBidAmount) {
    return {
      winningBidderId: current.bidderId,
      winningBidAmount: Math.min(current.maxBidAmount, incomingMax + increment),
      winningMaxBidAmount: current.maxBidAmount,
      outbidBidderId: incoming.bidderId,
      outbidMaxBidAmount: incomingMax,
      isTie: false,
    };
  }

  const incomingWins = incoming.placedAt < current.maxBidPlacedAt;
  return {
    winningBidderId: incomingWins ? incoming.bidderId : current.bidderId,
    winningBidAmount: current.maxBidAmount,
    winningMaxBidAmount: current.maxBidAmount,
    outbidBidderId: incomingWins ? current.bidderId : incoming.bidderId,
    outbidMaxBidAmount: incomingMax,
    isTie: true,
  };
}
