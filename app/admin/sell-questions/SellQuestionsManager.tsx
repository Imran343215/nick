"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import type { SellQuestionShape } from "@/lib/sell-catalog";
import { firstError, formatPrice, requiredField } from "@/lib/utils";
import { autoSlugFromName } from "@/lib/upload";
import { useToast } from "@/components/ui/toast";

type AdjustmentType = "flat" | "percent";
type Direction = "reduce" | "increase";
type OptionRow = { label: string; adjustmentType: AdjustmentType; direction: Direction; value: string };

const emptyOption: OptionRow = { label: "", adjustmentType: "flat", direction: "reduce", value: "0" };

const emptyForm = {
  text: "",
  slug: "",
  status: "active" as "active" | "inactive",
  order: "0",
  options: [{ ...emptyOption }, { ...emptyOption }] as OptionRow[],
};

function describeOption(o: { adjustmentType: AdjustmentType; direction: Direction; value: number }): string {
  const magnitude = Math.abs(o.value);
  const sign = o.direction === "increase" ? "+" : "-";
  if (o.adjustmentType === "percent") {
    return `${sign}${magnitude}%`;
  }
  return `${sign}${formatPrice(magnitude)}`;
}

export default function SellQuestionsManager() {
  const router = useRouter();
  const toast = useToast();
  const [questions, setQuestions] = useState<SellQuestionShape[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function loadQuestions() {
    const res = await fetch("/api/admin/sell-questions");
    const data = await res.json();
    if (res.status === 401) return router.push("/admin");
    if (!res.ok) throw new Error(data.error || "Could not load sell questions.");
    setQuestions(data.questions ?? []);
  }

  useEffect(() => {
    loadQuestions()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load sell questions."))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm({ ...emptyForm, options: [{ ...emptyOption }, { ...emptyOption }] });
    setEditingId(null);
    setSlugTouched(false);
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    resetForm();
  }

  function startEdit(question: SellQuestionShape) {
    setEditingId(question._id);
    setForm({
      text: question.text,
      slug: question.slug,
      status: question.status,
      order: String(question.order),
      options: question.options.map((o) => ({
        label: o.label,
        adjustmentType: o.adjustmentType,
        direction: o.direction ?? "reduce",
        value: String(Math.abs(o.value)),
      })),
    });
    setSlugTouched(true);
    setShowForm(true);
  }

  function updateOption(index: number, field: keyof OptionRow, value: string) {
    setForm((current) => ({
      ...current,
      options: current.options.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    }));
  }

  function addOption() {
    setForm((current) => ({ ...current, options: [...current.options, { ...emptyOption }] }));
  }

  function removeOption(index: number) {
    setForm((current) => ({
      ...current,
      options: current.options.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const validOptions = form.options
      .map((o) => ({
        label: o.label.trim(),
        adjustmentType: o.adjustmentType,
        direction: o.direction,
        value: Math.abs(Number(o.value)),
      }))
      .filter((o) => o.label && Number.isFinite(o.value));

    const validationError = firstError([
      requiredField(form.text, "Question text"),
      validOptions.length < 2 ? "Add at least two options." : "",
    ]);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const payload = {
      text: form.text.trim(),
      slug: form.slug.trim(),
      status: form.status,
      order: Number(form.order),
      options: validOptions,
    };

    const res = await fetch(
      editingId ? `/api/admin/sell-questions/${editingId}` : "/api/admin/sell-questions",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save sell question.");
      toast.error(data.error || "Could not save sell question.");
      return;
    }

    await loadQuestions();
    resetForm();
    setShowForm(false);
    toast.success(editingId ? "Question updated." : "Question created.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/sell-questions/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete question.");
      toast.error(data.error || "Could not delete question.");
      return;
    }
    setQuestions((current) => current.filter((q) => q._id !== id));
    if (editingId === id) resetForm();
    toast.success("Question deleted.");
  }

  return (
    <AdminShell
      eyebrow="Sell phone catalog"
      title="Sell condition questions"
      lead="The questionnaire customers answer to get an instant quote. Each option can deduct (or add) either a flat amount or a percentage of the variant's max price."
    >
      <div className="admin-toolbar admin-toolbar--compact">
        <button type="button" className="btn btn--primary" onClick={openAdd}>
          + Add question
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <DataTable
        loading={loading}
        emptyMessage="No condition questions yet — add at least one so customers can get a quote."
        rows={questions}
        columns={[
          { key: "text", header: "Question" },
          {
            key: "options",
            header: "Options",
            render: (row) => (
              <small>{row.options.map((o) => `${o.label} (${describeOption(o)})`).join(", ")}</small>
            ),
          },
          { key: "status", header: "Status" },
          { key: "order", header: "Order" },
        ]}
        actions={(row) => (
          <>
            <button type="button" className="btn btn--ghost" onClick={() => startEdit(row)}>
              Edit
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => remove(row._id)}>
              Delete
            </button>
          </>
        )}
      />

      <Modal open={showForm} title={editingId ? "Edit question" : "Add question"} onClose={closeModal}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field field--full">
            <label htmlFor="sq-text">Question text</label>
            <input
              id="sq-text"
              value={form.text}
              onChange={(e) => {
                const text = e.target.value;
                setForm((current) => ({
                  ...current,
                  text,
                  slug: slugTouched ? current.slug : autoSlugFromName(text),
                }));
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="sq-slug">Slug</label>
            <input
              id="sq-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="sq-status">Status</label>
            <select
              id="sq-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sq-order">Order</label>
            <input
              id="sq-order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>

          <div className="field field--full">
            <label>
              Options — pick whether each one reduces or increases the price, then enter a plain
              positive number (percentage of max price, or a flat ₹ amount)
            </label>
            {form.options.map((option, index) => (
              <div key={index} className="option-row">
                <input
                  placeholder="Option label (e.g. Screen: Minor scratches)"
                  value={option.label}
                  onChange={(e) => updateOption(index, "label", e.target.value)}
                />
                <select
                  value={option.direction}
                  onChange={(e) => updateOption(index, "direction", e.target.value)}
                  style={{ maxWidth: "130px" }}
                >
                  <option value="reduce">Reduce price</option>
                  <option value="increase">Increase price</option>
                </select>
                <select
                  value={option.adjustmentType}
                  onChange={(e) => updateOption(index, "adjustmentType", e.target.value)}
                  style={{ maxWidth: "110px" }}
                >
                  <option value="flat">Flat ₹</option>
                  <option value="percent">Percent %</option>
                </select>
                <input
                  placeholder={option.adjustmentType === "percent" ? "e.g. 5" : "e.g. 500"}
                  type="number"
                  min={0}
                  value={option.value}
                  onChange={(e) => updateOption(index, "value", e.target.value)}
                  style={{ maxWidth: "110px" }}
                />
                {form.options.length > 2 && (
                  <button type="button" className="btn btn--ghost" onClick={() => removeOption(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn--repair-outline" onClick={addOption}>
              + Add option
            </button>
          </div>

          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              {editingId ? "Save changes" : "Create question"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
