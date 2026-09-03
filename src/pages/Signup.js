import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setMessage('');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');

      const response = await fetch(
        'http://localhost:5001/api/auth/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setMessage('Account created successfully. Redirecting to login...');

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        window.location.href = '/auth';
      }, 800);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    fontSize: '15px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '16px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#1f2937',
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '0 30px 40px',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          color: '#111827',
          fontSize: '26px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          marginBottom: '24px',
        }}
      >
        Create an OpsPilot Account
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          border: '1px solid #d9dee8',
          borderRadius: '10px',
          padding: '28px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Password</label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            style={inputStyle}
            required
          />
        </div>

        <div
          style={{
            marginBottom: error || message ? '10px' : '24px',
          }}
        >
          <label style={labelStyle}>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            style={{
              ...inputStyle,
              border: error
                ? '1px solid #dc2626'
                : '1px solid #cbd5e1',
            }}
            required
          />
        </div>

        {error && (
          <p
            style={{
              color: '#dc2626',
              fontSize: '14px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              marginTop: '0',
              marginBottom: '18px',
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            style={{
              color: '#16a34a',
              fontSize: '14px',
              fontFamily: 'Arial, Helvetica, sans-serif',
              marginTop: '0',
              marginBottom: '18px',
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: isSubmitting
              ? '#94a3b8'
              : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '13px 18px',
            borderRadius: '7px',
            cursor: isSubmitting
              ? 'not-allowed'
              : 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        <p
          style={{
            textAlign: 'center',
            marginTop: '22px',
            marginBottom: '0',
            color: '#64748b',
            fontSize: '14px',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/auth"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;