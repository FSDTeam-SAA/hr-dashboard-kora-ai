"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import {
  Button,
  DataState,
  Empty,
  Field,
  Badge,
  Modal,
} from "@/components/novya/ui";
import {
  useSupport,
  useSupportMutation,
  date,
  type SupportContext,
} from "@/lib/support";
import { label } from "@/lib/format";
import { HrHelpCenter as HelpCenter } from "@/components/pages/hr-help";
import { HrApprovalsPage } from "@/components/pages/hr-actions";
import {
  CoveragePage,
  CoachingPage,
  HrReviewsPage,
} from "@/components/pages/hr-leadership";
import { HrOverview, PeopleHub, HrHead, Stats } from "@/components/pages/hr";
import { AssistantPage } from "@/components/pages/assistant";
import { LearnPage } from "@/components/pages/learn";
import { TasksPage, CreateTask } from "@/components/pages/work";
import { InboxPage, CalendarPage } from "@/components/sp/communication-pages";
import { OfficePage } from "@/components/sp/office-pages";
import { MediaPage } from "@/components/sp/media-pages";
import { SettingsPage } from "@/components/sp/settings-pages";
type Task = {
  _id: string;
  title: string;
  status: string;
  dueDate?: string;
  assignee_id?: { _id: string; name: string };
};
type Team = {
  members: {
    _id: string;
    user_id: string;
    name: string;
    title: string;
    status: string;
  }[];
  tasks: Task[];
};
export default function HrExperience() {
  const pathname = usePathname(),
    search = useSearchParams(),
    [root, section, id, tab] = pathname.split("/").filter(Boolean);
  if (root === "dashboard") return <HrOverview />;
  if (root === "assistant") return <AssistantPage section={section} id={id} />;
  if (root === "tasks") return <TasksPage id={section} />;
  if (root === "team")
    return (
      <HeadOfPeople
        section={section}
        id={id}
        day={search.get("date") || undefined}
      />
    );
  if (root === "learn" && section === "team") return <TeamLearning id={id} />;
  if (root === "learn" && section === "help") return <HelpCenter id={id} />;
  if (root === "learn")
    return (
      <LearnPage parts={[section, id, tab].filter(Boolean)} search={search} />
    );
  if (root === "inbox") return <InboxPage />;
  if (root === "calendar") return <CalendarPage />;
  if (root === "workflows") return <Workflows id={section} />;
  if (root === "workspace" && section === "office")
    return <OfficePage section={id} id={tab} />;
  if (root === "workspace" && section === "media")
    return (
      <MediaPage
        section={id}
        id={tab}
        detailTab={pathname.split("/").filter(Boolean)[4]}
      />
    );
  if (root === "workspace" && !section) return <HrOverview workspace />;
  if (root === "workspace")
    return <PeopleHub section={section} id={id} tab={tab} />;
  if (root === "settings") {
    const map: Record<string, [string, boolean]> = {
      profile: ["", true],
      security: ["security", true],
      privacy: ["sessions", true],
      accessibility: ["accessibility", true],
      notifications: ["notifications", false],
      connections: ["connections", false],
      preferences: ["preferences", false],
    };
    const [s, account] = map[section || ""] || ["", false];
    return <SettingsPage section={s} account={account} />;
  }
  if (root === "app")
    return (
      <div className="sa-page">
        <HrHead
          title="NOVYA Go"
          description="Your personal companion for tasks, time, learning and schedule."
        />
        <section className="sa-panel">
          <h3>Stay connected to your HR day</h3>
          <p>
            Use your invited work account in your organization&apos;s approved
            NOVYA Go app.
          </p>
          <p className="nv-caption">
            People records and Head of People administration remain in the
            desktop workspace.
          </p>
          <Button href="/settings/security">Account & Security</Button>
        </section>
      </div>
    );
  return (
    <Empty
      title="Page not found"
      action={<Button href="/dashboard">Back to Overview</Button>}
    />
  );
}
function HeadOfPeople({
  section,
  id,
  day,
}: {
  section?: string;
  id?: string;
  day?: string;
}) {
  const ctx = useSupport<SupportContext>("/context");
  if (ctx.isPending) return <div className="nv-loading">Loading role...</div>;
  if (!ctx.data?.teamLead)
    return (
      <Empty
        title="Head of People access required"
        description="This view is for direct HR-team leadership."
      />
    );
  if (section === "tasks" && id === "new") return <CreateTask team />;
  if (section === "approvals") return <HrApprovalsPage />;
  if (section === "coverage") return <CoveragePage />;
  if (section === "performance") return <CoachingPage />;
  if (section === "reviews") return <HrReviewsPage />;
  return <TeamView section={section} id={id} day={day} />;
}
function TeamView({
  section,
  id,
  day,
}: {
  section?: string;
  id?: string;
  day?: string;
}) {
  const q = useSupport<Team>("/team"),
    ctx = useSupport<SupportContext>("/context");
  const week = useSupport<{
    from: string;
    members: {
      user_id: string;
      name: string;
      days: { date: string; total: number; open: number; done: number }[];
    }[];
  }>("/tasks/week", section === "tasks" && !id);
  const [term, setTerm] = useState("");
  const members =
    q.data?.members.filter(
      (m) =>
        (!id || m.user_id === id || m._id === id) &&
        m.name.toLowerCase().includes(term.toLowerCase()),
    ) || [];
  const titles: Record<string, string> = {
    members: "HR Team",
    tasks: "Team Tasks",
    workload: "Workload",
    reviews: "Reviews",
    coverage: "Coverage",
    performance: "Performance & Coaching",
    approvals: "Approvals & Escalations",
  };
  const tasks =
    q.data?.tasks.filter(
      (t) =>
        (!id || t.assignee_id?._id === id) &&
        (!day || t.dueDate?.slice(0, 10) === day),
    ) || [];
  return (
    <div className="sa-page">
      <HrHead
        title={
          id
            ? `${members[0]?.name || "HR specialist"}${day ? " / " + date(day) : ""}`
            : titles[section || ""] || "Head of People"
        }
        description="Direct HR-team coordination, workload and evidence-linked follow-up."
        actions={<Button href="/team/tasks/new">Create & assign</Button>}
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <Stats
          items={[
            ["HR specialists", q.data?.members.length || 0],
            [
              "Open tasks",
              q.data?.tasks.filter(
                (t) => !["done", "cancelled"].includes(t.status),
              ).length || 0,
            ],
            [
              "Blocked",
              q.data?.tasks.filter((t) => t.status === "blocked").length || 0,
            ],
            [
              "Overdue",
              q.data?.tasks.filter(
                (t) =>
                  t.dueDate &&
                  new Date(t.dueDate) < new Date() &&
                  !["done", "cancelled"].includes(t.status),
              ).length || 0,
            ],
          ]}
        />
        {section === "tasks" && !id ? (
          <section className="sa-panel">
            <div className="sa-toolbar">
              <Button href="/tasks">My Tasks</Button>
              <Badge>Team View</Badge>
            </div>
            <DataState
              pending={week.isPending}
              error={week.error}
              retry={() => week.refetch()}
            >
              <div className="hr-table-wrap">
                <table className="hr-table hr-week">
                  <thead>
                    <tr>
                      <th>HR specialist</th>
                      {week.data?.members[0]?.days.map((d) => (
                        <th key={d.date}>
                          {new Date(d.date).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                          })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {week.data?.members.map((m) => (
                      <tr key={m.user_id}>
                        <td>{m.name}</td>
                        {m.days.map((d) => (
                          <td key={d.date}>
                            <Link
                              href={
                                "/team/tasks/" +
                                m.user_id +
                                "?date=" +
                                d.date.slice(0, 10)
                              }
                            >
                              <b>{d.total}</b>
                              <small>{d.open} open</small>
                            </Link>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataState>
          </section>
        ) : (
          <div className="hr-grid two">
            <section className="sa-panel">
              <h3>
                {id && day
                  ? "Day detail"
                  : section === "coverage"
                    ? "Coverage & responsibilities"
                    : "People team"}
              </h3>
              <input
                className="nv-input"
                placeholder="Search HR team"
                aria-label="Search HR team"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              {members.map((m) => (
                <Link
                  className="hr-list-row"
                  key={m._id}
                  href={"/team/members/" + m.user_id}
                >
                  <div>
                    <strong>{m.name}</strong>
                    <small>{m.title}</small>
                  </div>
                  <Badge>{m.status}</Badge>
                  <small>
                    {
                      q.data?.tasks.filter(
                        (t) =>
                          t.assignee_id?._id === m.user_id &&
                          !["done", "cancelled"].includes(t.status),
                      ).length
                    }{" "}
                    open tasks
                  </small>
                </Link>
              ))}
              {id &&
                day &&
                tasks.map((t) => (
                  <Link
                    className="hr-list-row"
                    key={t._id}
                    href={"/tasks/" + t._id}
                  >
                    <strong>{t.title}</strong>
                    <Badge>{t.status}</Badge>
                  </Link>
                ))}
              {!members.length && (
                <Empty title="No direct HR reports in this scope" />
              )}
            </section>
            <section className="sa-panel">
              <h3>
                {section === "performance"
                  ? "Evidence & coaching follow-up"
                  : section === "approvals"
                    ? "Delegated review boundaries"
                    : "Assigned work"}
              </h3>
              {tasks.slice(0, 12).map((t) => (
                <Link
                  className="hr-list-row"
                  key={t._id}
                  href={"/tasks/" + t._id}
                >
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {t.assignee_id?.name} / {date(t.dueDate)}
                    </small>
                  </div>
                  <Badge>{t.status}</Badge>
                </Link>
              ))}
              {!tasks.length && (
                <p className="nv-caption">No shared tasks in this scope.</p>
              )}
              <p className="nv-caption">
                Population and sensitive-record access remain independently
                assigned. Private tasks and conversations remain private.
              </p>
              {section === "approvals" && (
                <Button href="/workspace/requests">
                  Open your people requests
                </Button>
              )}
            </section>
          </div>
        )}
        <p className="hr-source">
          Source: canonical Tasks / Direct HR reports only / {ctx.data?.name}
        </p>
      </DataState>
    </div>
  );
}
type Flow = {
  _id: string;
  run_code: string;
  name: string;
  status: string;
  template_key: string;
  input: { member_id: string; purpose: string; description: string };
  approval_id?: { _id: string; status: string };
  createdAt: string;
};
function Workflows({ id }: { id?: string }) {
  const router = useRouter();
  const q = useSupport<{
      templates: { key: string; name: string; description: string }[];
      runs: Flow[];
    }>("/people-workflows"),
    m = useSupportMutation<Flow>();
  const [template, setTemplate] = useState<string>(),
    [preview, setPreview] = useState<Record<string, FormDataEntryValue>>();
  const flow = q.data?.runs.find((f) => f._id === id),
    people = useSupport<{ _id: string; name: string }[]>("/people");
  return (
    <div className="sa-page">
      <HrHead
        title={flow?.name || "Workflows"}
        description="Guided people processes with explicit scope, evidence and independent review."
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {flow ? (
          <div className="hr-grid two">
            <section className="sa-panel">
              <h3>Request context</h3>
              <p>{flow.input.description}</p>
              <p>Purpose: {flow.input.purpose}</p>
              <p>Member reference: {flow.input.member_id}</p>
              <p>Workflow reference: {flow.run_code}</p>
              <Badge>{flow.status}</Badge>
              {flow.status === "draft" && (
                <Button
                  disabled={m.isPending}
                  onClick={async () => {
                    try {
                      await m.mutateAsync({
                        path: "/people-workflows/" + flow._id + "/submit",
                        body: {},
                      });
                      q.refetch();
                    } catch {
                      /* The mutation displays the server error. Keep this state available for correction or retry. */
                    }
                  }}
                >
                  Confirm & submit for review
                </Button>
              )}
            </section>
            <section className="sa-panel">
              <h3>Approval summary</h3>
              <Badge>{flow.approval_id?.status || "Not submitted"}</Badge>
              <p>
                Review submission coordinates a proposal. The owning People /
                IAM / Finance service must return verified execution evidence
                before completion.
              </p>
            </section>
          </div>
        ) : (
          <>
            <h3>People operations</h3>
            <div className="hr-grid three">
              {q.data?.templates.map((t) => (
                <button
                  key={t.key}
                  className="sa-panel hr-tool"
                  onClick={() => setTemplate(t.key)}
                >
                  <h3>{t.name}</h3>
                  <p className="nv-caption">{t.description}</p>
                  <small>Start guided workflow</small>
                </button>
              ))}
            </div>
            <section className="sa-panel">
              <h3>Recent workflows</h3>
              {q.data?.runs.map((f) => (
                <Link
                  className="hr-list-row"
                  href={"/workflows/" + f._id}
                  key={f._id}
                >
                  <div>
                    <strong>{f.name}</strong>
                    <small>
                      {f.run_code} / {date(f.createdAt)}
                    </small>
                  </div>
                  <Badge>{f.status}</Badge>
                </Link>
              ))}
              {!q.data?.runs.length && <Empty title="No workflow runs yet" />}
            </section>
          </>
        )}
      </DataState>
      <Modal
        open={!!template}
        onClose={() => {
          setTemplate(undefined);
          setPreview(undefined);
        }}
        title={preview ? "Review workflow" : "Start people workflow"}
      >
        {preview ? (
          <>
            <dl className="hr-facts">
              {Object.entries(preview).map(([k, v]) => (
                <div className="hr-fact" key={k}>
                  <dt>{label(k)}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
            <Button
              primary
              disabled={m.isPending}
              onClick={async () => {
                try {
                  const f = await m.mutateAsync({
                    path: "/people-workflows",
                    body: { ...preview, template_key: template },
                  });
                  setTemplate(undefined);
                  setPreview(undefined);
                  router.push("/workflows/" + f._id);
                } catch {
                  /* The mutation displays the server error. Keep this state available for correction or retry. */
                }
              }}
            >
              Create draft
            </Button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPreview(Object.fromEntries(new FormData(e.currentTarget)));
            }}
          >
            <Field
              name="member_id"
              label="Member"
              required
              options={(people.data || []).map((p) => ({
                value: p._id,
                label: p.name,
              }))}
            />
            <Field
              name="purpose"
              label="Purpose"
              required
              defaultValue="people_operations"
            />
            <Field
              name="description"
              label="Required outcome, dates and evidence"
              type="textarea"
              required
            />
            <Button type="submit">Preview draft</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
function TeamLearning({ id }: { id?: string }) {
  const q = useSupport<
    {
      _id: string;
      learner: { _id: string; name: string };
      course_id: { title: string };
      state: string;
      dueAt?: string;
      completedAt?: string;
      certificate_id?: { expiresAt?: string };
    }[]
  >("/learning/team");
  const rows = q.data?.filter((x) => !id || x.learner._id === id) || [];
  return (
    <div className="sa-page">
      <HrHead
        title={
          id
            ? rows[0]?.learner.name || "Employee learning record"
            : "Team Progress"
        }
        description="Population-scoped compliance evidence from Learn. Private learning behavior remains protected."
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <Stats
          items={[
            ["Assignments", rows.length],
            ["Completed", rows.filter((x) => x.state === "completed").length],
            [
              "Overdue",
              rows.filter(
                (x) =>
                  x.state !== "completed" &&
                  x.dueAt &&
                  new Date(x.dueAt) < new Date(),
              ).length,
            ],
            [
              "Required follow-up",
              rows.filter((x) => x.state !== "completed").length,
            ],
          ]}
        />
        <section className="sa-panel">
          <h3>Learning compliance</h3>
          {rows.map((x) => (
            <Link
              key={x._id}
              className="hr-list-row"
              href={"/learn/team/" + x.learner._id}
            >
              <div>
                <strong>{x.learner.name}</strong>
                <small>
                  {x.course_id?.title} / Due {date(x.dueAt)}
                </small>
              </div>
              <Badge>{x.state}</Badge>
              <small>
                {x.certificate_id?.expiresAt
                  ? "Certificate valid to " + date(x.certificate_id.expiresAt)
                  : ""}
              </small>
            </Link>
          ))}
          {!rows.length && <Empty title="No learning assignments in scope" />}
        </section>
      </DataState>
    </div>
  );
}
