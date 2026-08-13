import { buildBeancountEntry } from "@/lib/ledger/preview";
import type { LedgerEntryMetadata, LedgerEntryRecord, StructuredLedgerEntry } from "@/lib/ledger/types";

export type EntryLabelValues = {
  description: string;
  notes: string;
  paymentMethod: string;
  reference: string;
  vendorName: string;
};

export function recordToLabelValues(entry: {
  description: string;
  metadata: LedgerEntryMetadata;
}): EntryLabelValues {
  return {
    description: entry.description,
    notes: entry.metadata.notes ?? "",
    paymentMethod: entry.metadata.paymentMethod ?? "",
    reference: entry.metadata.reference ?? "",
    vendorName: entry.metadata.vendorName ?? "",
  };
}

export function entryToLabelValues(entry: StructuredLedgerEntry): EntryLabelValues {
  return {
    description: entry.description,
    notes: entry.metadata?.notes ?? "",
    paymentMethod: entry.metadata?.paymentMethod ?? "",
    reference: entry.metadata?.reference ?? "",
    vendorName: entry.metadata?.vendorName ?? "",
  };
}

function cleanOptionalLabel(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function applyEntryLabels(
  entry: StructuredLedgerEntry,
  labels: EntryLabelValues,
  options?: { normalize?: boolean },
): StructuredLedgerEntry {
  const normalize = options?.normalize ?? true;

  if (normalize) {
    const description = labels.description.trim();

    if (!description) {
      throw new Error("Entry title cannot be empty.");
    }

    return {
      ...entry,
      description,
      metadata: {
        notes: cleanOptionalLabel(labels.notes),
        paymentMethod: cleanOptionalLabel(labels.paymentMethod),
        reference: cleanOptionalLabel(labels.reference),
        vendorName: cleanOptionalLabel(labels.vendorName),
      },
    };
  }

  return {
    ...entry,
    description: labels.description || entry.description,
    metadata: {
      notes: labels.notes || null,
      paymentMethod: labels.paymentMethod || null,
      reference: labels.reference || null,
      vendorName: labels.vendorName || null,
    },
  };
}

export function rebuildPreviewFromLabels(
  entry: StructuredLedgerEntry,
  labels: EntryLabelValues,
) {
  const updatedEntry = applyEntryLabels(entry, labels, { normalize: false });

  return {
    beancountText: buildBeancountEntry(updatedEntry),
    entry: updatedEntry,
  };
}
