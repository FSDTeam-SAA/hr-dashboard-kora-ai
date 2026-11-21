"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Button,
  DataState,
  Empty,
  Field,
  Modal,
  Badge,
} from "@/components/novya/ui";
import {
  useSupport,
  useSupportMutation,
  date,
  type SupportContext,
} from "@/lib/support";
import { label } from "@/lib/format";
import { HrHead, Stats } from "./hr";
type Ref = { _id: string; name: string };
type Coverage = {
  _id: string;
  name: string;
  primary_id: Ref;
  backup_id?: Ref;
  startsAt: string;
  endsAt: string;
  revision: number;
};
type Coaching = {
  _id: string;
  goal: string;
  member_id: Ref;
  evidenceRef: string;
  dueAt?: string;
  status: string;
};
export function CoveragePage() {
  const q = useSupport<Coverage[]>("/team/coverage"),
    ctx = useSupport<SupportContext>("/context"),
    m = useSupportMutation();
  const [open, setOpen] = useState(false),
    [preview, setPreview] = useState<Record<string, FormDataEntryValue>>();
  return (
    <div className="sa-page">
      <HrHead
        title="Coverage"
        description="Direct HR-team ownership, backup and conflict-aware allocation."
        actions={
          <Button onClick={() => setOpen(true)}>Configure coverage</Button>
        }
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <Stats
          items={[
            ["Workstreams", q.data?.length || 0],
            ["With backup", q.data?.filter((x) => x.backup_id).length || 0],
            [
              "Active now",
              q.data?.filter(
                (x) =>
                  new Date(x.startsAt) <= new Date() &&
                  new Date(x.endsAt) >= new Date(),
              ).length || 0,
            ],
            ["HR specialists", ctx.data?.members.length || 0],
          ]}
        />
        <section className="sa-panel">
          <h3>Coverage & ownership</h3>
          <div className="hr-table-wrap">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Workstream</th>
                  <th>Primary owner</th>
                  <th>Backup</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {q.data?.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.primary_id?.name}</td>
                    <td>{c.backup_id?.name || "Unassigned"}</td>
                    <td>{date(c.startsAt)}</td>
                    <td>{date(c.endsAt)}</td>
                    <td>
                      <Badge>
                        {new Date(c.endsAt) < new Date()
                          ? "ended"
                          : new Date(c.startsAt) > new Date()
                            ? "scheduled"
                            : "active"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!q.data?.length && <Empty title="No coverage assignments yet" />}
        </section>
      </DataState>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setPreview(undefined);
        }}
        title={preview ? "Confirm coverage" : "Configure coverage"}
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
            <p className="nv-caption">
              Assigning coverage does not grant access to protected people
              records.
            </p>
            <Button
              primary
              disabled={m.isPending}
              onClick={async () => {
                try {
                  await m.mutateAsync({
                    path: "/team/coverage",
                    body: preview,
                  });
                  setOpen(false);
                  setPreview(undefined);
                } catch {
                  /* The mutation displays the server's actionable error. */
                }
              }}
            >
              Assign coverage
            </Button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPreview(Object.fromEntries(new FormData(e.currentTarget)));
            }}
          >
            <Field name="name" label="Workstream" required />
            <Field
              name="primary_id"
              label="Primary owner"
              required
              options={
                ctx.data?.members.map((x) => ({
                  value: x.user_id,
                  label: x.name,
                })) || []
              }
            />
            <Field
              name="backup_id"
              label="Backup owner"
              options={[
                { value: "", label: "No backup" },
                ...(ctx.data?.members.map((x) => ({
                  value: x.user_id,
                  label: x.name,
                })) || []),
              ]}
            />
            <Field
              name="startsAt"
              label="From"
              type="datetime-local"
              required
            />
            <Field name="endsAt" label="To" type="datetime-local" required />
            <Button type="submit">Review coverage</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
export function CoachingPage() {
  const q = useSupport<Coaching[]>("/team/coaching"),
    ctx = useSupport<SupportContext>("/context"),
    m = useSupportMutation();
  const [open, setOpen] = useState(false);
  return (
    <div className="sa-page">
      <HrHead
        title="Performance & Coaching"
        description="Evidence-linked development for your direct HR team."
        actions={
          <Button onClick={() => setOpen(true)}>Create coaching goal</Button>
        }
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <Stats
          items={[
            ["Coaching goals", q.data?.length || 0],
            ["Open", q.data?.filter((x) => x.status === "open").length || 0],
            [
              "Completed",
              q.data?.filter((x) => x.status === "completed").length || 0,
            ],
            [
              "Overdue",
              q.data?.filter(
                (x) =>
                  x.status === "open" &&
                  x.dueAt &&
                  new Date(x.dueAt) < new Date(),
              ).length || 0,
            ],
          ]}
        />
        <section className="sa-panel">
          <h3>Quality & development</h3>
          {q.data?.map((c) => (
            <div className="hr-list-row" key={c._id}>
              <div>
                <strong>{c.goal}</strong>
                <small>
                  {c.member_id?.name} / {date(c.dueAt)}
                </small>
                <small>Evidence reference: {c.evidenceRef}</small>
              </div>
              <Badge>{c.status}</Badge>
              <Button
                disabled={m.isPending}
                onClick={() =>
                  m.mutate({
                    path: "/team/coaching/" + c._id,
                    method: "patch",
                    body: {
                      status: c.status === "open" ? "completed" : "open",
                    },
                  })
                }
              >
                {c.status === "open" ? "Complete" : "Reopen"}
              </Button>
            </div>
          ))}
          {!q.data?.length && <Empty title="No coaching goals yet" />}
        </section>
      </DataState>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create coaching goal"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const body = Object.fromEntries(new FormData(e.currentTarget));
            try {
              await m.mutateAsync({ path: "/team/coaching", body });
              setOpen(false);
            } catch {
              /* The mutation displays the error. */
            }
          }}
        >
          <Field
            name="member_id"
            label="HR specialist"
            required
            options={
              ctx.data?.members.map((x) => ({ value: x._id, label: x.name })) ||
              []
            }
          />
          <Field
            name="goal"
            label="Expected development outcome"
            type="textarea"
            required
          />
          <Field
            name="evidenceRef"
            label="Canonical evidence reference"
            required
          />
          <Field name="dueAt" label="Review date" type="date" />
          <Button type="submit" primary disabled={m.isPending}>
            Save goal
          </Button>
        </form>
      </Modal>
    </div>
  );
}
export function HrReviewsPage() {
  const q = useSupport<{
    members: Ref[];
    tasks: { _id: string; title: string; status: string; assignee_id?: Ref }[];
  }>("/team");
  return (
    <div className="sa-page">
      <HrHead
        title="Reviews"
        description="Operational review follow-up across your direct HR team."
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <section className="sa-panel">
          <h3>Work review board</h3>
          <div className="hr-pipeline">
            {["todo", "in_progress", "blocked", "deferred", "done"].map((s) => (
              <div className="hr-stage" key={s}>
                <h3>{label(s)}</h3>
                {q.data?.tasks
                  .filter((t) => t.status === s)
                  .map((t) => (
                    <Link key={t._id} href={"/tasks/" + t._id}>
                      {t.title}
                      <small>{t.assignee_id?.name}</small>
                    </Link>
                  ))}
              </div>
            ))}
          </div>
        </section>
      </DataState>
    </div>
  );
}
