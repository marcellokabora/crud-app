"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { api, ApiError, ClientInput } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fields: Array<{ name: keyof ClientInput; label: string; type?: string; placeholder?: string }> = [
  { name: "name", label: "Name", placeholder: "Acme Company" },
  { name: "email", label: "Email", type: "email", placeholder: "accounts@example.com" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+1 555 0100" },
  { name: "external_reference", label: "External reference", placeholder: "CLIENT-001" },
];

export default function NewClientPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setMessage("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const input = Object.fromEntries(
      ["name", "email", "phone", "external_reference", "notes"].map((key) => [key, String(form.get(key) ?? "")]),
    ) as unknown as ClientInput;

    try {
      await api.createClient(input);
      router.push("/clients");
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

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-7">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/clients"><ArrowLeft className="size-4" />Back to clients</Link>
        </Button>
        <div>
          <p className="mb-1 font-mono text-xs uppercase text-primary">Client administration</p>
          <h1 className="text-3xl font-semibold">Add client</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a database record for a client. Clients do not receive application access.</p>
        </div>
        <form onSubmit={handleSubmit} className="border-y bg-card p-5 sm:p-7">
          {message && <p role="alert" className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}
          <div className="grid gap-6 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}{field.name === "name" && " *"}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.name === "name"}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors[field.name])}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                />
                {errors[field.name] && <p id={`${field.name}-error`} className="text-sm text-destructive">{errors[field.name][0]}</p>}
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={5} disabled={isSubmitting} aria-invalid={Boolean(errors.notes)} />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes[0]}</p>}
            </div>
          </div>
          <div className="mt-7 flex justify-end gap-3 border-t pt-5">
            <Button variant="outline" type="button" asChild><Link href="/clients">Cancel</Link></Button>
            <Button disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create client"}</Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}