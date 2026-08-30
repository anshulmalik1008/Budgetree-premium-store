import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2]">
          <div className="text-sm text-black/50">
            Loading...
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
