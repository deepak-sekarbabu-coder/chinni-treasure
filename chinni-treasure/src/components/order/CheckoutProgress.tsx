"use client";

interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Personal" },
  { number: 2, label: "Delivery" },
  { number: 3, label: "Payment" },
];

interface CheckoutProgressProps {
  currentStep: number;
}

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="checkout-progress" role="navigation" aria-label="Checkout progress">
      <div className="checkout-progress-bar">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === STEPS.length - 1;

          return (
            <div
              key={step.number}
              className={`checkout-step${isCompleted ? " completed" : ""}${isCurrent ? " current" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="checkout-step-indicator">
                <span className="checkout-step-circle" aria-hidden="true">
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </span>
                {!isLast && <div className="checkout-step-connector" />}
              </div>
              <span className="checkout-step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
      <div className="checkout-step-name" aria-live="polite">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.label ?? ""}
      </div>
    </div>
  );
}
