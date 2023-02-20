import Link from "next/link";
import { useRouter } from "next/router";

import menus from "./menus";

const Navigation = () => {
  const router = useRouter();
  const { pathname } = { ...router };

  return (
    <div className="mx-auto hidden w-full items-center justify-start xl:flex xl:space-x-6">
      {menus.map((m) => {
        const { id, disabled, title, path, others_paths, external } = { ...m };

        const selected =
          !external && (pathname === path || others_paths?.includes(pathname));

        const item = (
          <span className="whitespace-nowrap tracking-wider">{title}</span>
        );

        const className = `${
          disabled ? "cursor-not-allowed" : ""
        } flex items-center uppercase ${
          selected
            ? "text-blue-500 dark:text-blue-500 text-sm font-bold"
            : "text-slate-600 hover:text-blue-400 dark:text-slate-300 dark:hover:text-blue-400 text-sm font-normal"
        } space-x-1`;

        return external ? (
          <a
            key={id}
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {item}
          </a>
        ) : (
          <Link key={id} href={path} className={className}>
            {item}
          </Link>
        );
      })}
    </div>
  );
};

export default Navigation;
