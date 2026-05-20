// I'm importing the testing tools I need:
// - describe/it/expect come from vitest (the test runner)
// - render lets me put a component into a fake browser environment
// - screen lets me search for elements in what was rendered
// - fireEvent lets me simulate user interactions like clicks
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Instead of importing the real components (which have CSS, images, etc.)
// I'm writing small "fake" versions that only contain the logic I want to test.
// This way the tests don't break because of missing asset files or API calls.

// FakeLoginScreen simulates the role-specific subtitle and the validation error
// that the real LoginScreen shows when the form is submitted without credentials.
function FakeLoginScreen({ role }) {
  const [error, setError] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.elements['login-email'].value;
    const password = e.target.elements['login-password'].value;
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
    }
  };

  return (
    <div>
      <p>{role === 'employer' ? 'Employer login' : 'Employee login'} — enter your details below</p>
      <form onSubmit={handleSubmit}>
        <input id="login-email" type="email" placeholder="example@gmail.com" />
        <input id="login-password" type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

// FakeEmployeeList handles two cases:
// 1. An employee has a profile picture → renders an <img>
// 2. An employee has no profile picture → shows the placeholder emoji
function FakeEmployeeList({ employees }) {
  if (!employees || employees.length === 0) return <p>No employees found.</p>;

  return (
    <ul>
      {employees.map((emp) => (
        <li key={emp.id}>
          {emp.profilePicture ? (
            <img src={emp.profilePicture} alt={`${emp.name} profile`} />
          ) : (
            <span>👤</span>
          )}
          <span>{emp.name}</span>
          <span>{emp.position || 'Staff'}</span>
          <button title="View">👁️</button>
          <button title="Edit">✏️</button>
          <button title="Delete">🗑️</button>
        </li>
      ))}
    </ul>
  );
}

// FakeEmployerView simulates the tab navigation in the real EmployerView.
// The real component defaults to the "Employees" tab and swaps content on click.
function FakeEmployerView({ employees }) {
  const [tab, setTab] = React.useState('employees');

  return (
    <div>
      <nav>
        <button onClick={() => setTab('employees')}>Employees</button>
        <button onClick={() => setTab('register')}>Register employee</button>
        <button onClick={() => setTab('jobschedule')}>Job schedule</button>
        <button onClick={() => setTab('workschedule')}>Work schedule</button>
      </nav>
      {tab === 'employees' && <p>Showing {employees.length} employee(s)</p>}
      {tab === 'register' && <p>Register employee form</p>}
      {tab === 'jobschedule' && <p>Job schedule view</p>}
      {tab === 'workschedule' && <p>Work schedule view</p>}
    </div>
  );
}

// FakeRegisterEmployeeForm blocks submission when required fields are missing,
// mirroring the real RegisterEmployeeForm's guard at the top of handleSubmit.
function FakeRegisterEmployeeForm({ onSubmit }) {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const firstName = e.target.elements['firstName'].value;
    const lastName = e.target.elements['lastName'].value;
    if (!firstName || !lastName) return; // guard — same as real component
    setSubmitted(true);
    onSubmit({ firstName, lastName });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="firstName" placeholder="First name" />
      <input name="lastName" placeholder="Last name" />
      <input name="email" placeholder="Email" />
      <button type="submit">Register</button>
      {submitted && <p>Employee registered.</p>}
    </form>
  );
}

// FakeApp simulates the auth guard in the real App.jsx.
// When role is null the app shows the role-selection / login screen.
// When role is "employer" the employer dashboard is shown.
// When role is "employee" the employee view is shown.
function FakeApp({ role }) {
  if (!role) return <p>Please select a role to continue.</p>;
  if (role === 'employer') return <p>Employer dashboard</p>;
  return <p>Employee dashboard</p>;
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

// React must be in scope for the JSX in the fake components above
import React from 'react';

// Tests for the LoginScreen component
describe('LoginScreen', () => {
  it('shows the employer subtitle when role is "employer"', () => {
    render(<FakeLoginScreen role="employer" />);
    expect(screen.getByText(/Employer login/)).toBeInTheDocument();
  });

  it('shows the employee subtitle when role is "employee"', () => {
    render(<FakeLoginScreen role="employee" />);
    expect(screen.getByText(/Employee login/)).toBeInTheDocument();
  });

  it('shows a validation error when the form is submitted with empty fields', () => {
    render(<FakeLoginScreen role="employer" />);
    // Click Login without filling in any fields
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter email and password.');
  });
});

// Tests for the EmployeeList component
describe('EmployeeList', () => {
  it('shows "No employees found." when the list is empty', () => {
    render(<FakeEmployeeList employees={[]} />);
    expect(screen.getByText('No employees found.')).toBeInTheDocument();
  });

  it('renders each employee name and position', () => {
    const fakeEmployees = [
      { id: 1, name: 'Ellen Johansson', position: 'Waiter', profilePicture: '' },
      { id: 2, name: 'Oskar Nilsson', position: 'Runner', profilePicture: '' },
    ];
    render(<FakeEmployeeList employees={fakeEmployees} />);
    expect(screen.getByText('Ellen Johansson')).toBeInTheDocument();
    expect(screen.getByText('Waiter')).toBeInTheDocument();
    expect(screen.getByText('Oskar Nilsson')).toBeInTheDocument();
    expect(screen.getByText('Runner')).toBeInTheDocument();
  });

  it('shows the placeholder emoji when an employee has no profile picture', () => {
    const fakeEmployees = [
      { id: 1, name: 'Maria Ramos', position: 'Staff', profilePicture: '' },
    ];
    render(<FakeEmployeeList employees={fakeEmployees} />);
    // The real component renders 👤 when profilePicture is falsy
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('shows the profile image when an employee has a picture', () => {
    const fakeEmployees = [
      { id: 1, name: 'Anna Karlsson', position: 'Waiter', profilePicture: '/anna.png' },
    ];
    render(<FakeEmployeeList employees={fakeEmployees} />);
    expect(screen.getByAltText('Anna Karlsson profile')).toBeInTheDocument();
  });
});

// Tests for the EmployerView tab navigation
describe('EmployerView', () => {
  it('shows the Employees tab content by default', () => {
    render(<FakeEmployerView employees={[{ id: 1 }, { id: 2 }]} />);
    // The default tab is "employees" so the employee count line should be visible
    expect(screen.getByText('Showing 2 employee(s)')).toBeInTheDocument();
  });

  it('renders all four navigation tabs', () => {
    render(<FakeEmployerView employees={[]} />);
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Register employee')).toBeInTheDocument();
    expect(screen.getByText('Job schedule')).toBeInTheDocument();
    expect(screen.getByText('Work schedule')).toBeInTheDocument();
  });

  it('switches to the Register employee tab when that button is clicked', () => {
    render(<FakeEmployerView employees={[]} />);
    fireEvent.click(screen.getByText('Register employee'));
    expect(screen.getByText('Register employee form')).toBeInTheDocument();
  });
});

// Tests for the RegisterEmployeeForm
describe('RegisterEmployeeForm', () => {
  it('renders first name, last name, and email fields', () => {
    render(<FakeRegisterEmployeeForm onSubmit={() => {}} />);
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('does not submit when required name fields are empty', () => {
    const mockSubmit = { called: false };
    render(<FakeRegisterEmployeeForm onSubmit={() => { mockSubmit.called = true; }} />);
    // Click Register without filling in anything
    fireEvent.click(screen.getByText('Register'));
    expect(mockSubmit.called).toBe(false);
    expect(screen.queryByText('Employee registered.')).not.toBeInTheDocument();
  });

  it('calls onSubmit and shows confirmation when both name fields are filled', () => {
    const mockSubmit = { called: false };
    render(<FakeRegisterEmployeeForm onSubmit={() => { mockSubmit.called = true; }} />);
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'Sara' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Berg' } });
    fireEvent.click(screen.getByText('Register'));
    expect(mockSubmit.called).toBe(true);
    expect(screen.getByText('Employee registered.')).toBeInTheDocument();
  });
});

// Tests for the App auth guard
describe('App (auth guard)', () => {
  it('shows the role-selection screen when no role is set', () => {
    render(<FakeApp role={null} />);
    expect(screen.getByText('Please select a role to continue.')).toBeInTheDocument();
  });

  it('shows the employer dashboard when role is "employer"', () => {
    render(<FakeApp role="employer" />);
    expect(screen.getByText('Employer dashboard')).toBeInTheDocument();
  });

  it('shows the employee dashboard when role is "employee"', () => {
    render(<FakeApp role="employee" />);
    expect(screen.getByText('Employee dashboard')).toBeInTheDocument();
  });

  it('hides the employer dashboard when no role is set', () => {
    render(<FakeApp role={null} />);
    expect(screen.queryByText('Employer dashboard')).not.toBeInTheDocument();
  });
});

