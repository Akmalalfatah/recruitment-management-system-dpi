import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, Save, ShieldCheck } from "lucide-react";
import { userApi, usingDemoData } from "../../lib/db";
import { useAuth } from "../../contexts/AuthContext";
import { PageHeader, Card, PrimaryButton, GhostButton, ActionIconButton, Field, TextInput, SelectInput } from "../../components/common/Ui";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { ROLES, ROLE_LABELS } from "../../lib/constants";

const ROLE_OPTIONS = Object.values(ROLES);
const STATUS_OPTIONS = ["Active", "Inactive"];

const emptyForm = { name: "", email: "", password: "", role: "", area_penempatan: "", status: "Active" };

export default function UserManagement() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); 
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    userApi
      .list()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      name: row.name || "",
      email: row.email || "",
      password: "",
      role: row.role || "",
      area_penempatan: row.area_penempatan || "",
      status: row.status || "Active",
    });
    setError("");
    setShowForm(true);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await userApi.update(editing.id, {
          name: form.name,
          role: form.role,
          area_penempatan: form.area_penempatan || null,
          status: form.status,
        });
      } else {
        if (!form.password || form.password.length < 6) {
          throw new Error("Password minimal 6 karakter.");
        }
        await userApi.create({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          area_penempatan: form.area_penempatan,
        });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.message || "Gagal menyimpan user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(row) {
    if (row.id === me?.id) {
      alert("Tidak bisa menghapus akun yang sedang kamu pakai sendiri.");
      return;
    }
    if (!confirm(`Hapus user "${row.name}"? Aksi ini menghapus akses login mereka ke sistem.`)) return;
    await userApi.remove(row.id);
    load();
  }

  const columns = [
    { key: "name", header: "Nama" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (r) => ROLE_LABELS[r.role] || r.role },
    { key: "area_penempatan", header: "Area Penempatan", render: (r) => r.area_penempatan || "-" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "aksi",
      header: "Aksi",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <ActionIconButton icon={Pencil} onClick={() => openEdit(r)} variant="edit" title="Edit user" />
          <ActionIconButton icon={Trash2} onClick={() => handleRemove(r)} variant="danger" title="Hapus user" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Manajemen User"
        subtitle="Kelola akun pengguna sistem dan role masing-masing."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} /> Tambah User
          </PrimaryButton>
        }
      />

      {usingDemoData && (
        <div className="text-xs bg-status-blue/10 border border-status-blue/30 text-status-blue px-3 py-2 mb-4 flex items-center gap-2">
          <ShieldCheck size={14} /> Mode demo: user baru cuma tersimpan di browser ini (localStorage), bukan akun Supabase sungguhan.
        </div>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 text-ink-700 font-semibold text-sm mb-4">
          <Users size={16} className="text-primary" /> Daftar User
        </div>
        {loading ? (
          <p className="text-sm text-ink-500 py-6 text-center">Memuat data...</p>
        ) : (
          <DataTable columns={columns} rows={rows} emptyLabel="Belum ada user." />
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Edit User" : "Tambah User Baru"} width="max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama">
            <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              disabled={!!editing}
            />
          </Field>
          {!editing && (
            <Field label="Password" hint="Minimal 6 karakter.">
              <TextInput
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </Field>
          )}
          <Field label="Role">
            <SelectInput
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              options={ROLE_OPTIONS}
              required
            />
            {form.role && <p className="text-[11px] text-ink-400 mt-1">{ROLE_LABELS[form.role]}</p>}
          </Field>
          <Field label="Area Penempatan (opsional)">
            <TextInput
              value={form.area_penempatan}
              onChange={(e) => setForm((f) => ({ ...f, area_penempatan: e.target.value }))}
              placeholder="cth. Kantor Pusat"
            />
          </Field>
          {editing && (
            <Field label="Status">
              <SelectInput value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} options={STATUS_OPTIONS} />
            </Field>
          )}

          {error && <p className="text-xs text-status-red">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={() => setShowForm(false)}>Batal</GhostButton>
            <PrimaryButton type="submit" disabled={saving}>
              <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}