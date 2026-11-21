"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Field,
  Modal,
  DataState,
  Empty,
  Badge,
} from "@/components/novya/ui";
import {
  useSupport,
  useSupportMutation,
  date,
  type SupportContext,
} from "@/lib/support";
import { HrHead } from "./hr";
import { label } from "@/lib/format";
export function AddEmployee() {
  const m = useSupportMutation<{ _id: string }>(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState<Record<string, FormDataEntryValue>>();
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add employee</Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setDraft(undefined);
        }}
        title={draft ? "Review employee record" : "Add employee"}
        description="Create a workforce record. Login invitation and privileged access require their own authorized workflow."
      >
        {draft ? (
          <>
            <dl className="hr-facts">
              {Object.entries(draft).map(([k, v]) => (
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
                  const p = await m.mutateAsync({
                    path: "/people",
                    body: draft,
                  });
                  setOpen(false);
                  router.push("/workspace/people/" + p._id);
                } catch {
                  /* Server error is displayed by the mutation. */
                }
              }}
            >
              Create workforce record
            </Button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDraft(Object.fromEntries(new FormData(e.currentTarget)));
            }}
          >
            <Field name="name" label="Full name" required />
            <Field name="email" label="Work email" type="email" required />
            <Field name="title" label="Job title" required />
            <Field name="startDate" label="Proposed start date" type="date" />
            <Field
              name="workModel"
              label="Work model"
              options={["Remote", "Hybrid", "On-site"].map((x) => ({
                value: x,
                label: x,
              }))}
            />
            <Button type="submit">Review record</Button>
          </form>
        )}
      </Modal>
    </>
  );
}
export function HrApprovalsPage() {
  type Proposal = {
    _id: string;
    title: string;
    kind: string;
    description: string;
    purpose: string;
    member_id?: { name: string };
    createdAt: string;
    approval_id?: { status: string };
  };
  const q = useSupport<Proposal[]>("/team/approvals"),
    ctx = useSupport<SupportContext>("/context"),
    m = useSupportMutation();
  const [proposal, setProposal] = useState<Proposal>();
  return (
    <div className="sa-page">
      <HrHead
        title="Approvals & Escalations"
        description="Delegated, purpose-bound reviews with independent decisions and canonical evidence."
      />
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        <section className="sa-panel">
          <h3>People proposal review queue</h3>
          {q.data?.map((p) => (
            <button
              className="hr-list-row"
              key={p._id}
              onClick={() => setProposal(p)}
            >
              <div>
                <strong>{p.title}</strong>
                <small>
                  {p.member_id?.name} / {label(p.kind)} / {date(p.createdAt)}
                </small>
              </div>
              <Badge>{p.approval_id?.status || "pending"}</Badge>
            </button>
          ))}
          {!q.data?.length && (
            <Empty
              title="No delegated reviews in scope"
              description="Reviews require both the process capability and a current field assignment."
            />
          )}
        </section>
      </DataState>
      <Modal
        open={!!proposal}
        onClose={() => setProposal(undefined)}
        title={proposal?.title || "Review proposal"}
      >
        <p>{proposal?.description}</p>
        <p className="nv-caption">Purpose: {proposal?.purpose}</p>
        <p>
          Approval records the review outcome. The owning domain must return
          verified execution separately.
        </p>
        {ctx.data?.permissions.includes("people.requests.decide") &&
          proposal?.approval_id?.status === "pending" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const body = Object.fromEntries(new FormData(e.currentTarget));
                try {
                  await m.mutateAsync({
                    path: "/team/approvals/" + proposal._id + "/decision",
                    body,
                  });
                  setProposal(undefined);
                } catch {
                  /* Server error is displayed by the mutation. */
                }
              }}
            >
              <Field
                name="decision"
                label="Decision"
                required
                options={[
                  { value: "approve", label: "Approve proposal" },
                  { value: "reject", label: "Reject proposal" },
                ]}
              />
              <Field
                name="note"
                label="Decision evidence"
                type="textarea"
                required
              />
              <Button primary type="submit" disabled={m.isPending}>
                Confirm review decision
              </Button>
            </form>
          )}
      </Modal>
    </div>
  );
}
