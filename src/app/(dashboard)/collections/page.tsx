"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { t } from "@/lib/locales";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CollectionEntry {
  id: string;
  date: string;
  salesperson: { id: string; name: string };
  totalQuantity: number;
  totalAmount: number;
  _count: { items: number };
}

interface Salesperson {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CollectionsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterSalespersonId, setFilterSalespersonId] = useState("");

  // Export panel state
  const [exportScope, setExportScope] = useState<"all" | "salesperson" | "vendor">("all");
  const [exportSalespersonId, setExportSalespersonId] = useState("");
  const [exportVendorId, setExportVendorId] = useState("");
  const [exportStartDate, setExportStartDate] = useState(todayStr());

  const { data: salespersons = [] } = useQuery<Salesperson[]>({
    queryKey: ["salespersons"],
    queryFn: async () => {
      const res = await fetch("/api/salespersons");
      if (!res.ok) throw new Error("Failed to fetch salespersons");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await fetch("/api/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const params = new URLSearchParams();
  if (filterDate) params.set("date", filterDate);
  if (filterSalespersonId) params.set("salespersonId", filterSalespersonId);

  const { data: collections = [], isLoading, isError } = useQuery<CollectionEntry[]>({
    queryKey: ["collections", filterDate, filterSalespersonId],
    queryFn: async () => {
      const res = await fetch(`/api/collections?${params}`);
      if (!res.ok) throw new Error("Failed to fetch collections");
      const json = await res.json();
      return json.data?.items ?? [];
    },
  });

  function handleExport() {
    if (!exportStartDate) {
      toast.error("Please select a start date");
      return;
    }
    if (exportScope === "salesperson" && !exportSalespersonId) {
      toast.error("Please select a salesperson for export");
      return;
    }
    if (exportScope === "vendor" && !exportVendorId) {
      toast.error("Please select a vendor for export");
      return;
    }
    const params = new URLSearchParams({ startDate: exportStartDate, scope: exportScope });
    if (exportScope === "salesperson" && exportSalespersonId) params.set("salespersonId", exportSalespersonId);
    if (exportScope === "vendor" && exportVendorId) params.set("vendorId", exportVendorId);
    window.open(`/api/collections/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t("collections.title")}>
        {hasPermission("collections.create") && (
          <Link
            href="/collections/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-1.5 size-4" />
            {t("collections.newEntry")}
          </Link>
        )}
      </PageHeader>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="filter-date">{t("collections.filterByDate")}</Label>
          <Input
            id="filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="space-y-1">
          <Label>{t("collections.salesperson")}</Label>
          <Select
            value={filterSalespersonId || "__all__"}
            onValueChange={(val) =>
              val && setFilterSalespersonId(val === "__all__" ? "" : val)
            }
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("collections.filterBySalesperson")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("collections.filterBySalesperson")}</SelectItem>
              {salespersons.map((sp) => (
                <SelectItem key={sp.id} value={sp.id}>
                  {sp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collections table */}
      {isLoading && (
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("collections.loading")}
        </div>
      )}

      {isError && (
        <div className="flex justify-center py-12 text-destructive">
          Failed to load collections.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {collections.length === 0 ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              {t("collections.noItems")}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("collections.date")}</TableHead>
                    <TableHead>{t("collections.salesperson")}</TableHead>
                    <TableHead className="text-right">{t("collections.items")}</TableHead>
                    <TableHead className="text-right">{t("collections.totalQty")}</TableHead>
                    <TableHead className="text-right">{t("collections.totalAmount")}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/collections/${entry.id}`)}
                    >
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.salesperson.name}</TableCell>
                      <TableCell className="text-right">{entry._count.items}</TableCell>
                      <TableCell className="text-right">{entry.totalQuantity}</TableCell>
                      <TableCell className="text-right">
                        ₹{entry.totalAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Export panel */}
      <Card>
        <CardHeader>
          <CardTitle>{t("collections.exportTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>{t("collections.exportScope")}</Label>
              <Select
                value={exportScope}
                onValueChange={(val) =>
                  val && setExportScope(val as "all" | "salesperson" | "vendor")
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("collections.scopeAll")}</SelectItem>
                  <SelectItem value="salesperson">{t("collections.scopeBySalesperson")}</SelectItem>
                  <SelectItem value="vendor">{t("collections.scopeByVendor")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportScope === "salesperson" && (
              <div className="space-y-1">
                <Label>{t("collections.salesperson")}</Label>
                <Select
                  value={exportSalespersonId || "__none__"}
                  onValueChange={(val) =>
                    val && setExportSalespersonId(val === "__none__" ? "" : val)
                  }
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder={t("collections.selectSalesperson")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("collections.selectSalesperson")}</SelectItem>
                    {salespersons.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {exportScope === "vendor" && (
              <div className="space-y-1">
                <Label>{t("collections.vendor")}</Label>
                <Select
                  value={exportVendorId || "__none__"}
                  onValueChange={(val) =>
                    val && setExportVendorId(val === "__none__" ? "" : val)
                  }
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder={t("collections.selectVendor")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("collections.selectVendor")}</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="export-start-date">{t("collections.startDate")}</Label>
              <Input
                id="export-start-date"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="w-44"
              />
            </div>

            <Button onClick={handleExport} variant="outline">
              <Download className="mr-1.5 size-4" />
              {t("collections.downloadCsv")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
