import { bestBallWorstBall } from './bestBallWorstBall';
import type { GameFormatModule } from './types';

export const formatRegistry: Record<string, GameFormatModule<unknown>> = {
  [bestBallWorstBall.id]: bestBallWorstBall as GameFormatModule<unknown>,
};

export function getGameFormat(formatId: string) {
  const format = formatRegistry[formatId];
  if (!format) {
    throw new Error(`Okänd spelform: ${formatId}`);
  }
  return format;
}
