"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObligationStatusBadge } from "@/components/dashboard/obligation-status-badge";
import { MarkPaidDialog } from "@/components/dashboard/mark-paid-dialog";
import {
  computeDisplayStatus,
  STATUS_ORDER,
  type ObligationStatus,
  type SerializedObligation,
} from "@/lib/utils/obligation-helpers";
import { formatDateColombia } from "@/lib/utils/dates";
import { getInlinePenaltyInfo } from "@/lib/utils/sanctions";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface ObligationsTableProps {
  obligations: SerializedObligation[];
  activeFilter?: { estado?: string } | null;
}

// ─────────────────────────────────────────────────────
// Sort types
// ─────────────────────────────────────────────────────

type SortField = "fechaVencimiento" | "estado";
type SortDir = "asc" | "desc";

// ─────────────────────────────────────────────────────
// Helper: format tax name for display
// ─────────────────────────────────────────────────────

function formatTaxName(impuesto: string): string {
  return impuesto
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ─────────────────────────────────────────────────────
// Status filter options
// ─────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PROXIMO", label: "Proximo" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "PAGADO", label: "Pagado" },
];

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function ObligationsTable({
  obligations,
  activeFilter,
}: ObligationsTableProps) {
  // ── Filter state ──────────────────────────────────
  const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
  const [impuestoFilter, setImpuestoFilter] = useState<string | null>(null);
  const [periodoFilter, setPeriodoFilter] = useState<string | null>(null);

  // ── Sort state ────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>("fechaVencimiento");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ── Dialog state ──────────────────────────────────
  const [selectedObligation, setSelectedObligation] = useState<{
    id: string;
    impuesto: string;
    periodo: string;
  } | null>(null);

  // ── Sync activeFilter from summary cards ──────────
  useEffect(() => {
    if (activeFilter === undefined) return;
    if (activeFilter === null) {
      setEstadoFilter(null);
    } else if (activeFilter.estado) {
      setEstadoFilter(activeFilter.estado);
    }
  }, [activeFilter]);

  // ── Unique filter options ─────────────────────────
  const impuestoOptions = useMemo(() => {
    const unique = [...new Set(obligations.map((o) => o.impuesto))].sort();
    return [{ value: "ALL", label: "Todos" }, ...unique.map((v) => ({ value: v, label: formatTaxName(v) }))];
  }, [obligations]);

  const periodoOptions = useMemo(() => {
    const unique = [...new Set(obligations.map((o) => o.periodo))].sort();
    return [{ value: "ALL", label: "Todos" }, ...unique.map((v) => ({ value: v, label: v }))];
  }, [obligations]);

  // ── Filtering ─────────────────────────────────────
  const filtered = useMemo(() => {
    return obligations.filter((o) => {
      const displayStatus = computeDisplayStatus(o.estado, o.fechaVencimiento);
      if (estadoFilter && estadoFilter !== "ALL" && displayStatus !== estadoFilter) return false;
      if (impuestoFilter && impuestoFilter !== "ALL" && o.impuesto !== impuestoFilter) return false;
      if (periodoFilter && periodoFilter !== "ALL" && o.periodo !== periodoFilter) return false;
      return true;
    });
  }, [obligations, estadoFilter, impuestoFilter, periodoFilter]);

  // ── Sorting ───────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortField === "fechaVencimiento") {
        return (
          mult *
          (new Date(a.fechaVencimiento).getTime() -
            new Date(b.fechaVencimiento).getTime())
        );
      }
      // Sort by status order
      const statusA = computeDisplayStatus(a.estado, a.fechaVencimiento);
      const statusB = computeDisplayStatus(b.estado, b.fechaVencimiento);
      return mult * ((STATUS_ORDER[statusA] ?? 99) - (STATUS_ORDER[statusB] ?? 99));
    });
  }, [filtered, sortField, sortDir]);

  // ── Sort toggle handler ───────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Sort indicator ────────────────────────────────
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Obligaciones</h2>

      {/* Inline filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={estadoFilter ?? "ALL"}
          onValueChange={(v) => setEstadoFilter(v === "ALL" ? null : v)}
        >
          <SelectTrigger size="sm" className="min-w-[130px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={impuestoFilter ?? "ALL"}
          onValueChange={(v) => setImpuestoFilter(v === "ALL" ? null : v)}
        >
          <SelectTrigger size="sm" className="min-w-[150px]">
            <SelectValue placeholder="Impuesto" />
          </SelectTrigger>
          <SelectContent>
            {impuestoOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={periodoFilter ?? "ALL"}
          onValueChange={(v) => setPeriodoFilter(v === "ALL" ? null : v)}
        >
          <SelectTrigger size="sm" className="min-w-[120px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {periodoOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Impuesto</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center font-medium hover:text-gray-900"
                  onClick={() => toggleSort("fechaVencimiento")}
                >
                  Fecha
                  <SortIcon field="fechaVencimiento" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center font-medium hover:text-gray-900"
                  onClick={() => toggleSort("estado")}
                >
                  Estado
                  <SortIcon field="estado" />
                </button>
              </TableHead>
              <TableHead>Sancion</TableHead>
              <TableHead>Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-gray-400"
                >
                  No se encontraron obligaciones con estos filtros
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((obligation) => {
                const displayStatus = computeDisplayStatus(
                  obligation.estado,
                  obligation.fechaVencimiento
                ) as ObligationStatus;
                const isPaid = displayStatus === "PAGADO";

                return (
                  <TableRow key={obligation.id}>
                    <TableCell className="font-medium">
                      {formatTaxName(obligation.impuesto)}
                    </TableCell>
                    <TableCell>{obligation.periodo}</TableCell>
                    <TableCell>
                      {formatDateColombia(
                        new Date(obligation.fechaVencimiento),
                        "dd MMM yyyy"
                      )}
                    </TableCell>
                    <TableCell>
                      <ObligationStatusBadge status={displayStatus} />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const penaltyInfo = getInlinePenaltyInfo(
                          displayStatus,
                          obligation.fechaVencimiento
                        );
                        if (!penaltyInfo) return null;
                        const colorClass =
                          displayStatus === "PROXIMO"
                            ? "text-amber-600"
                            : "text-red-600";
                        return penaltyInfo.showLink ? (
                          <Link
                            href={`/sanciones?obligacion=${obligation.id}`}
                            className={`text-xs ${colorClass} hover:underline`}
                          >
                            {penaltyInfo.text}
                          </Link>
                        ) : (
                          <span className={`text-xs ${colorClass}`}>
                            {penaltyInfo.text}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <Check className="h-3.5 w-3.5" />
                          Pagado
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            setSelectedObligation({
                              id: obligation.id,
                              impuesto: obligation.impuesto,
                              periodo: obligation.periodo,
                            })
                          }
                        >
                          Marcar pagado
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mark paid dialog */}
      <MarkPaidDialog
        open={selectedObligation !== null}
        onClose={() => setSelectedObligation(null)}
        obligacionId={selectedObligation?.id ?? ""}
        impuesto={selectedObligation?.impuesto ?? ""}
        periodo={selectedObligation?.periodo ?? ""}
      />
    </div>
  );
}
