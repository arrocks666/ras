"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

export default function LoginPromptModal({
  open,
  onClose,
  title = "Please Login",
  message = "You need to be logged in to continue.",
}: Props) {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#FAD4DD]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF6F6] text-3xl mb-4">
            👋
          </div>
          <h2 className="text-xl font-bold text-[#2B1A24] mb-2">{title}</h2>
          <p className="text-sm text-[#6B5558] mb-6 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="space-y-3">
          <Link 
            href="/login"
            className="block w-full rounded-xl bg-[#E8546B] py-3 text-center text-sm font-bold text-white shadow-orange-glow transition hover:bg-[#b02a58]"
          >
            Login
          </Link>
          <Link 
            href="/signup"
            className="block w-full rounded-xl border-2 border-[#E8546B] bg-white py-3 text-center text-sm font-bold text-[#E8546B] transition hover:bg-[#FFF6F6]"
          >
            Create Account
          </Link>
          <button 
            onClick={onClose}
            className="block w-full py-2 text-center text-xs font-medium text-[#6B5558] hover:text-[#2B1A24]"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}