export function formatDistanceVariance(metres: number) {
  if (metres === 0) {
    return null;
  }

  return `${getVarianceSign(metres)}${(Math.abs(metres) / 1000).toFixed(1)} km`;
}

export function formatDurationVariance(seconds: number) {
  const minutes = Math.round(Math.abs(seconds) / 60);

  if (minutes === 0) {
    return null;
  }

  return `${getVarianceSign(seconds)}${minutes} min`;
}

function getVarianceSign(value: number) {
  return value > 0 ? "+" : "−";
}
