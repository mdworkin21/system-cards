/** Contiguous runs of the same lab, in the order given; the build already sorts by lab and date. */
export function groupByLab<T>(items: T[], labOf: (item: T) => string): { lab: string; items: T[] }[] {
  const groups: { lab: string; items: T[] }[] = [];
  for (const item of items) {
    const lab = labOf(item);
    const last = groups.at(-1);
    if (last && last.lab === lab) last.items.push(item);
    else groups.push({ lab, items: [item] });
  }
  return groups;
}
