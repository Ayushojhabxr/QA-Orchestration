import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiEye, FiSearch } from "react-icons/fi";
import { useGlobalFilter, usePagination, useSortBy, useTable } from "react-table";
import GlassCard from "./GlassCard";
import GlowButton from "./GlowButton";

const statusOptions = ["Pending", "Assigned", "In Progress", "Testing", "Fixed", "Closed"];

function DynamicTestCaseTable({ rows, developers, onSaveRow, onAssignRow, onStatusRow }) {
  const [draftRows, setDraftRows] = useState({});

  useEffect(() => {
    const nextDrafts = {};
    rows.forEach((row) => {
      nextDrafts[row._id] = {
        rawData: { ...(row.rawData || {}) },
        assignedToDeveloperId:
          row.assignedToDeveloperId?._id || row.assignedToDeveloperId || row.assignedTo?._id || "",
        status: row.status,
      };
    });
    setDraftRows(nextDrafts);
  }, [rows]);

  const headers = useMemo(() => {
    const ordered = [];
    rows.forEach((row) => {
      (row.headers || Object.keys(row.rawData || {})).forEach((header) => {
        if (!ordered.includes(header)) {
          ordered.push(header);
        }
      });
    });
    return ordered;
  }, [rows]);

  const data = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        rawData: draftRows[row._id]?.rawData || row.rawData || {},
        assignedToValue: draftRows[row._id]?.assignedToDeveloperId || "",
        statusValue: draftRows[row._id]?.status || row.status,
      })),
    [draftRows, rows]
  );

  const columns = useMemo(
    () => [
      ...headers.map((header) => ({
        Header: header,
        accessor: (row) => row.rawData?.[header] || "",
        id: header,
        Cell: ({ row, value }) => (
          <input
            value={value}
            onChange={(event) =>
              setDraftRows((current) => ({
                ...current,
                [row.original._id]: {
                  ...current[row.original._id],
                  rawData: {
                    ...current[row.original._id]?.rawData,
                    [header]: event.target.value,
                  },
                },
              }))
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none"
          />
        ),
      })),
      {
        Header: "Project",
        accessor: (row) => row.project?.name || row.projectName || "-",
        id: "project",
        Cell: ({ row }) => (
          <div className="min-w-36 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
            {row.original.project?.name || "-"}
          </div>
        ),
      },
      {
        Header: "Assigned To",
        accessor: "assignedToValue",
        Cell: ({ row, value }) => (
          <select
            value={value}
            onChange={async (event) => {
              const nextValue = event.target.value;
              setDraftRows((current) => ({
                ...current,
                [row.original._id]: {
                  ...current[row.original._id],
                  assignedToDeveloperId: nextValue,
                },
              }));
              await onAssignRow(row.original._id, nextValue);
            }}
            className="w-40 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            <option value="">Unassigned</option>
            {developers.map((developer) => (
              <option key={developer._id} value={developer._id}>
                {developer.name}
              </option>
            ))}
          </select>
        ),
      },
      {
        Header: "Status",
        accessor: "statusValue",
        Cell: ({ row, value }) => (
          <select
            value={value}
            onChange={async (event) => {
              const nextValue = event.target.value;
              setDraftRows((current) => ({
                ...current,
                [row.original._id]: {
                  ...current[row.original._id],
                  status: nextValue,
                },
              }));
              await onStatusRow(row.original._id, nextValue);
            }}
            className="w-36 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ),
      },
      {
        Header: "Action",
        id: "action",
        Cell: ({ row }) => (
          <GlowButton
            type="button"
            variant="ghost"
            onClick={() =>
              onSaveRow(row.original._id, draftRows[row.original._id] || {
                rawData: row.original.rawData || {},
                assignedToDeveloperId:
                  row.original.assignedToDeveloperId?._id ||
                  row.original.assignedToDeveloperId ||
                  row.original.assignedTo?._id ||
                  "",
                status: row.original.status,
              })
            }
          >
            Save
          </GlowButton>
        ),
      },
    ],
    [developers, draftRows, headers, onAssignRow, onSaveRow, onStatusRow]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        pageSize: 8,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    allColumns,
    state,
    setGlobalFilter,
    pageOptions,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    gotoPage,
  } = tableInstance;

  if (!rows.length) {
    return (
      <GlassCard className="p-8 text-center text-slate-400">
        No test cases available for the current sheet filter.
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <FiSearch className="text-slate-500" />
            <input
              value={state.globalFilter || ""}
              onChange={(event) => setGlobalFilter(event.target.value || undefined)}
              placeholder="Search scenarios, sheets, descriptions..."
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
              <FiEye size={16} />
              Columns
              <FiChevronDown size={16} />
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-slate-950/60">
              <div className="space-y-3">
                {allColumns.map((column) => (
                  <label key={column.id} className="flex items-center justify-between gap-3 text-sm text-slate-200">
                    <span>{column.render("Header")}</span>
                    <input type="checkbox" {...column.getToggleHiddenProps()} className="accent-cyan-400" />
                  </label>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-slate-800 text-left">
          <thead className="bg-slate-950/60">
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps?.())}
                    key={column.id}
                    className="whitespace-nowrap px-4 py-4 text-xs uppercase tracking-[0.25em] text-slate-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      {column.render("Header")}
                      {column.isSorted ? (
                        <span>{column.isSortedDesc ? "▼" : "▲"}</span>
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="divide-y divide-slate-900/80">
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={row.id} className="align-top transition hover:bg-slate-900/20">
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()} key={cell.column.id} className="px-4 py-4">
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 border-t border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-400">
          Page {state.pageIndex + 1} of {pageOptions.length || 1}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-slate-300 disabled:opacity-40"
          >
            <FiChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-slate-300 disabled:opacity-40"
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-slate-300 disabled:opacity-40"
          >
            <FiChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => gotoPage(pageOptions.length - 1)}
            disabled={!canNextPage}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-2 text-slate-300 disabled:opacity-40"
          >
            <FiChevronsRight size={16} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export default DynamicTestCaseTable;
