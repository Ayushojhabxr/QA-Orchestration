import { useEffect, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import GlassCard from "../../components/GlassCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getUsers, updateUserRole } from "../../services/userService";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  const load = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AnimatedPage>
      <DashboardLayout
        title="User Management"
        subtitle="Manage company users and assign admin, tester, or developer roles."
      >
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/60">
                <tr>
                  {["Name", "Email", "Role", "Created"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs uppercase tracking-[0.24em] text-slate-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/80">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-900/20">
                    <td className="px-6 py-4 text-white">{user.name}</td>
                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={async (event) => {
                          await updateUserRole(user._id, event.target.value);
                          await load();
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                      >
                        <option value="admin">admin</option>
                        <option value="developer">developer</option>
                        <option value="tester">tester</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default AdminUsersPage;
