"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPassword, checkPassword, t } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    const userHash = localStorage.getItem('user_hash');
    if (!userHash) {
      setIsSettingPassword(true);
    }
  }, []);

  const handleSetPassword = () => {
    if (!username || !password || !confirmPassword) {
      showError(t('requiredFields'));
      return;
    }
    if (password !== confirmPassword) {
      showError(t('passwordsMismatch'));
      return;
    }

    try {
      localStorage.setItem('user_hash', hashPassword(password));
      localStorage.setItem('currentUser', username); // Store initial user
      showSuccess(t('passwordSetSuccess'));
      setIsSettingPassword(false);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
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

    const storedHash = localStorage.getItem('user_hash');
    const storedUser = localStorage.getItem('currentUser'); // Assuming single user for now, or first user set

    if (storedHash && storedUser && checkPassword(password, storedHash) && username === storedUser) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', username); // Ensure currentUser is set for this session
      navigate('/');
    } else {
      showError(t('loginFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{isSettingPassword ? t('setPasswordTitle') : t('loginTitle')}</CardTitle>
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
          {isSettingPassword && (
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
          <Button onClick={isSettingPassword ? handleSetPassword : handleLogin} className="w-full">
            {isSettingPassword ? t('setPasswordButton') : t('loginButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;