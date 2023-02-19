import { useState } from "react";
import { BiX } from "react-icons/bi";

import Portal from "../portal";

const Notifications = ({
  visible = true,
  outerClassNames,
  innerClassNames,
  animation,
  btnTitle,
  btnClassNames,
  icon,
  content,
  hideButton,
  onClose,
}) => {
  const [open, setOpen] = useState(visible);

  const show = () => setOpen(true);

  const hide = () => {
    setOpen(false);

    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {!hideButton && (
        <button type="button" onClick={show} className={`${btnClassNames}`}>
          {btnTitle}
        </button>
      )}
      {open && (
        <Portal selector="#portal">
          <div className={`${visible ? animation : ""} ${outerClassNames}`}>
            <div
              className={`flex w-full items-center justify-start p-4 ${innerClassNames}`}
            >
              {icon && <div className="flex-shrink">{icon}</div>}
              <div className="flex-grow">{content}</div>
              <div className="flex-shrink">
                <button
                  onClick={hide}
                  className="ml-auto flex items-center justify-center"
                >
                  <BiX className="ml-2 h-4 w-4 stroke-current" />
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default Notifications;
