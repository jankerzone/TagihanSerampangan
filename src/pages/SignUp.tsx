import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

const SignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <ClerkSignUp
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'shadow-lg',
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </div>
  );
};

export default SignUp;
