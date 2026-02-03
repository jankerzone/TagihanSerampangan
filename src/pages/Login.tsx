import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { api } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password || (isRegistering && !confirmPassword)) {
      showError(t('requiredFields'));
      return;
    }
    if (password !== confirmPassword) {
      showError(t('passwordsMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.register({ username, password });
      showSuccess("Registration successful! Please login.");
      setIsRegistering(false);
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Error registering:", error);
      showError(error.message || t('passwordSetError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showError(t('requiredFields'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.login({ username, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', response.user.username);
      localStorage.setItem('isLoggedIn', 'true');
      showSuccess("Login successful!");
      navigate('/');
    } catch (error: any) {
      console.error("Error logging in:", error);
      showError(error.message || t('loginFailed'));
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          )}
          <Button onClick={isRegistering ? handleRegister : handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : (isRegistering ? t('setPasswordButton') : t('loginButton'))}
          </Button>
          <Button variant="link" onClick={handleToggleRegister} className="w-full" disabled={isLoading}>
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;