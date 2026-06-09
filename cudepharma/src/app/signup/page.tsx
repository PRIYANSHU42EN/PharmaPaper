import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="relative w-full min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white flex items-center justify-center px-6 py-12 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-40" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] ambient-brand-glow pointer-events-none opacity-30" style={{ background: "radial-gradient(circle, rgba(5, 130, 202, 0.05) 0%, rgba(5, 25, 35, 0) 70%)" }} />

      <div className="relative z-10">
        <SignUp routing="hash" signInUrl="/login" />
      </div>
    </div>
  );
}
