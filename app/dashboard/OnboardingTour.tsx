"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/Modal";
import { completeOnboarding } from "./onboardingActions";

type Slide = { title: string; body: string };

export function OnboardingTour({ show, canManageTeam }: { show: boolean; canManageTeam: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(show);
  const [step, setStep] = useState(0);

  // Never compete with the mandatory 2FA setup/challenge screen for attention.
  if (pathname.startsWith("/dashboard/security")) return null;

  const slides: Slide[] = [
    {
      title: "Welcome to Vorexa",
      body: "This is your property management dashboard - buildings, tenants, leasing, arrears, meetings and more, all in one place.",
    },
    {
      title: "Your Buildings",
      body: canManageTeam
        ? "As a manager, you have oversight of every building in your portfolio(s), and you can assign team members and administrators to specific buildings from Team & Access."
        : "You'll only see the buildings your portfolio manager has assigned you to. If a building you expect to see is missing, ask them to assign you to it in Team & Access.",
    },
    {
      title: "Tasks, Messages & Tickets",
      body: "Tasks & Messages is where your manager assigns you work and where replies stay in one thread. Support Tickets is separate - use it any time to log a fault or a bug, and it gets a ticket number so it's tracked.",
    },
    {
      title: "You're all set",
      body: "Check Reports for a portfolio and building breakdown, and Security if you'd like to turn on two-factor authentication for your own account. You can revisit this anytime - there's nothing to remember right now.",
    },
  ];

  async function finish() {
    setOpen(false);
    await completeOnboarding();
  }

  if (!open) return null;

  const isLast = step === slides.length - 1;

  return (
    <Modal title={slides[step].title} onClose={finish}>
      <div className="space-y-4">
        <p className="text-sm text-charcoal-200">{slides[step].body}</p>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${i === step ? "bg-cyan-400" : "bg-charcoal-700"}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={finish}>
              Skip
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            >
              {isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
