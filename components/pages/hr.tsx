"use client";
import { useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  ArrowUpRight,
  Users,
  FileText,
  Image,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  DataState,
  Empty,
  Field,
  Modal,
  Badge,
} from "@/components/novya/ui";
import { date, time, useSupport, useSupportMutation } from "@/lib/support";
import { label } from "@/lib/format";
import api from "@/lib/axios";
import { AddEmployee } from "./hr-actions";
import { peopleNav } from "@/components/novya/nav";
import { PEOPLE_PURPOSES as PURPOSES, resolvePeoplePurpose, peoplePurposeHref } from "@/lib/people-purpose";
type Ref = { _id: string; name?: string; title?: string };
type Person = {
  _id: string;
  name: string;
  email: string;
  title: string;
  status: string;
  department_id?: Ref;
  manager_id?: Ref;
  employment?: Record<string, string | number>;
  compensation?: Record<string, string | number>;
  activity?: { _id: string; action: string; createdAt: string }[];
  capabilities?: string[];
};
type Task = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee_id?: Ref;
};
type Journey = {
  _id: string;
  kind: string;
  member_id?: Ref;
  status: string;
  progress: number;
  tasks: {
    _id: string;
    label: string;
    owner?: string;
    dueDate?: string;
    done: boolean;
  }[];
};
type Request = {
  _id: string;
  title: string;
  kind: string;
  description?: string;
  purpose?: string;
  createdAt: string;
  request_code: string;
  member_id?: Ref;
  status: string;
  approval_id?: { _id: string; status: string };
};
type Overview = {
  people: Person[];
  journeys: Journey[];
  tasks: Task[];
  events: { _id: string; title: string; startsAt: string }[];
  requests: Request[];
  refreshedAt: string;
};
export function HrHead({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="sa-head">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="hr-actions">{actions}</div>
    </div>
  );
}
export function Stats({ items }: { items: [string, ReactNode, string?][] }) {
  return (
    <div className={"sa-stats " + (items.length === 4 ? "four" : "")}>
      {items.map(([name, value, note]) => (
        <div className="sa-stat" key={name}>
          <small className="sw-cap">{name}</small>
          <b>{value}</b>
          <span>{note || "Within your current scope"}</span>
        </div>
      ))}
    </div>
  );
}
function Row({
  title,
  detail,
  href,
  status,
}: {
  title: string;
  detail?: string;
  href?: string;
  status?: string;
}) {
  const body = (
    <>
      <div>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </div>
      {status && <Badge>{status}</Badge>}
      {href && <ArrowUpRight size={13} />}
    </>
  );
  return href ? (
    <Link className="hr-list-row" href={href}>
      {body}
    </Link>
  ) : (
    <div className="hr-list-row">{body}</div>
  );
}
export function HrOverview({
  workspace = false,
  hub = false,
}: {
  workspace?: boolean;
  hub?: boolean;
}) {
  const q = useSupport<Overview>("/overview"),
    { data: session } = useSession(),
    d = q.data;
  const open = d?.tasks.length || 0,
    pending =
      d?.requests.filter((x) => x.approval_id?.status === "pending").length ||
      0,
    active = d?.journeys.filter((x) => x.status === "in_progress") || [];
  return (
    <div className="sa-page hr-page">
      <HrHead
        title={
          hub
            ? "HR Hub"
            : workspace
              ? "Workspace"
              : `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${session?.user?.name?.split(" ")[0] || "there"}`
        }
        description={
          hub
            ? "People operations. Authorized and connected in one place."
            : workspace
              ? "People records, processes and shared files in one place."
              : "Your people priorities, requests and HR processes in one focused workspace."
        }
        actions={
          <>
            <Badge>HR / People Operations</Badge>
            <Button href="/tasks/new" ariaLabel="Create task">
              <Plus size={15} />
            </Button>
          </>
        }
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {d && (
          <>
            <div className="hr-overview-grid">
              <section className="sa-panel hr-focus">
                <div className="hr-panel-head">
                  <h3>Today&apos;s HR focus</h3>
                  <small>Updated {time(d.refreshedAt)}</small>
                </div>
                <h2>{open} active</h2>
                <p className="nv-caption">
                  Assigned personal tasks requiring follow-up / bar: in-progress
                  share
                </p>
                <div className="hr-progress">
                  <i
                    style={{
                      width: `${open ? Math.round((d.tasks.filter((t) => t.status === "in_progress").length / open) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="hr-mini-stats">
                  <div>
                    <b>
                      {d.tasks.filter((t) => t.status === "blocked").length}
                    </b>
                    <small>Blocked</small>
                  </div>
                  <div>
                    <b>{pending}</b>
                    <small>Pending requests</small>
                  </div>
                  <div>
                    <b>{active.length}</b>
                    <small>Active journeys</small>
                  </div>
                </div>
              </section>
              <section className="sa-panel">
                <div className="hr-panel-head">
                  <h3>Today</h3>
                  <Button href="/calendar">Open Calendar</Button>
                </div>
                {d.events.map((e) => (
                  <Row
                    key={e._id}
                    title={e.title}
                    detail={date(e.startsAt) + " / " + time(e.startsAt)}
                    href="/calendar"
                  />
                ))}
                {!d.events.length && (
                  <p className="nv-caption">
                    No upcoming events in your calendar.
                  </p>
                )}
              </section>
              <section className="sa-panel">
                <div className="hr-panel-head">
                  <h3>My HR work</h3>
                  <Button href="/tasks">View all tasks</Button>
                </div>
                <Stats
                  items={[
                    ["People", d.people.length],
                    ["Requests", pending],
                    [
                      "Onboarding",
                      active.filter((x) => x.kind === "onboarding").length,
                    ],
                    [
                      "Offboarding",
                      active.filter((x) => x.kind === "offboarding").length,
                    ],
                  ]}
                />
                <h3>Priority HR work</h3>
                {d.tasks.map((t) => (
                  <Row
                    key={t._id}
                    title={t.title}
                    detail={
                      t.dueDate ? "Due " + date(t.dueDate) : "No due date"
                    }
                    status={t.status}
                    href={"/tasks/" + t._id}
                  />
                ))}
                {!d.tasks.length && (
                  <Empty
                    title="You are up to date"
                    description="Your assigned follow-up work will appear here."
                  />
                )}
              </section>
              <section className="sa-panel">
                <h3>HR operations</h3>
                {[
                  ["People Operations", "/workspace/people", d.people.length],
                  ["Recruiting", "/workspace/recruiting", "Open"],
                  ["Onboarding", "/workspace/onboarding", active.length],
                  ["Requests", "/workspace/requests", pending],
                ].map(([name, href, count]) => (
                  <Row
                    key={name}
                    title={String(name)}
                    detail={String(count) + " in scope"}
                    href={String(href)}
                  />
                ))}
                <h3 style={{ marginTop: 24 }}>People readiness</h3>
                <p className="nv-caption">
                  Readiness comes from verified journey dependencies.
                </p>
                <div className="hr-progress">
                  <i
                    style={{
                      width:
                        (active.length
                          ? Math.round(
                              active.reduce((s, x) => s + x.progress, 0) /
                                active.length,
                            )
                          : 0) + "%",
                    }}
                  />
                </div>
                <Button href="/workspace/onboarding">View journeys</Button>
              </section>
            </div>
            {(workspace || hub) && (
              <>
                <h3>Workspace tools</h3>
                <div className="hr-grid three">
                  {(hub
                    ? peopleNav.slice(1)
                    : [
                        {
                          href: "/workspace/hub",
                          label: "HR Hub",
                          icon: Users,
                        },
                        {
                          href: "/workspace/office",
                          label: "Office",
                          icon: FileText,
                        },
                        {
                          href: "/workspace/media",
                          label: "Media",
                          icon: Image,
                        },
                      ]
                  ).map((x) => (
                    <Link
                      key={x.href}
                      href={x.href}
                      className="sa-panel hr-tool"
                    >
                      <x.icon size={22} />
                      <h3>{x.label}</h3>
                      <p className="nv-caption">
                        Open your authorized {x.label.toLowerCase()} workspace
                      </p>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                </div>
              </>
            )}
            <p className="hr-source">
              Source: canonical People Hub, personal Tasks and Calendar /
              Current assigned scope / Refreshed{" "}
              {new Date(d.refreshedAt).toLocaleString()}
            </p>
          </>
        )}
      </DataState>
    </div>
  );
}
export function usePeople<T>(path: string, purpose: string) {
  return useQuery({
    queryKey: ["hr", path, purpose],
    queryFn: async () =>
      (
        await api.get("/hr-experience" + path, {
          headers: { "X-People-Purpose": purpose },
        })
      ).data.data as T,
  });
}
export function PeopleHub({
  section = "hub",
  id,
  tab,
}: {
  section?: string;
  id?: string;
  tab?: string;
}) {
  const router = useRouter(), pathname = usePathname(), searchParams = useSearchParams();
  const defaultPurpose = section === "recruiting"
      ? "recruiting"
      : section === "absences"
        ? "absence_review"
        : section === "performance"
          ? "performance_review"
          : section === "people" && !tab
            ? "directory"
            : "people_operations";
  const purpose = resolvePeoplePurpose(searchParams.get("purpose"), defaultPurpose);
  function setPurpose(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("purpose", resolvePeoplePurpose(value, defaultPurpose));
    router.replace(pathname + "?" + params.toString(), { scroll: false });
  }
  return (
    <div className="sa-page hr-page">
      <div className="hr-purpose">
        <ShieldCheck size={13} />
        <span>Access purpose</span>
        <select
          aria-label="Access purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        >
          {PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <small>Visibility follows your current assignment</small>
      </div>
      {section === "people" ? (
        id ? (
          <MemberDetail id={id} tab={tab} purpose={purpose} />
        ) : (
          <PeopleDirectory purpose={purpose} />
        )
      ) : section === "departments" ? (
        <Departments id={id} purpose={purpose} />
      ) : section === "recruiting" ? (
        <Recruiting id={id} purpose={purpose} />
      ) : section === "onboarding" ? (
        <Journeys id={id} purpose={purpose} />
      ) : section === "requests" ? (
        <Requests id={id} purpose={purpose} />
      ) : section === "absences" ? (
        <Absences purpose={purpose} />
      ) : section === "performance" ? (
        <Reviews id={id} purpose={purpose} />
      ) : section === "roles" ? (
        <Roles purpose={purpose} />
      ) : (
        <HrOverview hub />
      )}
    </div>
  );
}
function PeopleDirectory({ purpose }: { purpose: string }) {
  const ctx = useSupport<{ permissions: string[] }>("/context");
  const q = usePeople<Person[]>("/people", purpose);
  const [term, setTerm] = useState(""),
    [status, setStatus] = useState("all");
  const list =
    q.data?.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        [p.name, p.email, p.title, p.department_id?.name]
          .join(" ")
          .toLowerCase()
          .includes(term.toLowerCase()),
    ) || [];
  return (
    <>
      <HrHead
        title="People"
        description="Workforce records and employment context in your assigned population."
        actions={
          <>
            {ctx.data?.permissions.includes("people.create") && <AddEmployee />}
            <Button href="/workspace/requests/new">
              <Plus size={13} />
              People request
            </Button>
          </>
        }
      />
      <section className="sa-panel">
        <div className="hr-panel-head">
          <h3>Team directory</h3>
          <Badge>{list.length} people</Badge>
        </div>
        <div className="sa-toolbar">
          <label className="sa-search">
            <Search size={13} />
            <input
              aria-label="Search people"
              placeholder="Search name, email, role or department"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </label>
          <select
            className="nv-input"
            aria-label="Employment status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {["active", "invited", "on_leave", "offboarding", "offboarded"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </div>
        <DataState
          pending={q.isPending}
          error={q.error}
          retry={() => q.refetch()}
        >
          <div className="hr-table-wrap">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <Link href={peoplePurposeHref("/workspace/people/" + p._id, purpose)}>
                        <span className="hr-initial">
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                        <strong>{p.name}</strong>
                        <small>{p.email}</small>
                      </Link>
                    </td>
                    <td>{p.title || "Unassigned"}</td>
                    <td>{p.department_id?.name || "-"}</td>
                    <td>{p.manager_id?.name || "-"}</td>
                    <td>
                      <Badge>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!list.length && (
            <Empty
              title="No people in this scope"
              description="Choose an assigned purpose, or contact your authorized population owner."
            />
          )}
        </DataState>
      </section>
    </>
  );
}
function MemberDetail({
  id,
  tab = "overview",
  purpose,
}: {
  id: string;
  tab?: string;
  purpose: string;
}) {
  const q = usePeople<Person>(
      "/people/" + id + "?section=" + encodeURIComponent(tab),
      purpose,
    ),
    p = q.data;
  const tabs = ["overview", "team"];
  return (
    <DataState pending={q.isPending} error={q.error} retry={() => q.refetch()}>
      {p && (
        <>
          <HrHead
            title={p.name}
            description={`${p.title || "Member"} / ${p.department_id?.name || "People"} / ${p._id}`}
            actions={
              <>
                <Badge>{p.status}</Badge>
                <Button href={peoplePurposeHref("/workspace/requests/new?member=" + id, purpose)}>
                  Request change
                </Button>
              </>
            }
          />
          <div className="sa-toolbar">
            {[
              ...tabs,
              ...(p.capabilities || []).filter((x) => !tabs.includes(x)),
            ].map((x) => (
              <Link
                key={x}
                className={"sa-chip " + (tab === x ? "on" : "")}
                href={peoplePurposeHref("/workspace/people/" + id + "/" + x, purpose)}
              >
                {label(x)}
              </Link>
            ))}
          </div>
          <div className="hr-grid two">
            <section className="sa-panel">
              <h3>
                {tab === "team"
                  ? "Team & role"
                  : tab === "employment"
                    ? "Employment details"
                    : "Employment"}
              </h3>
              <dl className="hr-facts">
                <dt>Work name</dt>
                <dd>{p.name}</dd>
                <dt>Title</dt>
                <dd>{p.title || "-"}</dd>
                <dt>Department</dt>
                <dd>{p.department_id?.name || "-"}</dd>
                <dt>Manager</dt>
                <dd>{p.manager_id?.name || "-"}</dd>
                <dt>Status</dt>
                <dd>
                  <Badge>{p.status}</Badge>
                </dd>
                {p.compensation &&
                  Object.entries(p.compensation).map(([key, value]) => (
                    <div className="hr-fact" key={key}>
                      <dt>{label(key)}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                {p.activity?.map((a) => (
                  <div className="hr-fact" key={a._id}>
                    <dt>{date(a.createdAt)}</dt>
                    <dd>{a.action}</dd>
                  </div>
                ))}
                {p.employment &&
                  Object.entries(p.employment).map(([key, value]) => (
                    <div className="hr-fact" key={key}>
                      <dt>{label(key.replace(/([A-Z])/g, " $1"))}</dt>
                      <dd>
                        {key.toLowerCase().includes("date")
                          ? date(String(value))
                          : String(value)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>
            <section className="sa-panel">
              <h3>Profile</h3>
              <dl className="hr-facts">
                <dt>Work email</dt>
                <dd>{p.email}</dd>
                <dt>Member ID</dt>
                <dd>{p._id}</dd>
              </dl>
              <h3>Linked work</h3>
              <Row
                title="People requests"
                detail="Governed changes and returned approval status"
                href="/workspace/requests"
              />
              <Row
                title="Documents"
                detail="Shared files remain in Office"
                href="/workspace/office/docs"
              />
              <Row
                title="Learning"
                detail="Course versions and verified completion"
                href="/learn"
              />
            </section>
          </div>
        </>
      )}
    </DataState>
  );
}
function Departments({ id, purpose }: { id?: string; purpose: string }) {
  const q = usePeople<
    { _id: string; name: string; description?: string; lead_id?: Ref }[]
  >("/departments", purpose);
  const people = usePeople<Person[]>("/people", purpose);
  const list = q.data?.filter((x) => !id || x._id === id) || [];
  return (
    <>
      <HrHead
        title={list.length === 1 && id ? list[0].name : "Departments & Teams"}
        description="Structure, responsibilities and ownership within your authorized workforce."
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <div className="hr-grid three">
          {list.map((d) => (
            <Link
              className="sa-panel hr-tool"
              href={peoplePurposeHref("/workspace/departments/" + d._id, purpose)}
              key={d._id}
            >
              <Users size={20} />
              <h3>{d.name}</h3>
              <p>{d.description}</p>
              <b>
                {people.data?.filter((p) => p.department_id?._id === d._id)
                  .length || 0}{" "}
                members in scope
              </b>
              <p className="nv-caption">
                Lead: {d.lead_id?.name || "Unassigned"}
              </p>
            </Link>
          ))}
        </div>
        {id && (
          <section className="sa-panel">
            <h3>Team & ownership</h3>
            {people.data
              ?.filter((p) => p.department_id?._id === id)
              .map((p) => (
                <Row
                  title={p.name}
                  detail={p.title}
                  href={peoplePurposeHref("/workspace/people/" + p._id, purpose)}
                  key={p._id}
                />
              ))}
          </section>
        )}
        {!list.length && <Empty title="No departments in this scope" />}
      </DataState>
    </>
  );
}
type Candidate = {
  _id: string;
  name: string;
  email?: string;
  stage: string;
  source?: string;
  job_id?: Ref;
  notes?: { text: string; by: string; at: string }[];
  interviews?: {
    at: string;
    interviewer: string;
    kind: string;
    feedback?: string;
  }[];
};
function Recruiting({ id, purpose }: { id?: string; purpose: string }) {
  const q = usePeople<Candidate[] | Candidate>(
      id ? "/candidates/" + id : "/candidates",
      purpose,
    ),
    jobs = usePeople<{ _id: string; title: string; status: string }[]>(
      "/jobs",
      purpose,
    ),
    m = useSupportMutation();
  const rows = Array.isArray(q.data) ? q.data : [],
    c = q.data && !Array.isArray(q.data) ? q.data : null;
  const [note, setNote] = useState("");
  return (
    <>
      <HrHead
        title={c?.name || "Recruiting"}
        description={
          c
            ? `${c.job_id?.title || "Application"} / ${c.email || ""}`
            : "Applications, interview evidence and hiring workflows in your recruiting scope."
        }
        actions={c ? <Badge>{c.stage}</Badge> : undefined}
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {c ? (
          <div className="hr-grid two">
            <section className="sa-panel">
              <h3>Candidate profile</h3>
              <dl className="hr-facts">
                <dt>Candidate</dt>
                <dd>{c.name}</dd>
                <dt>Work contact</dt>
                <dd>{c.email || "-"}</dd>
                <dt>Role</dt>
                <dd>{c.job_id?.title || "-"}</dd>
                <dt>Source</dt>
                <dd>{c.source || "-"}</dd>
              </dl>
              <h3>Evaluation & interview plan</h3>
              {c.interviews?.map((x, i) => (
                <Row
                  key={i}
                  title={x.kind || "Interview"}
                  detail={`${date(x.at)} / ${x.interviewer}`}
                  status="recorded"
                />
              ))}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await m.mutateAsync({
                      path: "/candidates/" + id + "/notes",
                      body: { text: note },
                      headers: { "X-People-Purpose": purpose },
                    });
                    setNote("");
                    q.refetch();
                  } catch {
                    /* Keep the draft when the server rejects the write. */
                  }
                }}
              >
                <Field
                  name="note"
                  label="Panel evidence note"
                  required
                  onChange={setNote}
                />
                <Button type="submit" disabled={m.isPending}>
                  Record note
                </Button>
              </form>
            </section>
            <section className="sa-panel">
              <h3>Panel notes</h3>
              {c.notes?.map((n, i) => (
                <Row
                  key={i}
                  title={n.text}
                  detail={`${n.by} / ${date(n.at)}`}
                />
              ))}
              <p className="nv-caption">
                Hiring outcomes require an explicit authorized panel decision.
                AI does not rank candidates.
              </p>
              <Button href="/calendar">Schedule coordination</Button>
            </section>
          </div>
        ) : (
          <>
            <section className="sa-panel">
              <h3>Hiring pipeline</h3>
              <div className="hr-pipeline">
                {["applied", "screen", "interview", "offer", "hired"].map(
                  (stage) => (
                    <div className="hr-stage" key={stage}>
                      <small>{label(stage)}</small>
                      <h2>{rows.filter((c) => c.stage === stage).length}</h2>
                      <p className="nv-caption">candidates</p>
                      {rows
                        .filter((c) => c.stage === stage)
                        .map((c) => (
                          <Link
                            key={c._id}
                            href={peoplePurposeHref("/workspace/recruiting/" + c._id, purpose)}
                          >
                            {c.name}
                            <small>{c.job_id?.title}</small>
                          </Link>
                        ))}
                    </div>
                  ),
                )}
              </div>
            </section>
            <div className="hr-grid two">
              <section className="sa-panel">
                <h3>Open roles</h3>
                {jobs.data?.map((j) => (
                  <Row key={j._id} title={j.title} status={j.status} />
                ))}
                {!jobs.data?.length && (
                  <p className="nv-caption">
                    No requisitions assigned for this purpose.
                  </p>
                )}
              </section>
              <section className="sa-panel">
                <h3>Hiring attention</h3>
                <Row title="Interview coordination" href="/calendar" />
                <Row title="Communication" href="/inbox" />
                <Row title="Recruiting guidance" href="/learn/knowledge" />
              </section>
            </div>
          </>
        )}
      </DataState>
    </>
  );
}
function Journeys({ id, purpose }: { id?: string; purpose: string }) {
  const q = usePeople<Journey[]>("/onboarding", purpose),
    j = q.data?.find((x) => x._id === id),
    rows = q.data || [];
  return (
    <>
      <HrHead
        title={j?.member_id?.name || "Onboarding & Offboarding"}
        description="Lifecycle cases with independently verified dependencies and owners."
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {j ? (
          <div className="hr-grid two">
            <section className="sa-panel">
              <h3>Journey checklist</h3>
              <div className="hr-progress">
                <i style={{ width: j.progress + "%" }} />
              </div>
              {j.tasks.map((t) => (
                <Row
                  key={t._id}
                  title={t.label}
                  detail={`${t.owner || "Unassigned"} / ${date(t.dueDate)}`}
                  status={t.done ? "completed" : "pending"}
                />
              ))}
            </section>
            <section className="sa-panel">
              <h3>Journey details</h3>
              <dl className="hr-facts">
                <dt>Lifecycle</dt>
                <dd>{label(j.kind)}</dd>
                <dt>Status</dt>
                <dd>
                  <Badge>{j.status}</Badge>
                </dd>
                <dt>Verified progress</dt>
                <dd>{j.progress}%</dd>
              </dl>
              <p className="nv-caption">
                Office, Learn and IAM retain their own evidence. A checklist
                cannot override missing verification.
              </p>
              <Button href={peoplePurposeHref("/workspace/people/" + j.member_id?._id, purpose)}>
                Open member
              </Button>
            </section>
          </div>
        ) : (
          <>
            <Stats
              items={[
                [
                  "Onboarding",
                  rows.filter(
                    (x) =>
                      x.kind === "onboarding" && x.status === "in_progress",
                  ).length,
                ],
                [
                  "Offboarding",
                  rows.filter(
                    (x) =>
                      x.kind === "offboarding" && x.status === "in_progress",
                  ).length,
                ],
                [
                  "Completed",
                  rows.filter((x) => x.status === "completed").length,
                ],
                [
                  "Overdue steps",
                  rows
                    .flatMap((x) => x.tasks)
                    .filter(
                      (t) =>
                        !t.done &&
                        t.dueDate &&
                        new Date(t.dueDate) < new Date(),
                    ).length,
                ],
              ]}
            />
            <section className="sa-panel">
              <h3>Active journeys</h3>
              {rows.map((j) => (
                <Row
                  key={j._id}
                  title={j.member_id?.name || "Member journey"}
                  detail={`${label(j.kind)} / ${j.progress}% verified`}
                  href={peoplePurposeHref("/workspace/onboarding/" + j._id, purpose)}
                  status={j.status}
                />
              ))}
              {!rows.length && <Empty title="No journeys in this scope" />}
            </section>
          </>
        )}
      </DataState>
    </>
  );
}
function Requests({ id, purpose }: { id?: string; purpose: string }) {
  const router = useRouter();
  const q = useSupport<Request[]>("/people-requests"),
    m = useSupportMutation(),
    p = usePeople<Person[]>("/people", purpose);
  const [preview, setPreview] = useState<Record<string, FormDataEntryValue>>();
  const r = q.data?.find((x) => x._id === id);
  if (id === "new")
    return (
      <>
        <HrHead
          title="Create Request"
          description="Preview the exact proposal before submitting for independent domain-owner review."
        />
        <div className="hr-grid two">
          <section className="sa-panel">
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
                options={(p.data || []).map((x) => ({
                  value: x._id,
                  label: x.name,
                }))}
              />
              <Field
                name="kind"
                label="Request type"
                required
                options={[
                  "role_change",
                  "employment_change",
                  "compensation",
                  "access",
                  "document",
                  "other",
                ].map((x) => ({ value: x, label: label(x) }))}
              />
              <Field name="title" label="Title" required />
              <Field
                name="purpose"
                label="Purpose"
                required
                defaultValue={purpose}
              />
              <Field
                name="description"
                label="Proposed change and required evidence"
                type="textarea"
                required
              />
              <Button type="submit" primary>
                Review request
              </Button>
            </form>
          </section>
          <section className="sa-panel">
            <h3>Request preview</h3>
            <p>
              Choose only the minimum necessary information. Approval and
              execution remain separate.
            </p>
            <p className="nv-caption">
              Role and access proposals are reviewed by Admin / Security.
              Compensation execution remains with Finance.
            </p>
          </section>
        </div>
        <Modal
          open={!!preview}
          onClose={() => setPreview(undefined)}
          title="Confirm request"
          description="Review the member, purpose and exact proposed change."
        >
          <dl className="hr-facts">
            {preview &&
              Object.entries(preview).map(([k, v]) => (
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
                await m.mutateAsync({
                  path: "/people-requests",
                  body: preview,
                  headers: { "X-People-Purpose": purpose },
                });
                setPreview(undefined);
                q.refetch();
                router.push("/workspace/requests");
              } catch {
                /* Keep the proposal for correction and retry. */
              }
            }}
          >
            Submit for review
          </Button>
        </Modal>
      </>
    );
  return (
    <>
      <HrHead
        title={r ? r.title : "Requests"}
        description="People-domain proposals linked to the canonical approval record."
        actions={
          <Button href="/workspace/requests/new">
            <Plus size={13} />
            Create request
          </Button>
        }
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {r ? (
          <div className="hr-grid two">
            <section className="sa-panel">
              <h3>Proposed action</h3>
              <p>{r.description}</p>
              <dl className="hr-facts">
                <dt>Member</dt>
                <dd>{r.member_id?.name}</dd>
                <dt>Purpose</dt>
                <dd>{r.purpose}</dd>
                <dt>Request ID</dt>
                <dd>{r.request_code}</dd>
                <dt>Type</dt>
                <dd>{label(r.kind)}</dd>
              </dl>
            </section>
            <section className="sa-panel">
              <h3>Approval summary</h3>
              <Badge>{r.approval_id?.status || r.status}</Badge>
              <p className="nv-caption">
                Approval evidence: {r.approval_id?._id || "Awaiting linkage"}
              </p>
              <p>
                Approved proposals still require the owning domain to confirm
                execution.
              </p>
            </section>
          </div>
        ) : (
          <section className="sa-panel">
            <h3>HR requests</h3>
            {q.data?.map((x) => (
              <Row
                key={x._id}
                title={x.title}
                detail={`${x.member_id?.name || "People"} / ${date(x.createdAt)}`}
                status={x.approval_id?.status || x.status}
                href={"/workspace/requests/" + x._id}
              />
            ))}
            {!q.data?.length && <Empty title="No requests yet" />}
          </section>
        )}
      </DataState>
    </>
  );
}
function Absences({ purpose }: { purpose: string }) {
  type Absence = {
    _id: string;
    member_id?: Ref;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
  };
  const q = usePeople<Absence[]>("/absences", purpose),
    p = usePeople<Person[]>("/people", purpose);
  const [open, setOpen] = useState(false),
    [preview, setPreview] = useState<Record<string, FormDataEntryValue>>(),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <HrHead
        title="Absences"
        description="Leave requests and authorized availability. Decisions remain independent of Calendar."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={13} />
            Record absence
          </Button>
        }
      />
      <section className="sa-panel">
        <h3>Team availability</h3>
        <DataState
          pending={q.isPending}
          error={q.error}
          retry={() => q.refetch()}
        >
          <div className="hr-table-wrap">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Absence</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {q.data?.map((a) => (
                  <tr key={a._id}>
                    <td>{a.member_id?.name}</td>
                    <td>{label(a.type)}</td>
                    <td>{date(a.startDate)}</td>
                    <td>{date(a.endDate)}</td>
                    <td>{a.days}</td>
                    <td>
                      <Badge>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!q.data?.length && <Empty title="No absences in this scope" />}
        </DataState>
      </section>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setPreview(undefined);
        }}
        title={preview ? "Confirm absence request" : "Record absence"}
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
            <p>
              Submitted requests do not change approved availability until an
              independent decision is recorded.
            </p>
            {error && <p role="alert">{error}</p>}
            <Button
              primary
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.post("/hr-experience/absences", preview, {
                    headers: { "X-People-Purpose": purpose },
                  });
                  setOpen(false);
                  setPreview(undefined);
                  q.refetch();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Unable to submit");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Submit request
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
              options={(p.data || []).map((x) => ({
                value: x._id,
                label: x.name,
              }))}
            />
            <Field
              name="type"
              label="Absence type"
              options={["vacation", "unpaid", "parental", "other"].map((x) => ({
                value: x,
                label: label(x),
              }))}
            />
            <Field name="startDate" label="From" type="date" required />
            <Field name="endDate" label="To" type="date" required />
            <Button type="submit">Review request</Button>
          </form>
        )}
      </Modal>
    </>
  );
}
function Reviews({ id, purpose }: { id?: string; purpose: string }) {
  type Review = {
    _id: string;
    member_id?: Ref;
    period: string;
    rating: number;
    status: string;
    strengths?: string;
    improvements?: string;
    goals: { title: string; progress: number; status: string }[];
  };
  const q = usePeople<Review[]>("/reviews", purpose),
    r = q.data?.find((x) => x._id === id);
  return (
    <>
      <HrHead
        title={r ? `${r.period} Review / ${r.member_id?.name}` : "Performance"}
        description="Structured reviews, goals and development evidence in your assigned process scope."
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {r ? (
          <div className="hr-grid two">
            <section className="sa-panel">
              <h3>Goals & outcomes</h3>
              {r.goals.map((g, i) => (
                <div key={i}>
                  <Row title={g.title} status={g.status} />
                  <div className="hr-progress">
                    <i style={{ width: g.progress + "%" }} />
                  </div>
                </div>
              ))}
              <h3>Strengths</h3>
              <p>{r.strengths || "No shared input"}</p>
              <h3>Development</h3>
              <p>{r.improvements || "No shared input"}</p>
            </section>
            <section className="sa-panel">
              <h3>Review summary</h3>
              <Badge>{r.status}</Badge>
              <p>Period: {r.period}</p>
              <p>Recorded rating: {r.rating} / 5</p>
              <p className="nv-caption">
                Source: canonical review. Kora does not decide ratings or
                employment outcomes.
              </p>
            </section>
          </div>
        ) : (
          <section className="sa-panel">
            <h3>Active reviews</h3>
            {q.data?.map((r) => (
              <Row
                key={r._id}
                title={`${r.period} / ${r.member_id?.name || "Member"}`}
                status={r.status}
                href={"/workspace/performance/" + r._id}
              />
            ))}
            {!q.data?.length && (
              <Empty title="No reviews in this purpose and scope" />
            )}
          </section>
        )}
      </DataState>
    </>
  );
}
function Roles({ purpose }: { purpose: string }) {
  const q = usePeople<{ _id: string; name: string; description: string }[]>(
    "/roles",
    purpose,
  );
  return (
    <>
      <HrHead
        title="Roles & Access"
        description="Business role context and governed access requests. IAM owns actual entitlements."
        actions={
          <Button href="/workspace/requests/new">Request access review</Button>
        }
      />
      <div className="hr-grid two">
        <section className="sa-panel">
          <h3>Role directory</h3>
          <DataState
            pending={q.isPending}
            error={q.error}
            retry={() => q.refetch()}
          >
            {q.data?.map((r) => (
              <Row key={r._id} title={r.name} detail={r.description} />
            ))}
            {!q.data?.length && <Empty title="No roles in this scope" />}
          </DataState>
        </section>
        <section className="sa-panel">
          <h3>Access governance</h3>
          <p>
            Confirm job need and desired access package through a Request. Admin
            / Security reviews and provisions access.
          </p>
          <Row
            title="Request access"
            detail="Explicit business context and approval evidence"
            href="/workspace/requests/new"
          />
          <Row
            title="Account & security"
            detail="Your own identity settings"
            href="/settings/security"
          />
        </section>
      </div>
    </>
  );
}
