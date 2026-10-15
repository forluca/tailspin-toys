/**
 * Pure formatting helpers for game star ratings.
 *
 * Kept framework-free and side-effect-free so the logic is unit-testable
 * without the Astro runtime (see `ratings.test.ts`). Consumed by the
 * `StarRating.astro` component.
 */

/**
 * Clamps a rating into the displayable 0–5 range.
 */
export function clampRating(rating: number): number {
    return Math.min(5, Math.max(0, rating));
}

/**
 * Returns the five display states for a rating, rounding fractional stars
 * below 0.5 down to an empty star.
 */
export function getStarRatingStates(rating: number): ('full' | 'half' | 'empty')[] {
    const clamped = clampRating(rating);
    const fullStars = Math.floor(clamped);
    const hasHalfStar = clamped % 1 >= 0.5;

    return Array.from({ length: 5 }, (_, index) => {
        if (index < fullStars) return 'full';
        if (hasHalfStar && index === fullStars) return 'half';
        return 'empty';
    });
}

/** Builds the textual star label used by catalog exports. */
export function formatStarRating(rating: number | null): string {
    if (rating === null) return 'Not yet rated';

    return getStarRatingStates(rating)
        .map((state) => (state === 'full' ? '★' : state === 'half' ? '½' : '☆'))
        .join('');
}

/** Formats the numeric rating as a score out of five, or a message when absent. */
export function formatRatingLabel(rating: number | null): string {
    if (rating === null) return 'No rating yet';
    return `${clampRating(rating).toFixed(1)} / 5`;
}
