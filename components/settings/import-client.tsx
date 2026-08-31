"use client";

import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { parseSingleRows } from "@/lib/import/parse-single";
import { parseSgpRows } from "@/lib/import/parse-sgp";
import { parseParlayRows } from "@/lib/import/parse-parlay";
import { commitImport } from "@/lib/actions/import";
import { useAppData } from "@/components/shell/app-data-context";
import type { ImportPreview, ImportSource } from "@/lib/import/types";
import { formatCurrency, formatOdds } from "@/lib/format";

const SOURCE_OPTIONS: { value: ImportSource; label: string; hint: string }[] = [
  { value: "Form Responses3", label: "Form Responses3 (Singles)", hint: "One row per single bet." },
  {
    value: "SGP Responses",
    label: "SGP Responses (Same Game Parlays)",
    hint: "One shared game per row, with Leg 1..6 Prop Type/Prop/Odds/Result columns.",
  },
  {
    value: "Parlay Responses",
    label: "Parlay Responses (Parlays)",
    hint: "One row per parlay, with Leg 1..6 Sport/League/Match/Prop Type/Prop/Odds/Result columns.",
  },
];

function parseBySource(source: ImportSource, rows: Record<string, string>[]): ImportPreview {
  if (source === "Form Responses3") return parseSingleRows(rows);
  if (source === "SGP Responses") return parseSgpRows(rows);
  return parseParlayRows(rows);
}

export function ImportClient() {
  const { profile, refreshData } = useAppData();
  const [source, setSource] = useState<ImportSource>("Form Responses3");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: { row: number; message: string }[] } | null>(
    null
  );

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(parseBySource(source, results.data));
      },
      error: () => {
        toast.error("Couldn't read that CSV file.");
      },
    });
  }

  async function handleConfirmImport() {
    if (!preview || preview.validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await commitImport(preview.validRows);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setResult({ imported: res.imported ?? 0, failed: res.failed ?? [] });
      if ((res.imported ?? 0) > 0) {
        toast.success(`Imported ${res.imported} bet${res.imported === 1 ? "" : "s"}.`);
        refreshData();
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/settings" className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          ← Back to Settings
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Import from old tracker</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Export a CSV from the Google Sheets tracker, choose which tab it came from, and preview before
          importing. Nothing is imported until you confirm — rows with problems are shown, not silently
          skipped.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <Label htmlFor="source">Source tab</Label>
            <Select
              id="source"
              value={source}
              onChange={(e) => {
                setSource(e.target.value as ImportSource);
                setPreview(null);
                setResult(null);
              }}
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {SOURCE_OPTIONS.find((s) => s.value === source)?.hint}
            </p>
          </div>

          <div>
            <Label htmlFor="csv-file">CSV file</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:text-slate-400 dark:file:bg-slate-100 dark:file:text-slate-900 dark:hover:file:bg-white"
            />
            {fileName && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{fileName}</p>}
          </div>
        </div>
      </Card>

      {preview && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Preview</h2>
            <div className="flex gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">{preview.totalRows} rows read</span>
              <span className="text-emerald-600 dark:text-emerald-400">{preview.validRows.length} valid</span>
              {preview.errors.length > 0 && <span className="text-red-600 dark:text-red-400">{preview.errors.length} with errors</span>}
            </div>
          </div>

          {preview.errors.length > 0 && (
            <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="mb-1 text-xs font-medium text-red-700 dark:text-red-400">
                These rows will NOT be imported until fixed in your CSV and re-uploaded:
              </p>
              <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
                {preview.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.validRows.length > 0 && (
            <div className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[480px] text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                  <tr className="text-left text-slate-500 dark:text-slate-400">
                    <th className="px-2 py-1.5">Row</th>
                    <th className="px-2 py-1.5">Match</th>
                    <th className="px-2 py-1.5">Type</th>
                    <th className="px-2 py-1.5">Odds</th>
                    <th className="px-2 py-1.5">Wager</th>
                    <th className="px-2 py-1.5">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.validRows.slice(0, 100).map((row) => (
                    <tr key={row.row} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-1.5 text-slate-400 dark:text-slate-500">{row.row}</td>
                      <td className="px-2 py-1.5 text-slate-800 dark:text-slate-200">{row.match}</td>
                      <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400">{row.bet_type}</td>
                      <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400">{formatOdds(row.odds)}</td>
                      <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400">{formatCurrency(row.wager, profile.currency)}</td>
                      <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400">{row.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.validRows.length > 100 && (
                <p className="px-2 py-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Showing first 100 of {preview.validRows.length} valid rows.
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <Button
              onClick={handleConfirmImport}
              disabled={importing || preview.validRows.length === 0}
            >
              {importing
                ? "Importing…"
                : `Import ${preview.validRows.length} bet${preview.validRows.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Import result</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Imported <span className="font-medium text-emerald-600 dark:text-emerald-400">{result.imported}</span> bet
            {result.imported === 1 ? "" : "s"} into your account.
          </p>
          {result.failed.length > 0 && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="mb-1 text-xs font-medium text-red-700 dark:text-red-400">
                {result.failed.length} row{result.failed.length === 1 ? "" : "s"} failed to save:
              </p>
              <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
                {result.failed.map((f) => (
                  <li key={f.row}>
                    Row {f.row}: {f.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
