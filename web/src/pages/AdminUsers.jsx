import { useState } from "react";
import AdminShell, { AdminState, useAdminData } from "../components/AdminShell.jsx";
import DataTable from "../components/DataTable.jsx";
import { api } from "../api.js";

export default function AdminUsers({ user }) {
  const { data, error, reload } = useAdminData();
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  async function saveUser(event) {
    event.preventDefault();
    setSaving(true);
    setUserMessage("");
    try {
      await api(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        }),
      });
      setEditingUser(null);
      await reload();
    } catch (reason) {
      setUserMessage(reason.message || "Không thể lưu user.");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(item) {
    if (String(item.id) === String(user.id)) return;
    if (!window.confirm(`Xoá tài khoản ${item.email}?`)) return;
    try {
      await api(`/api/admin/users/${item.id}`, { method: "DELETE" });
      await reload();
    } catch (reason) {
      setUserMessage(reason.message || "Không thể xoá user.");
    }
  }

  return (
    <AdminShell
      user={user}
      title="Users"
      description="Danh sách tài khoản và số lượt tạo sticker."
    >
      <AdminState data={data} error={error}>
        {(body) => (
          <DataTable
            headers={["Tên", "Email", "Role", "Lượt tạo"]}
            actions={(row) => (
              <div className="table-action-group">
                <button
                  type="button"
                  className="table-action"
                  onClick={() => {
                    setEditingUser({ ...row.user });
                    setUserMessage("");
                  }}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="table-action danger"
                  disabled={String(row.user.id) === String(user.id)}
                  onClick={() => removeUser(row.user)}
                >
                  Xoá
                </button>
              </div>
            )}
            rows={body.users.map((item) => ({
              key: item.id || item.email,
              user: item,
              cells: [item.name, item.email, item.role, item.stickerCreations],
            }))}
          />
        )}
      </AdminState>
      {userMessage && <p className="error admin-user-message">{userMessage}</p>}
      {editingUser && (
        <div
          className="backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingUser(null);
          }}
        >
          <form className="create-card user-detail-card" onSubmit={saveUser}>
            <button className="close" type="button" onClick={() => setEditingUser(null)}>
              ×
            </button>
            <p className="eyebrow">Sửa user</p>
            <h2>{editingUser.name}</h2>
            <label>
              Tên
              <input
                value={editingUser.name}
                onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={editingUser.email}
                onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })}
                required
              />
            </label>
            <label>
              Role
              <select
                value={editingUser.role}
                onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {userMessage && <p className="form-message">{userMessage}</p>}
            <button className="primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
