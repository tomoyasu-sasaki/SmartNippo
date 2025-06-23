import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AuthScreen from '../app/(auth)/index';

describe('AuthScreen', () => {
  it('renders sign in form by default', () => {
    render(<AuthScreen />);

    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByText('Sign in to your account')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('shows email and password inputs', () => {
    render(<AuthScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  it('shows sign up toggle', () => {
    render(<AuthScreen />);

    const signUpToggle = screen.getByText('Sign Up');
    expect(signUpToggle).toBeTruthy();
  });
});
