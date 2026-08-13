import type { EntryLabelValues } from "@/lib/ledger/entry-labels";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60";

type EntryLabelsFieldsProps = {
  disabled?: boolean;
  idPrefix: string;
  onChange: (labels: EntryLabelValues) => void;
  values: EntryLabelValues;
};

export function EntryLabelsFields({
  disabled = false,
  idPrefix,
  onChange,
  values,
}: EntryLabelsFieldsProps) {
  function updateField<Key extends keyof EntryLabelValues>(
    field: Key,
    value: EntryLabelValues[Key],
  ) {
    onChange({
      ...values,
      [field]: value,
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-description`} className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">
          Title
        </label>
        <input
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          disabled={disabled}
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-vendor`} className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">
          Vendor
        </label>
        <input
          id={`${idPrefix}-vendor`}
          value={values.vendorName}
          onChange={(event) => updateField("vendorName", event.target.value)}
          disabled={disabled}
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-payment-method`} className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">
          Payment method
        </label>
        <input
          id={`${idPrefix}-payment-method`}
          value={values.paymentMethod}
          onChange={(event) => updateField("paymentMethod", event.target.value)}
          disabled={disabled}
          placeholder="cash, transfer, card"
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-reference`} className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">
          Reference
        </label>
        <input
          id={`${idPrefix}-reference`}
          value={values.reference}
          onChange={(event) => updateField("reference", event.target.value)}
          disabled={disabled}
          placeholder="Receipt or bank ref"
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-notes`} className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">
          Notes
        </label>
        <input
          id={`${idPrefix}-notes`}
          value={values.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          disabled={disabled}
          placeholder="maid, handyman, etc."
          className={inputClassName}
        />
      </div>
    </div>
  );
}
