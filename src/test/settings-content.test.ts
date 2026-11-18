import { describe, expect, it } from 'vitest';
import { mergeSettingsContent } from '@/features/settings-content';

describe('Separate settings editors', () => {
  it('preserves the uploaded logo when saving the page description', () => {
    const form = new FormData();
    form.set('bio', 'New description');
    const result = mergeSettingsContent({ logo: 'images/chosen-logo.webp', privacy: 'Existing policy' }, form);
    expect(result['logo']).toBe('images/chosen-logo.webp');
    expect(result['privacy']).toBe('Existing policy');
    expect(result['bio']).toBe('New description');
  });
  it('preserves the uploaded logo when saving privacy only', () => {
    const form = new FormData();
    form.set('privacy', 'Updated policy');
    expect(mergeSettingsContent({ logo: 'images/7867f9a2-c77d-44aa-9a4c-864f0a2b99cb.webp', bio: 'Existing description' }, form)).toEqual({
      logo: 'images/7867f9a2-c77d-44aa-9a4c-864f0a2b99cb.webp', bio: 'Existing description', privacy: 'Updated policy',
    });
  });
});