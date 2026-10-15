import { describe, it, expect } from 'vitest';
import { clampRating, formatRatingLabel, formatStarRating, getStarRatingStates } from './ratings';

describe('clampRating', () => {
    it('returns the value unchanged when within range', () => {
        expect(clampRating(0)).toBe(0);
        expect(clampRating(3.5)).toBe(3.5);
        expect(clampRating(5)).toBe(5);
    });

    it('clamps values outside the 0–5 range', () => {
        expect(clampRating(-2)).toBe(0);
        expect(clampRating(7)).toBe(5);
    });
});

describe('getStarRatingStates', () => {
    it('returns five full or empty states for whole-number ratings', () => {
        expect(getStarRatingStates(0)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
        expect(getStarRatingStates(3)).toEqual(['full', 'full', 'full', 'empty', 'empty']);
        expect(getStarRatingStates(5)).toEqual(['full', 'full', 'full', 'full', 'full']);
    });

    it('uses a half-star state when the fraction is at least 0.5', () => {
        expect(getStarRatingStates(3.5)).toEqual(['full', 'full', 'full', 'half', 'empty']);
        expect(getStarRatingStates(4.75)).toEqual(['full', 'full', 'full', 'full', 'half']);
    });

    it('rounds fractions below 0.5 down to an empty star', () => {
        expect(getStarRatingStates(3.4)).toEqual(['full', 'full', 'full', 'empty', 'empty']);
    });

    it('clamps ratings outside the 0–5 range', () => {
        expect(getStarRatingStates(-1)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
        expect(getStarRatingStates(6)).toEqual(['full', 'full', 'full', 'full', 'full']);
    });
});

describe('formatStarRating', () => {
    it('formats star states for catalog labels', () => {
        expect(formatStarRating(3.5)).toBe('★★★½☆');
        expect(formatStarRating(null)).toBe('Not yet rated');
    });
});

describe('formatRatingLabel', () => {
    it('formats a rating as a score out of five', () => {
        expect(formatRatingLabel(4.5)).toBe('4.5 / 5');
    });

    it('shows the requested message when rating is null', () => {
        expect(formatRatingLabel(null)).toBe('No rating yet');
    });
});
