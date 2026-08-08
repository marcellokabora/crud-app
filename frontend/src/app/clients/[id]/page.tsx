"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, CalendarRange, CircleDollarSign, Plus, Trash2 } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api, ApiError, LedgerEntryInput, LedgerReport } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const currency = process.env.NEXT_PUBLIC_CURRENCY ?? "USD";
const money = new Intl.NumberFormat(undefined, { style: "currency", currency });

function formatMoney(amountMinor: number) {
  return money.format(amountMinor / 100);
}

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function ClientLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Number(id);
  const [report, setReport] = useState<LedgerReport | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedRange, setAppliedRange] = useState({ from: "", to: "" });
  const [entryType, setEntryType] = useState<"earning" | "expense">("earning");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingEntryId, setRemovingEntryId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setMessage("");

    api.ledger(clientId, appliedRange.from, appliedRange.to)
      .then((data) => active && setReport(data))
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof ApiError && caught.code === "client_not_found") {
          router.replace("/clients");
          return;
        }
        setMessage(caught instanceof ApiError ? caught.message : "Unable to reach the PHP API.");
      })
      .finally(() => active && setIsLoading(false));

    return () => { active = false; };
  }, [clientId, appliedRange, router]);

  const applyRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedRange({ from, to });
  };

  const clearRange = () => {
    setFrom("");
    setTo("");
    setAppliedRange({ from: "", to: "" });
  };

  const handleEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setErrors({});
    setMessage("");
    setIsSubmitting(true);
    const form = new FormData(formElement);
    const input: LedgerEntryInput = {
      client_id: clientId,
      type: entryType,
      amount: String(form.get("amount") ?? ""),
      occurred_on: String(form.get("occurred_on") ?? ""),
      description: String(form.get("description") ?? ""),
    };

    try {
      await api.createLedgerEntry(input);
      setReport(await api.ledger(clientId, appliedRange.from, appliedRange.to));
      formElement.reset();
      setEntryType("earning");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fields);
        setMessage(caught.message);
      } else {
        setMessage("Unable to reach the PHP API.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeEntry = async (entryId: number) => {
    if (!window.confirm("Remove this movement? It will be excluded from the balance but retained in the audit history.")) return;

    setRemovingEntryId(entryId);
    setMessage("");
    try {
      await api.removeLedgerEntry(entryId, clientId);
      setReport(await api.ledger(clientId, appliedRange.from, appliedRange.to));
    } catch (caught) {
      setMessage(caught instanceof ApiError ? caught.message : "Unable to reach the PHP API.");
    } finally {
      setRemovingEntryId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-7">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/clients"><ArrowLeft className="size-4" />Back to clients</Link>
        </Button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 font-mono text-xs uppercase text-primary">Client ledger</p>
            <h1 className="text-3xl font-semibold">{report?.client.name ?? (isLoading ? "Loading client..." : "Client")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {report?.client.external_reference || "Earnings, expenses, and balance history"}
            </p>
          </div>
          <form onSubmit={applyRange} className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">From</Label>
              <Input id="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-36" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">To</Label>
              <Input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-36" />
            </div>
            <Button variant="outline"><CalendarRange className="size-4" />Apply</Button>
            {(appliedRange.from || appliedRange.to) && <Button type="button" variant="ghost" onClick={clearRange}>All time</Button>}
          </form>
        </div>

        {message && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}

        <section className="grid border-y bg-card sm:grid-cols-3" aria-label="Ledger summary">
          <div className="p-5 sm:border-r">
            <p className="text-xs font-medium uppercase text-muted-foreground">Earnings</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
              {report ? formatMoney(report.summary.earnings_minor) : "-"}
            </p>
          </div>
          <div className="border-t p-5 sm:border-r sm:border-t-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">Expenses</p>
            <p className="mt-2 text-2xl font-semibold text-rose-700 dark:text-rose-400">
              {report ? formatMoney(report.summary.expenses_minor) : "-"}
            </p>
          </div>
          <div className="border-t p-5 sm:border-t-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">Balance</p>
            <p className="mt-2 text-2xl font-semibold">{report ? formatMoney(report.summary.balance_minor) : "-"}</p>
          </div>
        </section>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="border-y bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="font-semibold">Movements</h2>
                <p className="text-xs text-muted-foreground">{appliedRange.from || appliedRange.to ? "Selected date range" : "All time"}</p>
              </div>
              <span className="text-sm text-muted-foreground">{report?.entries.length ?? 0} entries</span>
            </div>
            {!isLoading && report?.entries.length === 0 ? (
              <div className="p-12 text-center">
                <CircleDollarSign className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="font-medium">No movements in this period</p>
                <p className="mt-1 text-sm text-muted-foreground">Add an entry or choose another date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody className={isLoading ? "opacity-50" : ""}>
                    {report?.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{entry.occurred_on}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          <span className={entry.type === "earning" ? "status-badge status-active" : "status-badge bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}>
                            {entry.type === "earning" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {entry.type === "earning" ? "Earning" : "Expense"}
                          </span>
                        </TableCell>
                        <TableCell className={`whitespace-nowrap text-right font-mono ${entry.type === "earning" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                          {entry.type === "earning" ? "+" : "-"}{formatMoney(entry.amount_minor)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeEntry(entry.id)}
                            disabled={removingEntryId === entry.id}
                            aria-label={`Remove ${entry.description}`}
                            title="Remove movement"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <form onSubmit={handleEntry} className="border-y bg-card p-5 lg:sticky lg:top-24">
            <div className="mb-5">
              <h2 className="font-semibold">Add movement</h2>
              <p className="mt-1 text-xs text-muted-foreground">Entries are recorded in {currency}.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={entryType} onValueChange={(value) => setEntryType(value as "earning" | "expense")} disabled={isSubmitting}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Earning</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" name="amount" inputMode="decimal" placeholder="0.00" required disabled={isSubmitting} aria-invalid={Boolean(errors.amount)} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="occurred_on">Date *</Label>
                <Input id="occurred_on" name="occurred_on" type="date" defaultValue={today()} required disabled={isSubmitting} aria-invalid={Boolean(errors.occurred_on)} />
                {errors.occurred_on && <p className="text-sm text-destructive">{errors.occurred_on[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" rows={4} maxLength={500} required disabled={isSubmitting} aria-invalid={Boolean(errors.description)} />
                {errors.description && <p className="text-sm text-destructive">{errors.description[0]}</p>}
              </div>
              <Button className="w-full" disabled={isSubmitting || !report?.client.is_active}>
                <Plus className="size-4" />{isSubmitting ? "Recording..." : "Record movement"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}