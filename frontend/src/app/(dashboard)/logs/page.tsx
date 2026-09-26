"use client";

import { useState, useMemo } from "react";
import { useCachedApi } from "@/lib/useCachedApi";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { fetchLogs, type LogRecord, type Pagination, exportCsvUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    recovered: "default",
    in_progress: "secondary",
    scheduled: "secondary",
    planned: "outline",
    failed: "destructive",
  };
  return (
    <Badge variant={variants[status] || "outline"} className="capitalize">
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const limit = 15;

  const cacheKey = `logs_${page}_${search}_${statusFilter}_${scenarioFilter}_${sortBy}_${order}`;
  const { data: res, loading } = useCachedApi(
    cacheKey,
    () => fetchLogs({
      page,
      limit,
      search: search || undefined,
      status: statusFilter || undefined,
      scenario: scenarioFilter || undefined,
      sortBy,
      order,
    }),
    [page, search, statusFilter, scenarioFilter, sortBy, order]
  );
  
  const logs = res?.data || [];
  const pagination = res?.pagination || null;

  const columns: ColumnDef<LogRecord>[] = useMemo(
    () => [
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.customerName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.companyName}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.phone}
          </span>
        ),
      },
      {
        accessorKey: "mrr",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="h-8 px-2"
          >
            MRR
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">
            ${row.original.mrr.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "scenario",
        header: "Scenario",
        cell: ({ row }) => (
          <span className="text-sm capitalize">
            {row.original.scenario.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "variantId",
        header: "Variant",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.variantId || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "outcome",
        header: "Outcome",
        cell: ({ row }) => (
          <span className="text-sm capitalize">
            {row.original.outcome?.replace("_", " ") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="h-8 px-2"
          >
            Time
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.timestamp), "MMM d, HH:mm")}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recovery Logs</h1>
          <p className="text-muted-foreground text-sm">
            Detailed audit trail of every recovery attempt
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={exportCsvUrl({ status: statusFilter, scenario: scenarioFilter })}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, company, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={scenarioFilter}
              onValueChange={(v) => {
                setScenarioFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Scenarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scenarios</SelectItem>
                <SelectItem value="payment_failed">Payment Failed</SelectItem>
                <SelectItem value="subscription_deleted">
                  Subscription Deleted
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, ci) => (
                      <TableCell key={ci}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * limit + 1}–
            {Math.min(pagination.page * limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
