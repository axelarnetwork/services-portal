import Link from "next/link";
import { useRouter } from "next/router";

import menus from "../menus";

export default ({ onClick }) => {
  const router = useRouter();
  const { pathname } = { ...router };

  return (
    <div className="backdrop-blur-16 flex w-40 flex-col rounded-lg py-1 shadow dark:shadow-slate-700">
      {menus.map((m, i) => {
        const { id, disabled, title, path, others_paths, external } = { ...m };

        const selected =
          !external && (pathname === path || others_paths?.includes(pathname));

        const item = (
          <span className="whitespace-nowrap tracking-wider">{title}</span>
        );

        const className = `w-full ${
          i === 0
            ? "rounded-t-lg"
            : i === menus.length - 1
            ? "rounded-b-lg"
            : ""
        } ${disabled ? "cursor-not-allowed" : ""} flex items-center uppercase ${
          selected
            ? "text-blue-500 dark:text-blue-500 text-sm font-bold"
            : "text-slate-600 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 text-sm font-normal hover:font-semibold"
        } space-x-1.5 py-2 px-3`;

        return external ? (
          <a
            key={id}
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className={className}
          >
            {item}
          </a>
        ) : (
          <Link key={id} href={path} onClick={onClick} className={className}>
            {item}
          </Link>
        );
      })}
    </div>
  );
};
