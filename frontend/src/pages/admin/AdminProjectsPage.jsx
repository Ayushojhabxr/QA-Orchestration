import { useEffect, useMemo, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import ProjectManager from "../../components/ProjectManager";
import DashboardLayout from "../../layouts/DashboardLayout";
import { createProject, deleteProject, getProjects, updateProject } from "../../services/projectService";
import { getUsers } from "../../services/userService";

function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const load = async () => {
    const [projectData, userData] = await Promise.all([getProjects(), getUsers()]);
    setProjects(projectData);
    setUsers(userData);
  };

  useEffect(() => {
    load();
  }, []);

  const testers = useMemo(() => users.filter((user) => user.role === "tester"), [users]);
  const developers = useMemo(() => users.filter((user) => user.role === "developer"), [users]);

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Project Management"
        subtitle="Create projects, assign testers and developers, and keep ownership separated from analytics."
      >
        <ProjectManager
          projects={projects}
          testers={testers}
          developers={developers}
          onCreate={async (payload) => {
            await createProject(payload);
            await load();
          }}
          onUpdate={async (id, payload) => {
            await updateProject(id, payload);
            await load();
          }}
          onDelete={async (id) => {
            await deleteProject(id);
            await load();
          }}
        />
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default AdminProjectsPage;
