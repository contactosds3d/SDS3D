export function mergeSettingsContent(current: Record<string, string>, form: FormData) {
  const updated = { ...current };
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') updated[key] = value;
  }
  return updated;
}