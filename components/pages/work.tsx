"use client";
// HR personal and assigned tasks (design p23–p25, p92–p95).
import { useKora } from "@/components/novya/kora";
import { Button, DataState, Empty, Field, Modal } from "@/components/novya/ui";
import api from "@/lib/axios";
import { errorMessage, label } from "@/lib/format";
import { date, supportPath, time, useSupport, useSupportMutation, type Doc } from "@/lib/support";
import { asArray } from "@/lib/utils";
import { ArrowLeft, Check, MoreHorizontal, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

type Person = { _id: string; name: string } | string | null | undefined;
const nameOf = (p: Person) => (p && typeof p === "object" ? p.name : "");
const S = (v: unknown) => String(v ?? "");

function Head({ title, description, actions, crumb }: { title: string; description: string; actions?: ReactNode; crumb?: ReactNode }) {
  return (
    <div className="sa-head">
      <div>{crumb}<h1>{title}</h1><p>{description}</p></div>
      {actions && <div className="sw-actions">{actions}</div>}
    </div>
  );
}

/* =============================== TASKS =============================== */
type Task = Doc & { title: string; description?: string; status: string; priority: string; dueDate?: string; source?: string; assignee_id?: Person; assignedBy?: Person; subtasks?: { title: string; done: boolean }[]; comments?: { authorName?: string; text: string; at?: string }[]; history?: { status?: string; at?: string; reason?: string }[]; links?: { type: string; ref: string; label: string }[] };
type TaskList = { items: Task[]; stats: { open: number; dueToday: number; overdue: number; completed: number }; sources: { self: number; kora: number; lead: number; system: number } };
const pill = (t: Task) => (t.status === "done" ? "Done" : t.status === "in_progress" ? "In progress" : t.priority === "high" || t.priority === "urgent" ? "High" : t.dueDate && new Date(t.dueDate) > new Date(Date.now() + 86400000) ? "Planned" : label(t.status === "todo" ? "upcoming" : t.status));

export function TasksPage({ id, mine = true }: { id?: string; mine?: boolean }) {
  if (id === "new") return <CreateTask />;
  if (id) return <TaskDetail id={id} />;
  return <MyTasks mine={mine} />;
}

function TaskRow({ t, onToggle }: { t: Task; onToggle: () => void }) {
  return (
    <div className="sw-task">
      <button className={`sw-check ${t.status === "done" ? "on" : ""}`} onClick={onToggle} aria-label="Toggle complete">{t.status === "done" && <Check size={11} />}</button>
      <Link href={`/tasks/${t._id}`} className="sw-task-main">
        <b>{t.title}</b>
        <small>Due {t.dueDate ? `${date(t.dueDate)} ${time(t.dueDate)}` : "—"} · {t.source === "kora" ? "Kora" : nameOf(t.assignedBy) && nameOf(t.assignedBy) !== nameOf(t.assignee_id) ? "Teamleader" : "Self"}</small>
      </Link>
      <span className={`sw-pill ${pill(t) === "High" ? "amber" : ""}`}>{pill(t)}</span>
      <MoreHorizontal size={14} className="sw-faint" />
    </div>
  );
}

function MyTasks({ mine }: { mine: boolean }) {
  const [view, setView] = useState<"today" | "upcoming" | "all" | "completed">("today");
  const [q, setQ] = useState("");
  const kora = useKora();
  const all = useSupport<TaskList>(`/tasks?view=all${q ? `&q=${encodeURIComponent(q)}` : ""}`);
  const m = useSupportMutation();
  const items = asArray<Task>(all.data?.items);
  const today = items.filter((t) => t.status !== "done" && t.status !== "cancelled" && t.dueDate && new Date(t.dueDate) <= new Date(new Date().setHours(23, 59, 59)));
  const upcoming = items.filter((t) => t.status !== "done" && t.status !== "cancelled" && (!t.dueDate || new Date(t.dueDate) > new Date(new Date().setHours(23, 59, 59))));
  const list = view === "today" ? today : view === "upcoming" ? upcoming : view === "completed" ? items.filter((t) => t.status === "done") : items;
  const s = all.data?.stats;
  const focus = today[0];
  const toggle = (t: Task) => m.mutate({ path: `/tasks/${t._id}`, method: "patch", body: { status: t.status === "done" ? "todo" : "done" } });
  return (
    <div className="sa-page">
      <Head title="My Tasks" description="Tasks you created, received or asked Kora to plan for you." actions={<><span className="sw-tag">Personal workspace</span>{!mine && null}<Button href="/tasks/new"><Plus size={13} /> New task</Button></>} />
      <div className="sa-stats four">
        <div className="sa-stat"><small className="sw-cap">Open</small><b>{s?.open ?? "–"}</b><span>Across your current priorities</span></div>
        <div className="sa-stat"><small className="sw-cap">Due today</small><b>{s?.dueToday ?? "–"}</b><span className="amber">{s?.dueToday ? `${s.dueToday} need attention` : "Nothing due"}</span></div>
        <div className="sa-stat"><small className="sw-cap">Overdue</small><b>{s?.overdue ?? "–"}</b><span className="red">{s?.overdue ? "Needs follow-up" : "All on time"}</span></div>
        <div className="sa-stat"><small className="sw-cap">Completed</small><b>{s?.completed ?? "–"}</b><span className="green">This week</span></div>
      </div>
      <div className="sa-toolbar">
        {(["today", "upcoming", "all", "completed"] as const).map((v) => <button key={v} className={`sa-chip ${view === v ? "on" : ""}`} onClick={() => setView(v)}>{label(v)}</button>)}
        <label className="sa-search" style={{ maxWidth: 280 }}><Search size={13} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks or linked records" /></label>
      </div>
      <DataState pending={all.isPending} error={all.error} retry={() => all.refetch()}>
        <div className="sa-split">
          <section className="sa-panel">
            {view === "today" ? (
              <>
                <h3 className="sw-h3">Today</h3><p className="sw-sub">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {today.length} open tasks</p>
                <div className="sw-tasks">{today.map((t) => <TaskRow key={t._id} t={t} onToggle={() => toggle(t)} />)}{!today.length && <p className="nv-caption">Nothing due today.</p>}</div>
                <h3 className="sw-h3" style={{ marginTop: 22 }}>Upcoming</h3>
                <div className="sw-tasks">{upcoming.slice(0, 6).map((t) => <TaskRow key={t._id} t={t} onToggle={() => toggle(t)} />)}</div>
              </>
            ) : (
              <div className="sw-tasks">{list.map((t) => <TaskRow key={t._id} t={t} onToggle={() => toggle(t)} />)}{!list.length && <Empty title="No tasks" description="Create a task or ask Kora to plan one." />}</div>
            )}
          </section>
          <aside className="sw-stack">
            <section className="sa-panel">
              <h3 className="sw-h3">Today&apos;s focus</h3>
              <p className="sw-sub">{today.filter((t) => t.status === "done").length} of {today.length} tasks completed</p>
              <div className="sw-bar"><i style={{ width: `${today.length ? 100 - (today.length / Math.max(1, items.length)) * 100 : 100}%` }} /></div>
              {focus && <><div className="sw-cap" style={{ marginTop: 16 }}>Next best action</div><b className="sw-b">{focus.title}</b><p className="sw-sub">Kora linked the latest records and context for this task.</p></>}
              <Button onClick={() => kora.openChat()}>Open with Kora</Button>
            </section>
            <section className="sa-panel">
              <h3 className="sw-h3">Task sources</h3><p className="sw-sub">Everything in My Tasks belongs to you.</p>
              <div className="sw-sources">
                <div><span>Created by you</span><b>{all.data?.sources.self ?? 0}</b></div>
                <div><span className="green">Created with Kora</span><b>{all.data?.sources.kora ?? 0}</b></div>
                <div><span className="amber">Assigned by Teamleader</span><b>{all.data?.sources.lead ?? 0}</b></div>
                <div><span>System &amp; learning</span><b>{all.data?.sources.system ?? 0}</b></div>
              </div>
            </section>
          </aside>
        </div>
      </DataState>
    </div>
  );
}

function TaskDetail({ id }: { id: string }) {
  const t = useSupport<Task>(`/tasks/${id}`);
  const m = useSupportMutation();
  const kora = useKora();
  const [note, setNote] = useState("");
  const [defer, setDefer] = useState(false);
  const d = t.data;
  const patch = (body: object) => m.mutate({ path: `/tasks/${id}`, method: "patch", body });
  return (
    <DataState pending={t.isPending} error={t.error} retry={() => t.refetch()}>
      {d && (
        <div className="sa-page">
          <Head
            crumb={<Link href="/tasks" className="sl-back"><ArrowLeft size={12} /> Back to My Tasks</Link>}
            title={d.title}
            description={`Personal task · ${nameOf(d.assignedBy) === nameOf(d.assignee_id) ? "Created by you" : `Assigned by ${nameOf(d.assignedBy)}`} · Updated ${date(S(d.updatedAt))}`}
            actions={<>{d.status !== "done" ? <Button onClick={() => patch({ status: "done" })}><Check size={12} /> Mark complete</Button> : <Button onClick={() => patch({ status: "todo", reason: "Reopened" })}>Reopen</Button>}<Button onClick={() => setDefer(true)}>More</Button></>}
          />
          <div className="sa-split">
            <section className="sa-panel">
              <h3 className="sw-h3">Task overview</h3>
              <p className="sw-sub">{d.description || "No description."}</p>
              {asArray(d.links).length > 0 && <div className="sw-kv">{d.links!.map((l, i) => <div key={i}><span>{label(l.type)}</span><b>{l.label}</b></div>)}</div>}
              <h3 className="sw-h3" style={{ marginTop: 20 }}>Checklist</h3>
              <div className="sw-tasks">
                {asArray<{ title: string; done: boolean }>(d.subtasks).map((s, i) => (
                  <button key={i} className="sw-task" onClick={() => patch({ subtasks: d.subtasks!.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })}>
                    <span className={`sw-check ${s.done ? "on" : ""}`}>{s.done && <Check size={11} />}</span><span className="sw-task-main"><b>{s.title}</b></span>
                  </button>
                ))}
                <form className="sw-inline" onSubmit={(e) => { e.preventDefault(); const v = S(new FormData(e.currentTarget).get("s")).trim(); if (v) patch({ subtasks: [...asArray(d.subtasks), { title: v, done: false }] }); e.currentTarget.reset(); }}>
                  <input className="nv-input" name="s" placeholder="+ Add checklist item" />
                </form>
              </div>
              <h3 className="sw-h3" style={{ marginTop: 20 }}>Notes &amp; activity</h3>
              <div className="sw-timeline">
                {[...asArray<{ authorName?: string; text: string; at?: string }>(d.comments).map((c) => ({ at: c.at, text: `${c.authorName}: ${c.text}` })), ...asArray<{ status?: string; at?: string; reason?: string }>(d.history).map((h) => ({ at: h.at, text: `${label(h.status)}${h.reason ? ` · ${h.reason}` : ""}` }))]
                  .sort((a, b) => new Date(S(b.at)).getTime() - new Date(S(a.at)).getTime())
                  .map((x, i) => <div key={i}><small>{date(x.at)} {time(x.at)}</small><span>{x.text}</span></div>)}
              </div>
              <form className="sw-inline" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { patch({ comment: note }); setNote(""); } }}>
                <input className="nv-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
                <Button type="submit">Add</Button>
              </form>
            </section>
            <aside className="sw-stack">
              <section className="sa-panel">
                <h3 className="sw-h3">Details</h3>
                <div className="sw-kv">
                  <div><span>Status</span><b>{label(d.status)}</b></div>
                  <div><span>Priority</span><b className={d.priority === "high" || d.priority === "urgent" ? "amber" : ""}>{label(d.priority)}</b></div>
                  <div><span>Due</span><b className="amber">{d.dueDate ? `${date(d.dueDate)} · ${time(d.dueDate)}` : "—"}</b></div>
                  <div><span>Owner</span><b>{nameOf(d.assignee_id)}</b></div>
                  <div><span>Source</span><b>{d.source === "kora" ? "Created with Kora" : "Created manually"}</b></div>
                </div>
              </section>
              <section className="sa-panel">
                <h3 className="sw-h3">Work on this with Kora</h3>
                <p className="sw-sub">Kora already has the linked context of this task.</p>
                <div className="sw-chips">{["Review evidence", "Prepare an HR handover", "Prepare a people review"].map((x) => <button key={x} onClick={() => kora.openChat()}>{x}</button>)}</div>
              </section>
            </aside>
          </div>
          <Modal open={defer} onClose={() => setDefer(false)} title="Change task" description="Deferring keeps the original commitment visible.">
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); patch({ status: f.get("status"), dueDate: f.get("dueDate") || undefined, reason: f.get("reason") }); setDefer(false); }}>
              <Field label="Status" name="status" defaultValue="deferred" options={["in_progress", "blocked", "deferred", "cancelled"].map((v) => ({ value: v, label: label(v) }))} />
              <Field label="New due date" name="dueDate" type="datetime-local" />
              <Field label="Reason" name="reason" />
              <div className="nv-modal-footer"><Button onClick={() => setDefer(false)}>Cancel</Button><Button type="submit" primary>Save</Button></div>
            </form>
          </Modal>
        </div>
      )}
    </DataState>
  );
}

export function CreateTask({ team = false }: { team?: boolean }) {
  const router = useRouter();
  const m = useSupportMutation();
  const ctx = useSupport<{ members: { user_id: string; name: string }[]; name: string }>("/context");
  const [kora, setKora] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ title?: string; description?: string }>({});
  const generate = async () => {
    if (!kora.trim()) return;
    setBusy(true);
    try {
      const c = (await api.post(supportPath("/chat"), { message: `Turn this into a single task. Reply exactly as two lines: "Title: …" and "Description: …". Request: ${kora}` })).data.data;
      const reply: string = c.messages.at(-1).content;
      setDraft({ title: /Title:\s*(.+)/i.exec(reply)?.[1]?.replace(/\*/g, "").trim(), description: /Description:\s*([\s\S]+)/i.exec(reply)?.[1]?.replace(/\*/g, "").trim() });
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="sa-page">
      <Head crumb={<Link href={team ? "/team/tasks" : "/tasks"} className="sl-back"><ArrowLeft size={12} /> Back to {team ? "Team Tasks" : "My Tasks"}</Link>} title={team ? "Create & assign task" : "Create personal task"} description={team ? "Create a task for yourself or assign it to members of your HR team." : "Add a task for yourself or let Kora prepare it from context."} />
      <div className="sa-split">
        <form className="sa-panel" key={draft.title || "empty"} onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const t = await m.mutateAsync({ path: "/tasks", body: { title: f.get("title"), description: f.get("description"), dueDate: f.get("dueDate") || undefined, priority: f.get("priority"), assignee_id: f.get("assignee") || undefined, source: draft.title ? "kora" : "manual", links: f.get("context") ? [{ type: "context", ref: S(f.get("context")), label: S(f.get("context")) }] : [] } });
          toast.success("Task created");
          router.push(team ? "/team/tasks" : `/tasks/${t._id}`);
        }}>
          <h3 className="sw-h3">Task setup</h3>
          <Field label="Title" name="title" required defaultValue={draft.title} placeholder="Add a clear task title" />
          <Field label="Description" name="description" type="textarea" defaultValue={draft.description} placeholder="Add details, expected outcome or instructions" />
          <div className="sw-grid2">
            <Field label="Due date" name="dueDate" type="datetime-local" />
            <Field label="Priority" name="priority" defaultValue="medium" options={["low", "medium", "high", "urgent"].map((v) => ({ value: v, label: label(v) }))} />
          </div>
          <Field label="Linked context" name="context" placeholder="Add canonical people or workflow reference" />
          {team ? (
            <Field label="Owner" name="assignee" options={[{ value: "", label: `${ctx.data?.name || "Me"} (you)` }, ...asArray<{ user_id: string; name: string }>(ctx.data?.members).map((x) => ({ value: x.user_id, label: x.name }))]} />
          ) : (
            <div className="sw-owner"><span className="nv-avatar small" /> <b>{ctx.data?.name} · You</b><small>Personal tasks can only be assigned to yourself.</small></div>
          )}
          <div className="nv-modal-footer"><Button href={team ? "/team/tasks" : "/tasks"}>Cancel</Button><Button type="submit" primary disabled={m.isPending}>{team ? "Create & assign" : "Create task"}</Button></div>
        </form>
        <aside className="sw-stack">
          <section className="sa-panel">
            <h3 className="sw-h3">Create with Kora</h3>
            <p className="sw-sub">Describe the outcome. Kora can suggest the title, due date, checklist and links.</p>
            <textarea className="nv-input" rows={4} value={kora} onChange={(e) => setKora(e.target.value)} placeholder="Prepare an onboarding follow-up task" />
            <Button onClick={generate} disabled={busy}>{busy ? "Generating…" : <><Sparkles size={12} /> Generate task draft</>}</Button>
          </section>
          <section className="sa-panel">
            <h3 className="sw-h3">{team ? "Team assignment rules" : "How personal tasks work"}</h3>
            <ul className="sw-rules">{(team ? ["Assigned team members see the task in My Tasks.", "Kora can prepare a draft when you ask.", "You can reassign tasks within your own team.", "Every task keeps its creator and source visible."] : ["You remain the owner of every task here.", "Kora only creates tasks when you ask.", "Teamleader assignments appear automatically.", "Workflow tasks keep their original source."]).map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

