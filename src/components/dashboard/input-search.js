import { useState, useEffect } from "react";
import { DebounceInput } from "react-debounce-input";
import { useRouter } from "next/router";

import { split } from "~/lib/utils";

const InputSearch = () => {
  const router = useRouter();
  const { pathname, query } = { ...router };
  const { search } = { ...query };

  const [input, setInput] = useState(null);

  useEffect(() => {
    if (typeof input !== "string") {
      setInput(search);
    }
  }, [search]);

  useEffect(() => {
    if (typeof input === "string") {
      router.push(
        `${pathname}${
          input ? `?${new URLSearchParams({ search: input }).toString()}` : ""
        }`,
        undefined,
        {
          shallow: true,
        }
      );
    }
  }, [input]);

  return (
    <DebounceInput
      debounceTimeout={500}
      size="small"
      type="text"
      placeholder="Search..."
      value={input}
      onChange={(e) => setInput(split(e.target.value, "normal", " ").join(" "))}
      className="w-full rounded-xl border border-slate-300 bg-transparent py-2 px-3 text-lg focus:border-blue-500 dark:border-slate-700 dark:focus:border-blue-500 sm:w-80"
    />
  );
};

export default InputSearch;
