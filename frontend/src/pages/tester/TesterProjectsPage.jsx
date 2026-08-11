import { useEffect, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage";
import ProjectListGrid from "../../components/ProjectListGrid";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getProjects } from "../../services/projectService";

function TesterProjectsPage() {
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
        title="Tester Projects"
        subtitle="Open an assigned project to upload workbooks, manage cases, or move through sheet-level QA views."
      >
        <ProjectListGrid
          projects={projects}
          basePath="/tester/project"
          emptyMessage="No tester projects assigned yet."
        />
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default TesterProjectsPage;
