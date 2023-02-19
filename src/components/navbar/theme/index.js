import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { RiMoonFill, RiSunLine } from "react-icons/ri";

import { THEME } from "../../../reducers/types";

export default () => {
  const dispatch = useDispatch();
  const { preferences } = useSelector(
    (state) => ({
      preferences: state.preferences,
    }),
    shallowEqual
  );
  const { theme } = { ...preferences };

  return (
    <button
      onClick={() => {
        dispatch({
          type: THEME,
          value: theme === "light" ? "dark" : "light",
        });
      }}
      className="flex h-16 w-8 items-center justify-center sm:mr-1"
    >
      <div className="flex h-6 w-6 items-center justify-center">
        {theme === "light" ? <RiMoonFill size={18} /> : <RiSunLine size={18} />}
      </div>
    </button>
  );
};
