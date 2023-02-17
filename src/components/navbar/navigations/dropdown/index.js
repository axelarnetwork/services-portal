import { useState, useEffect, useRef } from "react";
import { FiMenu } from "react-icons/fi";

import Items from "./items";

export default () => {
  const [hidden, setHidden] = useState(true);

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        hidden ||
        buttonRef.current.contains(e.target) ||
        dropdownRef.current.contains(e.target)
      ) {
        return false;
      }

      setHidden(!hidden);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hidden, buttonRef, dropdownRef]);

  const onClick = () => setHidden(!hidden);

  return (
    <div className="relative block xl:hidden">
      <button
        ref={buttonRef}
        onClick={onClick}
        className="flex h-16 w-12 items-center justify-center"
      >
        <FiMenu size={24} />
      </button>
      <div
        ref={dropdownRef}
        className={`dropdown ${
          hidden ? "" : "open"
        } absolute top-0 left-3 mt-12`}
      >
        <div className="bottom-start">
          <Items onClick={onClick} />
        </div>
      </div>
    </div>
  );
};
