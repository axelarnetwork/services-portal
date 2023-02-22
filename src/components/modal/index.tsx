import {
  useState,
  useEffect,
  useRef,
  ReactNode,
  FC,
  MouseEventHandler,
} from "react";
import { useSelector, shallowEqual } from "react-redux";
import { Tooltip } from "@material-tailwind/react";
import { placement } from "@material-tailwind/react/types/components/menu";

import Portal from "../portal";

type ModalProps = {
  id?: string;
  hidden?: boolean;
  disabled?: boolean;
  tooltip?: ReactNode;
  placement?: placement;
  onClick?: (open: boolean) => void;
  buttonTitle?: ReactNode;
  buttonClassName?: string;
  title?: ReactNode;
  icon?: ReactNode;
  body?: ReactNode;
  noCancelOnClickOutside?: boolean;
  cancelDisabled?: boolean;
  onCancel?: () => void;
  cancelButtonTitle?: ReactNode;
  cancelButtonClassName?: string;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onConfirmHide?: boolean;
  confirmButtonTitle?: ReactNode;
  confirmButtonClassName?: string;
  onClose?: () => void;
  noButtons?: boolean;
  modalClassName?: string;
};

type PartialState = {
  preferences: {
    theme: string;
  };
};

const Modal: FC<ModalProps> = ({
  id = "portal",
  hidden,
  disabled,
  tooltip,
  placement = "top",
  onClick,
  buttonTitle,
  buttonClassName,
  title,
  icon,
  body,
  noCancelOnClickOutside = false,
  cancelDisabled = false,
  onCancel,
  cancelButtonTitle,
  cancelButtonClassName,
  confirmDisabled = false,
  onConfirm,
  onConfirmHide = true,
  confirmButtonTitle,
  confirmButtonClassName,
  onClose,
  noButtons,
  modalClassName = "",
}) => {
  const theme = useSelector<PartialState>(
    (state) => state.preferences.theme,
    shallowEqual
  );

  const [open, setOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (onClick) {
      onClick(true);
    }
    setOpen(true);
  };

  const hide = () => {
    if (typeof hidden !== "boolean") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!modalRef?.current) {
        return false;
      }

      if (!open || modalRef.current.contains(e.target as Node)) {
        return false;
      }

      if (!cancelDisabled) {
        setOpen(!open);

        if (onClose) {
          onClose();
        }
      }
    };

    if (!noCancelOnClickOutside) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [modalRef, open, cancelDisabled]);

  useEffect(() => {
    if (typeof hidden === "boolean") {
      setOpen(!hidden);
    }
  }, [hidden]);

  const buttonComponent = (
    <button
      type="button"
      disabled={disabled}
      onClick={show}
      className={
        buttonClassName ||
        "btn btn-default btn-rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
      }
    >
      {buttonTitle}
    </button>
  );

  return (
    <>
      {tooltip ? (
        <Tooltip
          placement={placement}
          content={tooltip}
          className="z-50 bg-black text-xs text-white"
        >
          {buttonComponent}
        </Tooltip>
      ) : (
        buttonComponent
      )}
      {open && (
        <Portal selector={`#${id}`}>
          <div className="modal-backdrop fade-in" />
          <div
            data-background={theme}
            className={`modal show ${theme === "dark" ? "dark" : ""}`}
          >
            <div
              ref={modalRef}
              className={`w-full ${
                modalClassName.includes("max-w-") ? "" : "max-w-sm lg:max-w-lg"
              } relative mx-auto lg:my-4 ${modalClassName}`}
            >
              <div className="relative flex w-full flex-col rounded-lg border-0 bg-white shadow-lg outline-none dark:bg-slate-900 dark:bg-opacity-90">
                <div className="relative flex-auto p-4">
                  <div className="flex items-start justify-start space-x-4 p-2">
                    {icon && <div className="w-12 flex-shrink-0">{icon}</div>}
                    <div className="flex w-full flex-col">
                      <div className="mb-2 text-lg font-medium uppercase tracking-wider">
                        {title}
                      </div>
                      {body}
                    </div>
                  </div>
                </div>
                {!noButtons && (
                  <div
                    className={`flex items-center justify-end rounded-b border-t border-solid border-zinc-100 dark:border-zinc-800 ${
                      cancelButtonClassName?.includes("hidden")
                        ? "space-x-0"
                        : "space-x-2"
                    } py-4 px-6`}
                  >
                    <button
                      type="button"
                      disabled={cancelDisabled}
                      onClick={() => {
                        if (onCancel) {
                          onCancel();
                        }
                        hide();
                      }}
                      className={
                        cancelButtonClassName ||
                        "btn btn-default btn-rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }
                    >
                      {cancelButtonTitle || "Cancel"}
                    </button>
                    <button
                      type="button"
                      disabled={confirmDisabled}
                      onClick={() => {
                        if (onConfirm) {
                          onConfirm();
                        }
                        if (onConfirmHide) {
                          hide();
                        }
                      }}
                      className={
                        confirmButtonClassName ||
                        "btn btn-default btn-rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
                      }
                    >
                      {confirmButtonTitle || "Confirm"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default Modal;
