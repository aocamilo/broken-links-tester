import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Filter,
  ArrowUpDown,
  Search,
  Sliders,
  Command,
  Check,
  Clock,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowData,
  Column,
  FilterFn,
} from "@tanstack/react-table";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { LinkStatus } from "../api/model/types";
import { useRouter } from "@tanstack/react-router";

// Define the data type for our table rows (enhanced LinkStatus)
interface EnhancedLinkStatus extends LinkStatus {
  formattedResponseTime: string;
  responseTimeMs: number;
}

// Define the Table component props
interface LinksTableProps {
  data: LinkStatus[];
  isLoading?: boolean;
}

// Status code options for dropdown
const STATUS_CODE_OPTIONS = [
  { value: "200", label: "200 (OK)" },
  { value: "201", label: "201 (Created)" },
  { value: "301", label: "301 (Moved Permanently)" },
  { value: "302", label: "302 (Found)" },
  { value: "304", label: "304 (Not Modified)" },
  { value: "400", label: "400 (Bad Request)" },
  { value: "401", label: "401 (Unauthorized)" },
  { value: "403", label: "403 (Forbidden)" },
  { value: "404", label: "404 (Not Found)" },
  { value: "500", label: "500 (Internal Server Error)" },
  { value: "502", label: "502 (Bad Gateway)" },
  { value: "503", label: "503 (Service Unavailable)" },
  { value: "504", label: "504 (Gateway Timeout)" },
];

// Function to format response time
const formatResponseTime = (
  responseTime: string | undefined
): { formatted: string; ms: number } => {
  if (!responseTime) return { formatted: "N/A", ms: 0 };

  // Convert the string to a number if it's in milliseconds
  if (responseTime.endsWith("ms")) {
    const ms = parseFloat(responseTime.replace("ms", ""));
    return { formatted: responseTime, ms: isNaN(ms) ? 0 : ms };
  }

  // Try to parse as a number
  const time = parseFloat(responseTime);
  if (isNaN(time)) return { formatted: responseTime, ms: 0 };

  // Format the time
  if (time < 1000) {
    return { formatted: `${time.toFixed(2)}ms`, ms: time };
  } else {
    return { formatted: `${(time / 1000).toFixed(2)}s`, ms: time };
  }
};

// Function to get color based on response time
const getResponseTimeColor = (ms: number): string => {
  if (ms === 0) return "bg-gray-200 dark:bg-gray-700"; // N/A
  if (ms < 300) return "bg-green-500"; // Fast
  if (ms < 1000) return "bg-yellow-500"; // Medium
  return "bg-red-500"; // Slow
};

// Column mapping for filter and sort options
const COLUMN_MAP = {
  url: "url",
  parent_url: "parent_url",
  status: "is_working",
  status_code: "status_code",
  response_time: "responseTimeMs",
};

// Filter options mapping
const FILTER_OPTIONS = {
  status: [
    { value: "working", label: "Working" },
    { value: "broken", label: "Broken" },
  ],
};

// Custom filter function for multi-select
const multiSelectFilter: FilterFn<EnhancedLinkStatus> = (
  row,
  columnId,
  filterValues
) => {
  if (!filterValues || (Array.isArray(filterValues) && !filterValues.length))
    return true;

  const value = row.getValue(columnId);
  // For is_working, handle the conversion between boolean and string
  if (columnId === "is_working") {
    const status = value === true ? "working" : "broken";
    return filterValues.includes(status);
  }

  // For other columns, direct comparison
  return filterValues.includes(String(value));
};

export function LinksTable({ data, isLoading = false }: LinksTableProps) {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const [tableHeight, setTableHeight] = React.useState<number | null>(null);
  const [tableMinHeight, setTableMinHeight] = React.useState<
    string | undefined
  >(undefined);

  // Initialize state from URL parameters
  const initialFilter = searchParams.get("filter");
  const initialFilterValue = searchParams.get("filterValue");
  const initialSortColumn = searchParams.get("sortColumn");
  const initialSortDirection = searchParams.get("sortDir");

  const [sorting, setSorting] = React.useState<SortingState>(
    initialSortColumn && initialSortDirection
      ? [
          {
            id:
              COLUMN_MAP[initialSortColumn as keyof typeof COLUMN_MAP] ||
              "is_working",
            desc: initialSortDirection === "desc",
          },
        ]
      : [{ id: "is_working", desc: false }]
  );

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([
    "url",
    "parent_url",
    "status",
    "status_code",
    "response_time",
  ]);

  // Find the display name of the column from COLUMN_MAP
  const findColumnDisplayName = (columnId: string): string => {
    const entry = Object.entries(COLUMN_MAP).find(
      ([_, value]) => value === columnId
    );
    return entry ? entry[0] : columnId;
  };

  const [activeFilter, setActiveFilter] = React.useState<string | null>(
    initialFilter || null
  );

  // For multi-select filters, use arrays instead of strings
  const [selectedStatusFilters, setSelectedStatusFilters] = React.useState<
    string[]
  >([]);
  const [selectedStatusCodeFilters, setSelectedStatusCodeFilters] =
    React.useState<string[]>([]);

  // Store active sort column for the top Sort button
  const [activeSortColumn, setActiveSortColumn] = React.useState<string | null>(
    initialSortColumn || "status"
  );

  // Prepare enhanced data with formatted response time
  const enhancedData = React.useMemo(() => {
    return data.map((link) => {
      const { formatted, ms } = formatResponseTime(link.response_time);
      return {
        ...link,
        formattedResponseTime: formatted,
        responseTimeMs: ms,
      };
    });
  }, [data]);

  // Extract available status codes from data
  const availableStatusCodes = React.useMemo(() => {
    const statusCodes = new Set<string>();
    data.forEach((link) => {
      if (link.status_code) {
        statusCodes.add(String(link.status_code));
      }
    });
    return Array.from(statusCodes)
      .sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return numA - numB;
      })
      .map((code) => {
        let label = `${code}`;

        // Add common status code descriptions
        if (code === "200") label += " (OK)";
        else if (code === "201") label += " (Created)";
        else if (code === "301") label += " (Moved Permanently)";
        else if (code === "302") label += " (Found)";
        else if (code === "304") label += " (Not Modified)";
        else if (code === "400") label += " (Bad Request)";
        else if (code === "401") label += " (Unauthorized)";
        else if (code === "403") label += " (Forbidden)";
        else if (code === "404") label += " (Not Found)";
        else if (code === "500") label += " (Internal Server Error)";

        return { value: code, label };
      });
  }, [data]);

  // Define columns
  const columns = React.useMemo<ColumnDef<EnhancedLinkStatus>[]>(
    () => [
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <div className="max-w-[400px] truncate" title={row.getValue("url")}>
            <a
              href={row.getValue("url")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              {row.getValue("url")}
            </a>
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 400,
      },
      {
        accessorKey: "parent_url",
        header: "Parent URL",
        cell: ({ row }) => (
          <div
            className="max-w-[350px] truncate"
            title={row.getValue("parent_url") || "N/A"}
          >
            {row.getValue("parent_url") ? (
              <a
                href={row.getValue("parent_url")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                {row.getValue("parent_url")}
              </a>
            ) : (
              "N/A"
            )}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        size: 350,
      },
      {
        accessorKey: "is_working",
        id: "is_working",
        header: "Status",
        cell: ({ row }) => {
          const isWorking = row.original.is_working;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isWorking
                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
              }`}
            >
              {isWorking ? "Working" : "Broken"}
            </span>
          );
        },
        enableSorting: true,
        filterFn: multiSelectFilter,
        size: 120,
      },
      {
        accessorKey: "status_code",
        header: "Status Code",
        cell: ({ row }) => <div>{row.getValue("status_code") || "N/A"}</div>,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: multiSelectFilter,
        size: 150, // Increased width to prevent wrapping
      },
      {
        accessorKey: "responseTimeMs",
        id: "responseTimeMs",
        header: "Response Time",
        cell: ({ row }) => {
          const ms = row.original.responseTimeMs;
          const formatted = row.original.formattedResponseTime;

          return (
            <div className="flex items-center gap-2 min-w-[180px]">
              <div className="w-24 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getResponseTimeColor(ms)}`}
                  style={{
                    width:
                      ms === 0
                        ? "10%"
                        : `${Math.min(100, Math.max(10, ms / 20))}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium">{formatted}</span>
            </div>
          );
        },
        enableSorting: true,
        enableColumnFilter: false, // Disabled filtering by response time
        size: 200, // Increased width to prevent wrapping
      },
    ],
    []
  );

  // Create the table instance
  const table = useReactTable({
    data: enhancedData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
    },
    filterFns: {
      multiSelect: multiSelectFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Update URL when filters or sorting change
  React.useEffect(() => {
    const newParams = new URLSearchParams();

    // Add filter params
    if (columnFilters.length > 0) {
      // Handle multiple filters
      columnFilters.forEach((filter) => {
        const columnId = filter.id;
        const displayName = findColumnDisplayName(columnId);

        // For multi-select filters, serialize the array
        if (Array.isArray(filter.value)) {
          const filterValue = filter.value.join(",");
          if (filterValue) {
            newParams.set(`filter_${displayName}`, filterValue);
          }
        } else {
          newParams.set(`filter_${displayName}`, String(filter.value));
        }
      });
    }

    // Add sort params
    if (sorting.length > 0) {
      const columnId = sorting[0].id;
      const displayName = findColumnDisplayName(columnId);
      newParams.set("sortColumn", displayName);
      newParams.set("sortDir", sorting[0].desc ? "desc" : "asc");
    }

    const searchString = newParams.toString();
    const newUrl = searchString ? `?${searchString}` : window.location.pathname;

    // Update URL without page reload
    window.history.pushState({}, "", newUrl);
  }, [columnFilters, sorting]);

  // Apply status filter
  const applyStatusFilter = React.useCallback((values: string[]) => {
    setSelectedStatusFilters(values);
    if (values.length === 0) {
      // Remove the filter if no values selected
      setColumnFilters((prev) =>
        prev.filter((filter) => filter.id !== "is_working")
      );
    } else {
      // Add or update the filter
      setColumnFilters((prev) => {
        const existing = prev.findIndex((filter) => filter.id === "is_working");
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { id: "is_working", value: values };
          return updated;
        }
        return [...prev, { id: "is_working", value: values }];
      });
    }
  }, []);

  // Apply status code filter
  const applyStatusCodeFilter = React.useCallback((values: string[]) => {
    setSelectedStatusCodeFilters(values);
    if (values.length === 0) {
      // Remove the filter if no values selected
      setColumnFilters((prev) =>
        prev.filter((filter) => filter.id !== "status_code")
      );
    } else {
      // Add or update the filter
      setColumnFilters((prev) => {
        const existing = prev.findIndex(
          (filter) => filter.id === "status_code"
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { id: "status_code", value: values };
          return updated;
        }
        return [...prev, { id: "status_code", value: values }];
      });
    }
  }, []);

  // Handle filter change
  const handleFilterChange = React.useCallback((columnId: string | null) => {
    setActiveFilter(columnId);
    // Clear the relevant filters when switching between filter types
    if (columnId !== "status") {
      setSelectedStatusFilters([]);
    }
    if (columnId !== "status_code") {
      setSelectedStatusCodeFilters([]);
    }
  }, []);

  // Toggle sort for the active column
  const toggleSort = React.useCallback(() => {
    if (!activeSortColumn) return;

    const columnId = COLUMN_MAP[activeSortColumn as keyof typeof COLUMN_MAP];
    if (!columnId) return;

    const currentSort = sorting.find((s) => s.id === columnId);
    if (currentSort) {
      // If already sorting by this column, toggle direction or remove
      if (currentSort.desc) {
        setSorting([]);
      } else {
        setSorting([{ id: columnId, desc: true }]);
      }
    } else {
      // If not sorting by this column yet, add ascending sort
      setSorting([{ id: columnId, desc: false }]);
    }
  }, [activeSortColumn, sorting]);

  // Handle drag end for column reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(columnOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setColumnOrder(items);
  };

  // Get the display name for the active sort column
  const getSortDisplayInfo = (): {
    column: string;
    direction: string;
  } | null => {
    if (sorting.length === 0) return null;

    const sortColumn = sorting[0].id;
    const displayName = findColumnDisplayName(sortColumn);

    return {
      column: displayName,
      direction: sorting[0].desc ? "desc" : "asc",
    };
  };

  const sortInfo = getSortDisplayInfo();

  // Measure table height to prevent layout shifts
  const tableRef = React.useRef<HTMLDivElement>(null);

  // This effect runs once on initial render to set a min-height
  React.useEffect(() => {
    if (tableRef.current && !tableMinHeight) {
      // Set a reasonable minimum height for the table container
      setTableMinHeight("400px");
    }
  }, [tableMinHeight]);

  // This effect runs whenever the table content changes
  React.useEffect(() => {
    if (tableRef.current && data.length > 0) {
      const height = tableRef.current.offsetHeight;
      if (height > 0) {
        setTableHeight(height);
      }
    }
  }, [data, sorting, columnFilters]);

  // Fixed table height to prevent layout shifts
  const [tableContainerHeight, setTableContainerHeight] =
    React.useState<number>(500);

  // Measure table height once on initial load with data
  React.useEffect(() => {
    // Only set height once when we have data and a reasonable height
    if (
      tableRef.current &&
      data.length > 0 &&
      tableRef.current.offsetHeight > 300
    ) {
      setTableContainerHeight(Math.max(500, tableRef.current.offsetHeight));
    }
  }, [data.length]);

  // Count active filters
  const getActiveFilterCount = (): number => {
    return columnFilters.length;
  };

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Top row - Main filter controls and sort */}
        <div className="flex flex-wrap gap-3 items-center mb-3">
          {/* Main filter button */}
          <div className="flex items-center gap-2">
            <button
              disabled={isLoading}
              className={`h-9 px-3 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors ${
                activeFilter
                  ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                  : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              } disabled:opacity-50`}
              onClick={() => {
                if (activeFilter) {
                  handleFilterChange(null);
                } else {
                  handleFilterChange("url");
                }
              }}
            >
              <Filter size={14} />
              <span>{activeFilter ? "Change filter" : "Add filter"}</span>
            </button>

            {activeFilter && (
              <select
                value={activeFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="h-9 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 text-sm"
                disabled={isLoading}
              >
                <option value="url">URL</option>
                <option value="parent_url">Parent URL</option>
                <option value="status">Status</option>
                <option value="status_code">Status Code</option>
              </select>
            )}
          </div>

          {/* Filter inputs based on selected filter type */}
          {activeFilter === "url" || activeFilter === "parent_url" ? (
            <div className="relative">
              <input
                type="text"
                placeholder={`Filter by ${activeFilter}...`}
                onChange={(e) => {
                  const value = e.target.value;
                  const columnId =
                    COLUMN_MAP[activeFilter as keyof typeof COLUMN_MAP];
                  if (!columnId) return;

                  if (value) {
                    setColumnFilters((prev) => {
                      const existing = prev.findIndex(
                        (filter) => filter.id === columnId
                      );
                      if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = { id: columnId, value };
                        return updated;
                      }
                      return [...prev, { id: columnId, value }];
                    });
                  } else {
                    setColumnFilters((prev) =>
                      prev.filter((filter) => filter.id !== columnId)
                    );
                  }
                }}
                className="w-64 px-3 h-9 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg text-sm"
                disabled={isLoading}
              />
              <Search
                size={14}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          ) : activeFilter === "status" ? (
            <div className="flex items-center gap-2">
              {FILTER_OPTIONS.status.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border ${
                    selectedStatusFilters.includes(option.value)
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                      : "border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStatusFilters.includes(option.value)}
                    onChange={() => {
                      const newValues = selectedStatusFilters.includes(
                        option.value
                      )
                        ? selectedStatusFilters.filter(
                            (v) => v !== option.value
                          )
                        : [...selectedStatusFilters, option.value];
                      applyStatusFilter(newValues);
                    }}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedStatusFilters.includes(option.value)
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {selectedStatusFilters.includes(option.value) && (
                      <Check size={12} className="text-white" />
                    )}
                  </span>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          ) : activeFilter === "status_code" &&
            availableStatusCodes.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select
                  className="h-9 w-60 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 text-sm appearance-none pr-8"
                  disabled={isLoading}
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const code = e.target.value;
                    if (!selectedStatusCodeFilters.includes(code)) {
                      const newValues = [...selectedStatusCodeFilters, code];
                      applyStatusCodeFilter(newValues);
                    }
                  }}
                >
                  <option value="">Select status code...</option>
                  {availableStatusCodes.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={selectedStatusCodeFilters.includes(
                        option.value
                      )}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          ) : null}

          {/* Sort controls */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={activeSortColumn || "status"}
              onChange={(e) => setActiveSortColumn(e.target.value)}
              className="h-9 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 text-sm min-w-[120px]"
              disabled={isLoading}
            >
              <option value="">Sort by...</option>
              <option value="url">URL</option>
              <option value="parent_url">Parent URL</option>
              <option value="status">Status</option>
              <option value="status_code">Status Code</option>
              <option value="response_time">Response Time</option>
            </select>

            <button
              disabled={isLoading}
              className={`h-9 px-3 rounded-lg flex items-center gap-1 text-sm font-medium border ${
                sorting.length > 0
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              } disabled:opacity-50`}
              onClick={toggleSort}
            >
              <ArrowUpDown size={14} />
              <span>
                {sorting.length > 0 && sortInfo
                  ? sortInfo.direction === "asc"
                    ? "Ascending"
                    : "Descending"
                  : "Sort"}
              </span>
            </button>
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              disabled={isLoading}
              className="h-8 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-2 disabled:opacity-50"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters display */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Active filters:
            </span>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-2">
              {selectedStatusFilters.map((status) => (
                <div
                  key={status}
                  className="flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                >
                  <span className="mr-1 font-medium">Status:</span>{" "}
                  {status === "working" ? "Working" : "Broken"}
                  <button
                    onClick={() => {
                      const newValues = selectedStatusFilters.filter(
                        (v) => v !== status
                      );
                      applyStatusFilter(newValues);
                    }}
                    className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {selectedStatusCodeFilters.map((code) => (
                <div
                  key={code}
                  className="flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                >
                  <span className="mr-1 font-medium">Status Code:</span> {code}
                  <button
                    onClick={() => {
                      const newValues = selectedStatusCodeFilters.filter(
                        (v) => v !== code
                      );
                      applyStatusCodeFilter(newValues);
                    }}
                    className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {columnFilters
                .filter((f) => f.id === "url" || f.id === "parent_url")
                .map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  >
                    <span className="mr-1 font-medium">
                      {findColumnDisplayName(filter.id)}:
                    </span>
                    {String(filter.value).length > 20
                      ? String(filter.value).slice(0, 20) + "..."
                      : filter.value}
                    <button
                      onClick={() => {
                        setColumnFilters((prev) =>
                          prev.filter((f) => f.id !== filter.id)
                        );
                      }}
                      className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
            </div>

            {/* Clear all filters button */}
            <button
              disabled={isLoading}
              onClick={() => {
                setColumnFilters([]);
                setSelectedStatusFilters([]);
                setSelectedStatusCodeFilters([]);
                setActiveFilter(null);
              }}
              className="ml-auto text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Table with fixed height container */}
      <div
        className="rounded-md shadow-sm bg-white dark:bg-gray-900 p-[1px] gradient-border"
        style={{ height: "500px", display: "flex", flexDirection: "column" }}
      >
        <div
          ref={tableRef}
          className="flex-grow overflow-auto bg-white dark:bg-gray-900 rounded-md"
          style={{ minHeight: 0 }} // This is important for the flex child to respect parent's height
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">
                  Checking links...
                </p>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <table className="w-full table-auto">
                <Droppable droppableId="columns" direction="horizontal">
                  {(provided) => (
                    <thead
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="sticky top-0 z-10"
                    >
                      <tr className="border-b bg-gray-50/80 dark:bg-gray-800 dark:border-gray-700">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <React.Fragment key={headerGroup.id}>
                            {headerGroup.headers.map((header, index) => {
                              return (
                                <Draggable
                                  key={header.id}
                                  draggableId={header.id}
                                  index={index}
                                  isDragDisabled={isLoading}
                                >
                                  {(provided) => (
                                    <th
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="relative h-12 px-4 text-left font-medium text-gray-500 dark:text-gray-300"
                                      style={{
                                        width: header.getSize(),
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          {...provided.dragHandleProps}
                                          className={`cursor-grab ${isLoading ? "opacity-30" : "opacity-50"}`}
                                        >
                                          <GripVertical size={14} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span>
                                            {
                                              header.column.columnDef
                                                .header as string
                                            }
                                          </span>
                                          {header.column.getCanSort() && (
                                            <button
                                              onClick={() =>
                                                header.column.toggleSorting(
                                                  header.column.getIsSorted() ===
                                                    "asc"
                                                )
                                              }
                                              disabled={isLoading}
                                              className={`ml-1 ${isLoading ? "opacity-30" : ""}`}
                                            >
                                              <ArrowUpDown size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div
                                        onMouseDown={
                                          isLoading
                                            ? undefined
                                            : header.getResizeHandler()
                                        }
                                        onTouchStart={
                                          isLoading
                                            ? undefined
                                            : header.getResizeHandler()
                                        }
                                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize ${
                                          header.column.getIsResizing()
                                            ? "bg-blue-500"
                                            : ""
                                        }`}
                                      />
                                    </th>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                  )}
                </Droppable>
                <tbody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="p-4 align-middle"
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="h-24 text-center align-middle text-gray-500 dark:text-gray-400"
                      >
                        No results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DragDropContext>
          )}
        </div>
        <div className="flex items-center justify-between border-t p-3 bg-white dark:bg-gray-900 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {table.getPrePaginationRowModel().rows.length > 0 && (
              <>
                Showing {table.getRowModel().rows.length} of{" "}
                {table.getPrePaginationRowModel().rows.length} results
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
              className="h-8 rounded-md border border-gray-300 dark:border-gray-600 px-2 disabled:opacity-50 dark:text-gray-300"
            >
              Previous
            </button>
            <span className="text-sm dark:text-gray-300">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
              className="h-8 rounded-md border border-gray-300 dark:border-gray-600 px-2 disabled:opacity-50 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
