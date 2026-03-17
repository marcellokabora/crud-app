"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messages, Locale } from "./messages";

const locales: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export default function I18nDemoPage() {
  const [locale, setLocale] = useState<Locale>("en");

  // This is the t() function — looks up the key in the active locale's messages
  const t = (key: string) => messages[locale][key] ?? key;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Language switcher */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">{t("language")}:</span>
        <div className="flex gap-2">
          {locales.map((l) => (
            <Button
              key={l.code}
              variant={locale === l.code ? "default" : "outline"}
              size="sm"
              onClick={() => setLocale(l.code)}
            >
              {l.flag} {l.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Translated content */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("greeting")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{t("currentLocale")}:</span>{" "}
            <code className="bg-muted px-1 rounded">{locale}</code>
          </p>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
            <li>{t("step4")}</li>
          </ol>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href="/posts">{t("postsLink")}</Link>
      </Button>
    </div>
  );
}
