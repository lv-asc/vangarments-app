// Example React component for OAuth integration
// This file shows how to integrate OAuth login in your frontend

import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  personalInfo: {
    name: string;
    profilePicture?: string;
  };
}

interface LinkedAccounts {
  google: boolean;
  facebook: boolean;
  hasPassword: boolean;
}

const AuthComponent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccounts | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for OAuth token in URL (after OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Store token and redirect to clean URL
      localStorage.setItem('authToken', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchUserProfile();
    } else if (localStorage.getItem('authToken')) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        fetchLinkedAccounts();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchLinkedAccounts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/linked-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLinkedAccounts(data.linkedAccounts);
      }
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/facebook`;
  };

  const handleTraditionalLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        fetchLinkedAccounts();
      } else {
        const error = await response.json();
        alert(error.error.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'facebook', email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/link-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, email, password }),
      });

      if (response.ok) {
        // Redirect to OAuth provider for linking
        window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/${provider}`;
      } else {
        const error = await response.json();
        alert(error.error.message);
      }
    } catch (error) {
      console.error('Account linking failed:', error);
      alert('Account linking failed. Please try again.');
    }
  };

  const handleUnlinkAccount = async (provider: 'google' | 'facebook') => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/unlink-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        fetchLinkedAccounts(); // Refresh linked accounts
        alert(`${provider} account unlinked successfully`);
      } else {
        const error = await response.json();
        alert(error.error.message);
      }
    } catch (error) {
      console.error('Account unlinking failed:', error);
      alert('Account unlinking failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setLinkedAccounts(null);
  };

  if (user) {
    return (
      <div className="user-dashboard">
        <div className="user-info">
          <h2>Welcome, {user.personalInfo.name}!</h2>
          {user.personalInfo.profilePicture && (
            <img 
              src={user.personalInfo.profilePicture} 
              alt="Profile" 
              className="profile-picture"
            />
          )}
          <p>Email: {user.email}</p>
        </div>

        {linkedAccounts && (
          <div className="linked-accounts">
            <h3>Linked Accounts</h3>
            <div className="account-status">
              <div>
                Google: {linkedAccounts.google ? '✅ Linked' : '❌ Not linked'}
                {linkedAccounts.google ? (
                  <button onClick={() => handleUnlinkAccount('google')}>
                    Unlink Google
                  </button>
                ) : (
                  <button onClick={handleGoogleLogin}>
                    Link Google Account
                  </button>
                )}
              </div>
              <div>
                Facebook: {linkedAccounts.facebook ? '✅ Linked' : '❌ Not linked'}
                {linkedAccounts.facebook ? (
                  <button onClick={() => handleUnlinkAccount('facebook')}>
                    Unlink Facebook
                  </button>
                ) : (
                  <button onClick={handleFacebookLogin}>
                    Link Facebook Account
                  </button>
                )}
              </div>
              <div>
                Password: {linkedAccounts.hasPassword ? '✅ Set' : '❌ Not set'}
              </div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2>Login to Vangarments</h2>
      
      {/* OAuth Login Buttons */}
      <div className="oauth-buttons">
        <button 
          onClick={handleGoogleLogin}
          className="google-login-btn"
          disabled={loading}
        >
          <img src="/google-icon.svg" alt="Google" />
          Continue with Google
        </button>
        
        <button 
          onClick={handleFacebookLogin}
          className="facebook-login-btn"
          disabled={loading}
        >
          <img src="/facebook-icon.svg" alt="Facebook" />
          Continue with Facebook
        </button>
      </div>

      <div className="divider">
        <span>or</span>
      </div>

      {/* Traditional Login Form */}
      <LoginForm onLogin={handleTraditionalLogin} loading={loading} />
    </div>
  );
};

// Traditional login form component
const LoginForm: React.FC<{
  onLogin: (email: string, password: string) => void;
  loading: boolean;
}> = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <button type="submit" disabled={loading} className="login-btn">
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default AuthComponent;

/* CSS Styles (add to your stylesheet) */
/*
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.google-login-btn,
.facebook-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
}

.google-login-btn:hover {
  background: #f5f5f5;
}

.facebook-login-btn {
  background: #1877f2;
  color: white;
  border-color: #1877f2;
}

.facebook-login-btn:hover {
  background: #166fe5;
}

.divider {
  text-align: center;
  margin: 1rem 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #ddd;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #666;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-weight: 500;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.login-btn {
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.login-btn:hover {
  background: #0056b3;
}

.login-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.user-dashboard {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-picture {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.linked-accounts {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.account-status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.account-status > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c82333;
}
*/