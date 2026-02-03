import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

const SignIn = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <ClerkSignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'shadow-lg',
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
};

export default SignIn;
