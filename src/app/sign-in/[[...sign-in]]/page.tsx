import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8">
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 28"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-primary"
        >
          <path d="M 8 3.5 Q 12 7 16 3.5" />
          <g transform="translate(0, 4)">
            <circle cx="12" cy="12" r="1" />
            <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
            <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
          </g>
        </svg>
        <span className="font-bold text-2xl bg-gradient-to-r from-foreground to-primary/70 bg-clip-text text-transparent">
          ChaosLimbă
        </span>
      </div>
      <SignIn />
    </div>
  );
}
