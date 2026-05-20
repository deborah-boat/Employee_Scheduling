// Importing the test tools from vitest
import { describe, it, expect } from 'vitest';

// Importing the real gym data to use in the tests
import { gyms } from '../../src/data/gyms.js';

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
// These are small helper functions that contain the logic I want to test.
// They are pure functions: they only depend on the input, no database or network.

// Finds a single gym by its id — returns the gym object or undefined if not found
function findGymById(gymList, id) {
  return gymList.find((g) => g.id === id);
}

// Filters the gym list by city — returns only gyms that match the location
function filterByLocation(gymList, location) {
  return gymList.filter((g) => g.location === location);
}

// Counts how many reviews a gym has
// The ?. means "if reviews exists", and ?? 0 means "if it's null/undefined, return 0"
function countReviews(gym) {
  return gym.reviews?.length ?? 0;
}

// Calculates the average rating of a gym's reviews
// If there are no reviews, returns 0 to avoid dividing by zero
function averageRating(gym) {
  if (!gym.reviews || gym.reviews.length === 0) return 0;
  // reduce adds up all the ratings into a single total number
  const total = gym.reviews.reduce((sum, r) => sum + r.rating, 0);
  return total / gym.reviews.length;
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

// Tests for findGymById
describe('findGymById', () => {
  it('returns the correct gym when the id exists', () => {
    // Look for gym with id '1' — it should be PowerFit Gym
    const result = findGymById(gyms, '1');
    expect(result.name).toBe('PowerFit Gym');
  });

  it('returns undefined when the id does not exist', () => {
    // id '999' doesn't exist in the list, so the result should be undefined
    const result = findGymById(gyms, '999');
    expect(result).toBeUndefined();
  });
});

// Tests for filterByLocation
describe('filterByLocation', () => {
  it('returns only gyms in the given location', () => {
    // There is only one gym in Porto (IronZone)
    const result = filterByLocation(gyms, 'Porto');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('IronZone');
  });

  it('returns an empty array when no gyms match', () => {
    // There are no gyms in Faro, so we expect an empty array
    const result = filterByLocation(gyms, 'Faro');
    expect(result).toHaveLength(0);
  });
});

// Tests for countReviews
describe('countReviews', () => {
  it('counts the reviews of a gym correctly', () => {
    // PowerFit Gym (id '1') has 3 reviews in the mock data
    const gym = findGymById(gyms, '1');
    expect(countReviews(gym)).toBe(3);
  });
});

// Tests for averageRating
describe('averageRating', () => {
  it('calculates the average rating correctly', () => {
    // PowerFit has ratings: 5, 4, 5 — average is 4.666...
    // toBeCloseTo(4.67, 1) checks it's close to 4.67 with 1 decimal of precision
    const gym = findGymById(gyms, '1');
    expect(averageRating(gym)).toBeCloseTo(4.67, 1);
  });

  it('returns 0 when the gym has no reviews', () => {
    // I create a fake gym with an empty reviews array to test the edge case
    const emptyGym = { id: '99', name: 'Empty Gym', reviews: [] };
    expect(averageRating(emptyGym)).toBe(0);
  });
});
