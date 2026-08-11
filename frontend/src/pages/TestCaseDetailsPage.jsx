import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";
import WorkflowTimeline from "../components/WorkflowTimeline";
import DashboardLayout from "../layouts/DashboardLayout";
import { addComment, getTestCaseById } from "../services/testCaseService";
import { getCompanyUsers } from "../services/userService";

function TestCaseDetailsPage() {
  const location = useLocation();
  const { testCaseId } = useParams();
  const [testCase, setTestCase] = useState(null);
  const [users, setUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const [selectedMentions, setSelectedMentions] = useState([]);

  const roleBase = useMemo(() => {
    const projectId = testCase?.project?._id || testCase?.project?.id;
    if (location.pathname.startsWith("/tester")) {
      return projectId ? `/tester/project/${projectId}` : "/tester/projects";
    }
    if (location.pathname.startsWith("/developer")) {
      return projectId ? `/developer/project/${projectId}` : "/developer/projects";
    }
    return "/admin/projects";
  }, [location.pathname, testCase?.project?._id, testCase?.project?.id]);

  const load = async () => {
    const [testCaseData, userData] = await Promise.all([
      getTestCaseById(testCaseId),
      getCompanyUsers(),
    ]);
    setTestCase(testCaseData);
    setUsers(userData);
  };

  useEffect(() => {
    load();
  }, [testCaseId]);

  const mentionMatch = draft.match(/(?:^|\s)@([a-zA-Z0-9]*)$/);
  const mentionQuery = mentionMatch?.[1] || "";
  const mentionSuggestions = mentionQuery
    ? users.filter((user) => user.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : [];

  const activeMentionIds = selectedMentions
    .filter((user) => draft.includes(`@${user.name}`))
    .map((user) => user._id);

  return (
    <AnimatedPage>
      <DashboardLayout
        title={testCase?.scenarioId || "Test Case Details"}
        subtitle="Inspect testcase information, activity history, and threaded collaboration in one focused view."
      >
        <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <GlassCard className="p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Test Case Information</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                {testCase?.scenarioId}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Project</p>
                  <p className="mt-2 text-sm text-slate-300">{testCase?.project?.name || "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sheet</p>
                  <p className="mt-2 text-sm text-slate-300">{testCase?.sheetName || "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority</p>
                  <p className="mt-2 text-sm text-slate-300">{testCase?.priority || "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned Developer</p>
                  <p className="mt-2 text-sm text-slate-300">{testCase?.assignedToDeveloperName || "-"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Description</p>
                  <p className="mt-2 text-sm text-slate-300">{testCase?.description || "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Steps</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{testCase?.steps || "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Expected Result</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                    {testCase?.expectedResult || "-"}
                  </p>
                </div>
              </div>
            </GlassCard>

            <WorkflowTimeline actions={testCase?.actionHistory || []} />
          </div>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-white">Comments</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {(testCase?.comments || []).length} total
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {(testCase?.comments || []).map((comment) => (
                <div key={comment._id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{comment.userName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{comment.comment}</p>
                </div>
              ))}
            </div>

            <div className="relative mt-5">
              <textarea
                rows="5"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100"
                placeholder="Write a comment. Type @ to mention a user..."
              />
              {mentionSuggestions.length ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-slate-800 bg-slate-950/95 p-2">
                  {mentionSuggestions.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => {
                        setDraft((current) => current.replace(/(?:^|\s)@[a-zA-Z0-9]*$/, ` @${user.name} `));
                        setSelectedMentions((current) =>
                          current.some((item) => item._id === user._id) ? current : [...current, user]
                        );
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900/70"
                    >
                      <span>{user.name}</span>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">{user.role}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <GlowButton
              type="button"
              className="mt-4"
              onClick={async () => {
                if (!draft.trim()) return;
                await addComment(testCaseId, { text: draft.trim(), mentions: activeMentionIds });
                setDraft("");
                setSelectedMentions([]);
                await load();
              }}
            >
              Add Comment
            </GlowButton>

            <Link
              to={roleBase}
              className="mt-4 inline-flex rounded-2xl border border-slate-800 px-4 py-3 text-sm text-slate-300"
            >
              Back to Workspace
            </Link>
          </GlassCard>
        </div>
      </DashboardLayout>
    </AnimatedPage>
  );
}

export default TestCaseDetailsPage;
