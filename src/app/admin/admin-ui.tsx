"use client";

import {
  useEffect,
  useRef,
  useState,
  useActionState,
  type ReactNode,
} from "react";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type AdminFormAction = (
  previousState: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

export const idleAdminActionState: AdminActionState = {
  status: "idle",
  message: "",
};

export function ActionFeedback({
  state,
  placement = "inline",
}: {
  state: AdminActionState;
  placement?: "inline" | "toast";
}) {
  const [dismissedState, setDismissedState] =
    useState<AdminActionState | null>(null);

  useEffect(() => {
    if (placement !== "toast" || state.status !== "success") return;

    const timeout = window.setTimeout(() => setDismissedState(state), 4000);
    return () => window.clearTimeout(timeout);
  }, [placement, state]);

  if (
    state.status === "idle" ||
    (placement === "toast" &&
      state.status === "success" &&
      dismissedState === state)
  ) {
    return null;
  }

  return (
    <p
      className={`${placement === "toast" ? "pointer-events-none fixed right-4 bottom-4 z-40 max-w-[calc(100vw-2rem)] shadow-lg sm:right-6 sm:bottom-6" : "mt-3"} rounded-lg border px-3 py-2 text-sm ${
        state.status === "success"
          ? "border-green-200 bg-green-50 text-good"
          : "border-rose-200 bg-rose-50 text-alert"
      }`}
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function ActionForm({
  action,
  children,
  buttonLabel,
  hiddenFields,
  buttonClassName = "inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink hover:bg-plum-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50",
}: {
  action: AdminFormAction;
  children?: ReactNode;
  buttonLabel: string;
  hiddenFields: Record<string, string>;
  buttonClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    idleAdminActionState,
  );

  return (
    <form action={formAction} className="min-w-0">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <button className={buttonClassName} type="submit" disabled={pending}>
        {pending ? "Aguarde…" : buttonLabel}
      </button>
        <ActionFeedback state={state} placement="toast" />
    </form>
  );
}

export function ConfirmAction({
  action,
  hiddenFields,
  label = "Excluir",
  description,
  dialogId,
}: {
  action: AdminFormAction;
  hiddenFields: Record<string, string>;
  label?: string;
  description: string;
  dialogId: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const [state, formAction, pending] = useActionState(
    action,
    idleAdminActionState,
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!open || !dialog || dialog.open) return;
    dialog.showModal();
    cancelButtonRef.current?.focus();
  }, [open]);

  function closeDialog() {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    } else {
      setOpen(false);
    }
  }

  return (
    <div>
      <button
        ref={triggerButtonRef}
        className="inline-flex min-h-11 min-w-20 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-alert transition-colors hover:bg-rose-50 active:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert motion-reduce:transition-none"
        type="button"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open ? (
        <dialog
          ref={dialogRef}
          className="fixed inset-0 z-50 m-0 grid h-dvh w-screen max-h-none max-w-none place-items-center border-0 bg-transparent p-4 backdrop:bg-ink/50"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
          aria-describedby={`${dialogId}-description`}
          onCancel={(event) => {
            event.preventDefault();
            closeDialog();
          }}
          onClose={() => {
            setOpen(false);
            triggerButtonRef.current?.focus();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-xl">
            <h2 className="m-0 font-serif text-xl text-ink" id={`${dialogId}-title`}>
              Confirmar exclusão definitiva?
            </h2>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-muted" id={`${dialogId}-description`}>
              {description}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                ref={cancelButtonRef}
                className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-3 text-sm font-bold text-ink transition-colors hover:bg-plum-soft active:bg-plum-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum/50 motion-reduce:transition-none"
                type="button"
                onClick={closeDialog}
                disabled={pending}
              >
                Cancelar
              </button>
              <form action={formAction}>
                {Object.entries(hiddenFields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                <button
                  className="inline-flex min-h-11 items-center rounded-lg bg-alert px-3 text-sm font-bold text-white transition-colors hover:bg-alert/90 active:bg-alert/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert disabled:opacity-60 motion-reduce:transition-none"
                  type="submit"
                  disabled={pending}
                >
                  {pending ? "Excluindo…" : "Confirmar exclusão"}
                </button>
              </form>
            </div>
            <ActionFeedback state={state} />
          </div>
        </dialog>
      ) : null}
      {!open ? <ActionFeedback state={state} /> : null}
    </div>
  );
}
