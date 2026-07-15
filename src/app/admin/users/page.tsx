"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Pencil, Copy, Check, Eye, EyeOff } from "lucide-react";
import { AdminUserForm } from "./admin-user-form";
import { CredentialsDialog } from "./admin-credentials-dialog";

interface User {
  id: string; email: string; name: string | null; role: string;
  phone: string | null; avatarUrl: string | null; isVisible: boolean; createdAt: string; password: string;
}

const roleLabels: Record<string, string> = { Owner: "👑 Владелец", Master: "🔧 Мастер", Client: "👤 Клиент" };
const emptyForm = { email: "", password: "", name: "", phone: "", role: "Master" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [editData, setEditData] = useState(emptyForm);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try { const res = await fetch("/api/admin/users"); if (res.ok) setUsers(await res.json()); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Ошибка"); setSaving(false); return; }
      setCreated({ email: formData.email, password: formData.password });
      setFormData(emptyForm); setShowForm(false); fetchUsers();
    } catch { setError("Ошибка при создании"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
  };

  const toggleVisibility = async (user: User) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, isVisible: !user.isVisible }),
    });
    fetchUsers();
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setEditData({ email: user.email, name: user.name || "", phone: user.phone || "", role: user.role, password: "" });
    setEditError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return; setEditError(""); setEditSaving(true);
    try {
      const body: Record<string, unknown> = { id: editing.id, email: editData.email, name: editData.name, phone: editData.phone, role: editData.role };
      if (editData.password) body.password = editData.password;
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setEditError(d.error || "Ошибка"); setEditSaving(false); return; }
      setEditing(null); fetchUsers();
    } catch { setEditError("Ошибка при обновлении"); }
    setEditSaving(false);
  };

  const roleColor = (r: string) => r === "Owner" ? "default" : r === "Master" ? "secondary" : "outline";

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сотрудники</h1>
          <p className="text-muted-foreground">Управление мастерами и пользователями</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="size-4" /> Добавить</Button>
      </div>

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setFormData(emptyForm); setError(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новый сотрудник</DialogTitle><DialogDescription>Создайте аккаунт мастера или клиента</DialogDescription></DialogHeader>
          <AdminUserForm data={formData} onChange={setFormData} onSubmit={handleCreate} error={error} saving={saving} onCancel={() => setShowForm(false)} submitLabel="Создать" savingLabel="Создание..." />
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Имя", "Email", "Телефон", "Роль", "Пароль", "Дата", ""].map((h, i) => (
                    <th key={i} className={`px-4 py-3 font-medium text-muted-foreground ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Нет пользователей</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <div className="relative size-10 shrink-0"><Image src={u.avatarUrl} alt="" fill className="object-cover rounded-full" /></div>
                        ) : (
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${u.role === "Owner" ? "bg-amber-500/20 text-amber-500" : u.role === "Master" ? "bg-sky-500/20 text-sky-500" : "bg-primary/10 text-primary"}`}>
                            {(u.name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{u.name || "Без имени"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                    <td className="px-4 py-3"><Badge variant={roleColor(u.role) as "default" | "secondary" | "outline"}>{roleLabels[u.role] || u.role}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="max-w-[140px] truncate text-xs text-muted-foreground" title={u.password}>{u.password}</code>
                        <button
                          className="shrink-0 rounded p-0.5 hover:bg-muted"
                          onClick={() => {
                            navigator.clipboard.writeText(u.password);
                            setCopiedId(u.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                        >
                          {copiedId === u.id ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== "Owner" && (
                        <div className="flex items-center justify-end gap-1">
                          {u.role === "Master" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`size-8 ${u.isVisible ? "text-green-500" : "text-muted-foreground"}`}
                              onClick={() => toggleVisibility(u)}
                              title={u.isVisible ? "Виден клиентам" : "Скрыт от клиентов"}
                            >
                              {u.isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(u)}><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => setDeletingId(u.id)}><Trash2 className="size-4" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать сотрудника</DialogTitle><DialogDescription>{editing?.email}</DialogDescription></DialogHeader>
          <AdminUserForm data={editData} onChange={setEditData} onSubmit={handleUpdate} error={editError} saving={editSaving} onCancel={() => setEditing(null)} submitLabel="Сохранить" savingLabel="Сохранение..." showPassword passwordPlaceholder="Оставьте пустым без изменений" />
        </DialogContent>
      </Dialog>

      <CredentialsDialog open={!!created} onOpenChange={(o) => { if (!o) setCreated(null); }} email={created?.email || ""} password={created?.password || ""} />
      <ConfirmDialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null); }} title="Удалить пользователя?" message="Это действие нельзя отменить." confirmText="Удалить" onConfirm={() => { if (deletingId) handleDelete(deletingId); setDeletingId(null); }} />
    </div>
  );
}
