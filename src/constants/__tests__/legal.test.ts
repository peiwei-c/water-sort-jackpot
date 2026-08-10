import { LEGAL } from '../legal';

describe('legal constants', () => {
  it('exposes https privacy and terms URLs', () => {
    expect(LEGAL.privacyUrl.startsWith('https://')).toBe(true);
    expect(LEGAL.termsUrl.startsWith('https://')).toBe(true);
    expect(LEGAL.minimumAge).toBeGreaterThanOrEqual(17);
  });
});
