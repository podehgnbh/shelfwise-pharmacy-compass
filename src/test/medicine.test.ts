import { describe, expect, it } from 'vitest';
import { shelfCode, matchScore, expiryStatus } from '@/lib/medicine';

describe('Pharmacy rules', () => {
  it('assigns alphabetical shelves beyond Z', () => {
    expect([0, 1, 2, 25, 26, 27].map(shelfCode)).toEqual(['A', 'B', 'C', 'Z', 'AA', 'AB']);
  });
  it('finds medicine by scientific name', () => {
    expect(matchScore('paracetamol', ['Panadol', 'Paracetamol'])).toBe(100);
    expect(matchScore('insulin', ['Panadol', 'Paracetamol'])).toBe(0);
  });
  it('normalizes Arabic spelling in search', () => {
    expect(matchScore('ابرة', ['إبرة'])).toBe(100);
  });
  it('classifies expiration dates including the final day', () => {
    expect(expiryStatus(-1)).toBe('expired');
    expect(expiryStatus(0)).toBe('soon');
    expect(expiryStatus(90)).toBe('soon');
    expect(expiryStatus(91)).toBe('ok');
    expect(expiryStatus(null)).toBe('none');
  });
});