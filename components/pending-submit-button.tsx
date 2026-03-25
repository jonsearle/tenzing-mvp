"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  className: string;
  idleLabel: string;
  pendingLabel: string;
};

export function PendingSubmitButton({
  className,
  idleLabel,
  pendingLabel,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
