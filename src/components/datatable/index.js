import { useEffect, useRef, forwardRef } from "react";
import _ from "lodash";
import { useTable, useSortBy, usePagination, useRowSelect } from "react-table";
import {
  BiChevronDown,
  BiChevronUp,
  BiLeftArrowAlt,
  BiRightArrowAlt,
} from "react-icons/bi";

import { PageWithText, Pagination } from "../paginations";
import { toArray } from "~/lib/utils";

const IndeterminateCheckbox = forwardRef(({ indeterminate, ...rest }, ref) => {
  const defaultRef = useRef();

  const resolvedRef = ref || defaultRef;

  useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <input
      ref={resolvedRef}
      type="checkbox"
      {...rest}
      className="form-checkbox h-4 w-4"
    />
  );
});

const DataTable = ({
  columns,
  size,
  data,
  rowSelectEnable = false,
  defaultPageSize = 10,
  pageSizes = [10, 25, 50, 100],
  noPagination = false,
  noRecordPerPage = false,
  className = "",
  style,
}) => {
  const tableRef = useRef();
  const {
    getTableProps,
    getTableBodyProps,
    rows,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        pageSize: defaultPageSize,
      },
      disableSortRemove: true,
      stateReducer: (newState, action, prevState) =>
        action.type.startsWith("reset") ? prevState : newState,
    },
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) =>
        [
          rowSelectEnable
            ? {
                id: "selection",
                Header: ({ getToggleAllRowsSelectedProps }) => (
                  <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
                ),
                Cell: ({ row }) => (
                  <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                ),
              }
            : undefined,
          ...columns,
        ].filter((c) => c)
      );
    }
  );

  useEffect(() => {
    if (pageIndex + 1 > pageCount) {
      gotoPage(pageCount - 1);
    }
  }, [pageIndex, pageCount, gotoPage]);

  const loading = toArray(data).findIndex((d) => d.skeleton) > -1;

  return (
    <>
      <table
        ref={tableRef}
        {...getTableProps()}
        className={`table rounded ${className}`}
        style={{
          ...style,
        }}
      >
        <thead>
          {headerGroups.map((hg) => (
            <tr key={`tr-${hg.headers[0].id}`} {...hg.getHeaderGroupProps()}>
              {hg.headers.map((c, i) => (
                <th
                  key={`th-${i}`}
                  {...c.getHeaderProps(c.getSortByToggleProps())}
                  className={`${
                    i === 0
                      ? "rounded-tl"
                      : i === hg.headers.length - 1
                      ? "rounded-tr"
                      : ""
                  } ${c.className || ""}`}
                >
                  <div
                    className={`flex flex-row items-center ${
                      c.headerClassName?.includes("justify-")
                        ? ""
                        : "justify-start"
                    } ${c.headerClassName || ""}`}
                  >
                    <span>{c.render("Header")}</span>
                    {c.isSorted && (
                      <span className="ml-1.5">
                        {c.isSortedDesc ? (
                          <BiChevronDown className="stroke-current" />
                        ) : (
                          <BiChevronUp className="stroke-current" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {(noPagination ? rows : page).map((row, i) => {
            prepareRow(row);

            return (
              <tr key={`row-${i}`} {...row.getRowProps()}>
                {row.cells.map((cell, j) => (
                  <td
                    key={`cell-${j}`}
                    {...cell.getCellProps()}
                    className={_.head(headerGroups)?.headers[j]?.className}
                  >
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!noPagination && data?.length > 0 && (
        <div
          className={`flex flex-col items-center ${
            noRecordPerPage || pageCount > 4
              ? "justify-center sm:flex-row"
              : "justify-between sm:grid sm:grid-cols-3"
          } my-0.5 gap-4`}
        >
          {!noRecordPerPage && (
            <select
              disabled={loading}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="form-select w-24 cursor-pointer appearance-none rounded border-zinc-100 bg-slate-100 py-2 px-3 text-center shadow outline-none hover:bg-slate-200 dark:border-zinc-900 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              {pageSizes.map((s, i) => (
                <option
                  key={`page-size-${i}`}
                  value={s}
                  className="text-xs font-medium"
                >
                  Show {s}
                </option>
              ))}
            </select>
          )}
          {pageCount > 1 && pageCount <= 4 && (
            <div className="my-2.5 mx-auto space-x-1 sm:my-0">
              <span>Page</span>
              <span className="font-bold">{pageIndex + 1}</span>
              <span>of</span>
              <span className="font-bold">{pageOptions.length}</span>
            </div>
          )}
          <div className="pagination flex flex-wrap items-center justify-end space-x-2">
            {pageCount > 4 ? (
              <div className="mt-2.5 flex flex-col items-center justify-center sm:mt-0 sm:flex-row">
                <Pagination
                  items={[...Array(pageCount).keys()]}
                  disabled={loading}
                  active={pageIndex + 1}
                  previous={<BiLeftArrowAlt size={16} />}
                  next={<BiRightArrowAlt size={16} />}
                  onClick={(p) => {
                    gotoPage(p - 1);
                    // tableRef.current.scrollIntoView()
                  }}
                  icons={true}
                  className="space-x-0.5"
                />
              </div>
            ) : (
              <>
                {pageIndex !== 0 && (
                  <PageWithText
                    size={size}
                    disabled={loading}
                    onClick={() => {
                      gotoPage(0);
                      tableRef.current.scrollIntoView();
                    }}
                  >
                    <span className="font-bold text-black dark:text-white">
                      First
                    </span>
                  </PageWithText>
                )}
                {canPreviousPage && (
                  <PageWithText
                    size={size}
                    disabled={loading}
                    onClick={() => {
                      previousPage();
                      // tableRef.current.scrollIntoView()
                    }}
                  >
                    Previous
                  </PageWithText>
                )}
                {canNextPage && (
                  <PageWithText
                    size={size}
                    disabled={!canNextPage || loading}
                    onClick={() => {
                      nextPage();
                      // tableRef.current.scrollIntoView()
                    }}
                  >
                    Next
                  </PageWithText>
                )}
                {pageIndex !== pageCount - 1 && (
                  <PageWithText
                    size={size}
                    disabled={!canNextPage || loading}
                    onClick={() => {
                      gotoPage(pageCount - 1);
                      tableRef.current.scrollIntoView();
                    }}
                  >
                    <span className="font-bold text-black dark:text-white">
                      Last
                    </span>
                  </PageWithText>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
