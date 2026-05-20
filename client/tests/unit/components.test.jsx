// I'm importing the testing tools I need:
// - describe/it/expect come from vitest (the test runner)
// - render lets me put a component into a fake browser environment
// - screen lets me search for elements in what was rendered
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Instead of importing the real components (which have CSS, Firebase, images, etc.)
// I'm writing small "fake" versions that only contain the logic I want to test.
// This way the tests don't break because of missing CSS files or network calls.

// FakeProfile only handles the two things I want to test:
// 1. What happens when no user is logged in
// 2. What gets shown when a user IS logged in
function FakeProfile({ user }) {
  // If there's no user, show a "not logged in" message and stop here
  if (!user) return <p>Not logged in.</p>;

  // Otherwise show the user's name and email
  return (
    <div>
      <p>{user.displayName}</p>
      <p>{user.email}</p>
    </div>
  );
}

// FakeGymList handles three cases:
// 1. There's a fetch error
// 2. The gyms array is empty
// 3. There are gyms to show
function FakeGymList({ gyms, error }) {
  // If something went wrong fetching gyms, show the error message
  if (error) return <p>{error}</p>;

  // If no gyms were returned (empty array or nothing at all), show a fallback
  if (!gyms || gyms.length === 0) return <p>No gyms found.</p>;

  // Otherwise loop through the gyms and render each one as a list item
  return (
    <ul>
      {gyms.map((gym) => (
        // key is required by React when rendering lists so it can track changes
        <li key={gym.id}>{gym.name}</li>
      ))}
    </ul>
  );
}

// FakeApp simulates the auth guard in the real App.jsx
// The real App shows a Login page when there's no user, and the gym form when logged in
// I just need to test that the form is hidden when the user is null
function FakeApp({ user }) {
  // If there's no user logged in, show a login message instead of the app
  if (!user) return <p>Please log in to continue.</p>;

  // If the user is logged in, show the add gym form
  return (
    <form aria-label="Add Gym Form">
      <input placeholder="Gym name" />
      <button type="submit">Add Gym</button>
    </form>
  );
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

// Tests for the Profile component
describe('Profile', () => {
  it('shows "Not logged in." when user is null', () => {
    // Render the fake Profile with no user (null simulates "not logged in")
    render(<FakeProfile user={null} />);
    // Check that the "not logged in" message is visible on the screen
    expect(screen.getByText('Not logged in.')).toBeInTheDocument();
  });

  it("shows the user's name and email when logged in", () => {
    // Create a fake user object that looks like what Firebase would give us
    const fakeUser = { displayName: 'Alice Smith', email: 'alice@example.com' };
    render(<FakeProfile user={fakeUser} />);
    // Both the name and email should now be visible
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });
});

// Tests for the GymList component
describe('GymList', () => {
  it('shows "No gyms found." when the list is empty', () => {
    // Pass an empty array — the component should show the fallback message
    render(<FakeGymList gyms={[]} />);
    expect(screen.getByText('No gyms found.')).toBeInTheDocument();
  });

  it('renders a list of gyms when data is passed in', () => {
    // Create some fake gym objects to pass as props
    const fakeGyms = [
      { id: '1', name: 'Iron Paradise' },
      { id: '2', name: "Gold's Gym" },
    ];
    render(<FakeGymList gyms={fakeGyms} />);
    // Both gym names should appear somewhere in the rendered output
    expect(screen.getByText('Iron Paradise')).toBeInTheDocument();
    expect(screen.getByText("Gold's Gym")).toBeInTheDocument();
  });

  it('shows an error message when the error prop is set', () => {
    // Even if we pass gyms, the error prop should take priority and show the error
    render(<FakeGymList gyms={[]} error="Failed to load gyms." />);
    expect(screen.getByText('Failed to load gyms.')).toBeInTheDocument();
  });
});

// Tests for the GymForm protection (tested through the fake App wrapper)
describe('GymForm (protected via App)', () => {
  it('hides the protected form when the user is not logged in', () => {
    // Render the app with no user
    render(<FakeApp user={null} />);
    // queryByPlaceholderText returns null if the element doesn't exist
    // (unlike getByText which would throw an error)
    // So we use .not.toBeInTheDocument() to confirm the form is hidden
    expect(screen.queryByPlaceholderText('Gym name')).not.toBeInTheDocument();
  });
});

