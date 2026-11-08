import { MAX_REDIRECTS, redirectLimit } from './redirect-limit';

describe('redirectLimit', () => {
  beforeEach(() => redirectLimit.reset());
  afterEach(() => redirectLimit.reset());

  it('follows redirects until the cap', () => {
    const follow = spyOn(redirectLimit, 'follow');

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      expect(redirectLimit.to(`/hop-${hop}`)).toBeTrue();
    }

    expect(follow).toHaveBeenCalledTimes(MAX_REDIRECTS);
    expect(redirectLimit.to('/one-more')).toBeFalse();
    expect(follow).toHaveBeenCalledTimes(MAX_REDIRECTS);
  });

  it('allows one exchange after the cap is spent', () => {
    const follow = spyOn(redirectLimit, 'follow');

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      redirectLimit.to(`/hop-${hop}`);
    }

    expect(redirectLimit.once('/api')).toBeTrue();
    expect(follow).toHaveBeenCalledWith('/api');
    expect(redirectLimit.once('/api-again')).toBeFalse();
  });

  it('starts again after the chain settles', () => {
    const follow = spyOn(redirectLimit, 'follow');

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      redirectLimit.to(`/hop-${hop}`);
    }
    expect(redirectLimit.to('/blocked')).toBeFalse();

    redirectLimit.reset();

    expect(redirectLimit.to('/after-reset')).toBeTrue();
    expect(follow).toHaveBeenCalledWith('/after-reset');
  });
});
