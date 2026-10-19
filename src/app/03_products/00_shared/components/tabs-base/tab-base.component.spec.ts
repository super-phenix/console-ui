import { tabIndexFromFragment } from './tab-base.component';

describe('tabIndexFromFragment', () => {
  const tabs = ['general', 'projects', 'users', 'groups', 'quotas'];

  it('should keep an index', () => {
    expect(tabIndexFromFragment('2', tabs)).toBe('2');
    expect(tabIndexFromFragment(null, tabs)).toBeNull();
  });

  it('should find a tab by its name, wherever it is', () => {
    expect(tabIndexFromFragment('quotas', tabs)).toBe(4);
    expect(tabIndexFromFragment('quotas', ['general', 'quotas'])).toBe(1);
  });

  it('should fall back on the first tab when the named tab is not displayed', () => {
    expect(tabIndexFromFragment('quotas', ['general'])).toBe(0);
  });
});
