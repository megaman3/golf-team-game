import { bestBallWorstBall } from './bestBallWorstBall';
import { copenhagen } from './copenhagen';
import { stableford } from './stableford';
import type { GameFormatModule } from './types';

export const formatRegistry: Record<string, GameFormatModule<unknown>> = {
  [bestBallWorstBall.id]: bestBallWorstBall as GameFormatModule<unknown>,
  [copenhagen.id]: copenhagen as GameFormatModule<unknown>,
  [stableford.id]: stableford as GameFormatModule<unknown>,
};

export function getGameFormat(formatId: string) {
  const format = formatRegistry[formatId];
  if (!format) {
    throw new Error(`Okänd spelform: ${formatId}`);
  }
  return format;
}
