import { useEffect, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import ProjectListGrid from "../../components/ProjectListGrid";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getProjects } from "../../services/projectService";

function DeveloperProjectsPage() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await getProjects();
      setProjects(data);
    };

    load();
  }, []);

  return (
    <AnimatedPage>
      <DashboardLayout
        title="Developer Projects"
        subtitle="Open an assigned project to work through sheet-specific queues in table or kanban view."
      >
        <ProjectListGrid
          projects={projects}
          basePath="/developer/project"
          emptyMessage="No developer projects assigned yet."
        />
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default DeveloperProjectsPage;
