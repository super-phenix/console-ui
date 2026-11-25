import { DuplicateGroupDialog } from './duplicate-group-dialog.component';
import { MAX_NAME_LENGTH } from '@shared/models/consts';

/**
 * Instantiate the dialog class directly to test defaultName logic
 * without needing Angular's TestBed (which requires @angular/animations).
 */
function getDefaultName(sourceName: string, existingNames: string[]): string {
  const data = { sourceName, existingNames };
  // Access the private method via prototype with injected data
  const instance = Object.create(DuplicateGroupDialog.prototype);
  instance.data = data;
  return instance['defaultName']();
}

describe('DuplicateGroupDialog – defaultName', () => {
  it('should return "<name> copy" when no conflict', () => {
    expect(getDefaultName('Admins', ['Admins'])).toBe('Admins copy');
  });

  it('should return "<name> copy" when no existing names at all', () => {
    expect(getDefaultName('Admins', [])).toBe('Admins copy');
  });

  it('should return "<name> copy (2)" when "copy" already exists', () => {
    expect(getDefaultName('Admins', ['Admins', 'Admins copy'])).toBe('Admins copy (2)');
  });

  it('should increment counter when multiple copies exist', () => {
    expect(getDefaultName('Admins', ['Admins', 'Admins copy', 'Admins copy (2)', 'Admins copy (3)']))
      .toBe('Admins copy (4)');
  });

  it('should strip existing " copy" suffix from source name before generating', () => {
    expect(getDefaultName('Admins copy', ['Admins', 'Admins copy'])).toBe('Admins copy (2)');
  });

  it('should strip existing " copy (N)" suffix from source name before generating', () => {
    expect(getDefaultName('Admins copy (3)', ['Admins', 'Admins copy', 'Admins copy (2)', 'Admins copy (3)']))
      .toBe('Admins copy (4)');
  });

  it('should default to " copy" when duplicating a numbered copy and base copy name is free', () => {
    expect(getDefaultName('Admins copy (2)', ['Admins', 'Admins copy (2)'])).toBe('Admins copy');
  });

  it('should truncate long names so the suffix fits within MAX_NAME_LENGTH', () => {
    const longName = 'A'.repeat(MAX_NAME_LENGTH);
    const result = getDefaultName(longName, []);
    expect(result.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
    expect(result).toMatch(/ copy$/);
  });

  it('should truncate long names with numbered suffix within MAX_NAME_LENGTH', () => {
    const longName = 'A'.repeat(MAX_NAME_LENGTH);
    const copyName = longName.slice(0, MAX_NAME_LENGTH - ' copy'.length) + ' copy';
    const result = getDefaultName(longName, [copyName]);
    expect(result.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
    expect(result).toMatch(/ copy \(2\)$/);
  });
});
