export function selectConversation(items: { id: string }[], requested: string | null): string {
  return requested ? items.find(item => item.id === requested)?.id ?? '' : items[0]?.id ?? '';
}

/** A poll begun before send must not erase the just-acknowledged message. */
export function mergeMessages<T extends { id: string; created_at: string }>(history: T[], acknowledged: T[]): T[] {
  const result = new Map(history.map(message => [message.id, message]));
  for (const message of acknowledged) if (!result.has(message.id)) result.set(message.id, message);
  return [...result.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}
