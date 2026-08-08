"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, UserRoundX, Users } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api, ApiError, Client } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removingClientId, setRemovingClientId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      api.clients(query)
        .then(setClients)
        .catch((caught: unknown) => {
          setError(caught instanceof ApiError ? caught.message : "Unable to reach the PHP API.");
        })
        .finally(() => setIsLoading(false));
    }, query ? 250 : 0);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const removeClient = async (client: Client) => {
    if (!window.confirm(`Remove ${client.name}? Their ledger history will be preserved.`)) return;

    setRemovingClientId(client.id);
    setError("");
    try {
      await api.removeClient(client.id);
      setClients((current) => current.filter((item) => item.id !== client.id));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to reach the PHP API.");
    } finally {
      setRemovingClientId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 font-mono text-xs uppercase text-primary">Client administration</p>
            <h1 className="text-3xl font-semibold">Clients</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage client records and their financial movements.</p>
          </div>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="size-4" />
              Add client
            </Link>
          </Button>
        </div>

        <div className="border-y bg-card">
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, or reference"
                aria-label="Search clients"
                className="pl-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">{isLoading ? "Loading..." : `${clients.length} client${clients.length === 1 ? "" : "s"}`}</p>
          </div>

          {error ? (
            <div className="p-10 text-center" role="alert">
              <UserRoundX className="mx-auto mb-3 size-8 text-destructive" aria-hidden="true" />
              <p className="font-medium">Clients could not be loaded</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : !isLoading && clients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">{query ? "No matching clients" : "No clients yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query ? "Try another search term." : "Add the first client to begin tracking movements."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={isLoading ? "opacity-50" : ""}>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <Link href={`/clients/${client.id}`} className="underline-offset-4 hover:text-primary hover:underline">
                          {client.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>{client.email || "No email"}</div>
                        {client.phone && <div className="text-xs text-muted-foreground">{client.phone}</div>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{client.external_reference || "-"}</TableCell>
                      <TableCell>
                        <span className={client.is_active ? "status-badge status-active" : "status-badge status-inactive"}>
                          {client.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeClient(client)}
                          disabled={removingClientId === client.id}
                          aria-label={`Remove ${client.name}`}
                          title="Remove client"
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
        </div>
      </div>
    </AuthGuard>
  );
}