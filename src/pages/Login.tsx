"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPassword, checkPassword, t, loadUsers, saveUsers } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [users, setUsers] = useState(loadUsers());

  useEffect(() => {
    // If no users exist at all, default to registration mode
    if (Object.keys(users).length === 0) {
      setIsRegistering(true);
    }
  }, [users]);

  const handleRegister = () => {
    if (!username || !password || (isRegistering && !confirmPassword)) {
      showError(t('requiredFields'));
      return;
    }
    if (password !== confirmPassword) {
      showError(t('passwordsMismatch'));
      return;
    }
    if (users[username]) {
      showError("Username already exists. Please try logging in or choose another username.");
      return;
    }

    try {
      const hashedPassword = hashPassword(password);
      const updatedUsers = { ...users, [username]: hashedPassword };
      saveUsers(updatedUsers);
      setUsers(updatedUsers); // Update local state
      
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', username);
      showSuccess(t('passwordSetSuccess'));
      navigate('/');
    } catch (error) {
      console.error("Error setting password:", error);
      showError(t('passwordSetError'));
    }
  };

  const handleLogin = () => {
    if (!username || !password) {
      showError(t('requiredFields'));
      return;
    }

    const storedHash = users[username];

    if (storedHash && checkPassword(password, storedHash)) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', username);
      showSuccess("Login successful!"); // Using a generic success message for login
      navigate('/');
    } else {
      showError(t('loginFailed'));
    }
  };

  const handleToggleRegister = () => {
    setIsRegistering(prev => !prev);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{isRegistering ? t('setPasswordTitle') : t('loginTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">{t('emailUsername')}</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('emailUsername')}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              required
            />
          </div>
          {isRegistering && (
            <div>
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPassword')}
                required
              />
            </div>
          )}
          <Button onClick={isRegistering ? handleRegister : handleLogin} className="w-full">
            {isRegistering ? t('setPasswordButton') : t('loginButton')}
          </Button>
          <Button variant="link" onClick={handleToggleRegister} className="w-full">
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;