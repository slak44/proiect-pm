export enum LoopStatus {
  NONE = 'None',
  TRACK = 'Track',
  PLAYLIST = 'Playlist',
}

export function nextLoopStatus(value: LoopStatus): LoopStatus {
  const values = Object.values(LoopStatus);
  const idx = values.findIndex(status => status === value);
  if (idx < 0) throw Error('Type constraint broken');
  return values[(idx + 1) % values.length];
}
