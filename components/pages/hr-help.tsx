"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, DataState, Empty, Field, Badge } from "@/components/novya/ui";
import { Markdown } from "@/components/novya/markdown";
import { date, useSupport, useSupportMutation } from "@/lib/support";
import { HrHead } from "./hr";
type Article = {
  _id: string;
  title: string;
  summary?: string;
  body?: string;
  category?: string;
  version: number;
  updatedAt?: string;
  publishedAt?: string;
  author_id?: { name: string };
};
export function HrHelpCenter({ id }: { id?: string }) {
  if (id === "requests") return <HelpRequests />;
  if (id) return <HelpArticle id={id} />;
  return <HelpHome />;
}
function HelpHome() {
  const q = useSupport<Article[]>("/help/articles");
  const [term, setTerm] = useState("");
  const rows =
    q.data?.filter((x) =>
      [x.title, x.summary].join(" ").toLowerCase().includes(term.toLowerCase()),
    ) || [];
  return (
    <div className="sa-page">
      <HrHead
        title="Help Center"
        description="Verified product guidance for the NOVYA HR workspace."
        actions={
          <Button href="/learn/help/requests">Requests & Feedback</Button>
        }
      />
      <section className="sa-panel">
        <h3>Everything HR needs to work with NOVYA.</h3>
        <input
          className="nv-input"
          aria-label="Search product help"
          placeholder="Search product help articles"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <DataState
          pending={q.isPending}
          error={q.error}
          retry={() => q.refetch()}
        >
          <div className="hr-grid three">
            {rows.map((x) => (
              <Link
                className="sa-panel"
                key={x._id}
                href={"/learn/help/" + x._id}
              >
                <small>{x.category || "Product guidance"}</small>
                <h3>{x.title}</h3>
                <p className="nv-caption">{x.summary}</p>
                <small>
                  Version {x.version} / {date(x.updatedAt)}
                </small>
              </Link>
            ))}
          </div>
          {!rows.length && (
            <Empty
              title="No matching published product help"
              description="HR policies are available separately in Knowledge."
              action={<Button href="/learn/knowledge">Open Knowledge</Button>}
            />
          )}
        </DataState>
      </section>
    </div>
  );
}
function HelpArticle({ id }: { id: string }) {
  const q = useSupport<Article>("/help/articles/" + id),
    m = useSupportMutation();
  const [feedback, setFeedback] = useState<boolean>();
  return (
    <div className="sa-page">
      <Button href="/learn/help">Back to Help Center</Button>
      <DataState
        pending={q.isPending}
        error={q.error}
        retry={() => q.refetch()}
      >
        {q.data && (
          <>
            <HrHead
              title={q.data.title}
              description={q.data.summary || "Verified product guidance"}
            />
            <div className="hr-grid two">
              <article className="sa-panel">
                <Markdown text={q.data.body || ""} />
                <h3>Was this helpful?</h3>
                {feedback === undefined ? (
                  <div className="hr-actions">
                    {[true, false].map((helpful) => (
                      <Button
                        disabled={m.isPending}
                        key={String(helpful)}
                        onClick={async () => {
                          try {
                            await m.mutateAsync({
                              path: "/help/articles/" + id + "/feedback",
                              body: { helpful },
                            });
                            setFeedback(helpful);
                          } catch {
                            /* The mutation displays the server error. */
                          }
                        }}
                      >
                        {helpful ? "Yes" : "No"}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p role="status">Thanks for your feedback.</p>
                )}
              </article>
              <aside className="sa-panel">
                <h3>Article details</h3>
                <dl className="hr-facts">
                  <dt>Owner</dt>
                  <dd>
                    {q.data.author_id?.name || "Editorial owner not supplied"}
                  </dd>
                  <dt>Version</dt>
                  <dd>{q.data.version}</dd>
                  <dt>Published</dt>
                  <dd>{date(q.data.publishedAt)}</dd>
                  <dt>Updated</dt>
                  <dd>{date(q.data.updatedAt)}</dd>
                </dl>
                <Button href="/learn/help/requests">
                  Request clarification
                </Button>
              </aside>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
function HelpRequests() {
  const q =
      useSupport<
        {
          _id: string;
          title: string;
          description?: string;
          kind: string;
          status: string;
          createdAt: string;
        }[]
      >("/requests"),
    m = useSupportMutation();
  const [open, setOpen] = useState(false);
  return (
    <div className="sa-page">
      <HrHead
        title="Requests & Feedback"
        description="Your product-support requests and documentation gaps."
        actions={
          <Button onClick={() => setOpen(!open)}>
            {open ? "Close form" : "New request"}
          </Button>
        }
      />
      {open && (
        <form
          className="sa-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = {
              ...Object.fromEntries(new FormData(e.currentTarget)),
              kind: "support",
            };
            try {
              await m.mutateAsync({ path: "/requests", body });
              setOpen(false);
            } catch {
              /* The mutation displays the server error and keeps the draft. */
            }
          }}
        >
          <Field name="title" label="Request title" required />
          <Field
            name="description"
            label="Product question or missing guidance"
            type="textarea"
            required
          />
          <p className="nv-caption">
            Keep private employee evidence in the protected canonical record.
          </p>
          <Button type="submit" primary disabled={m.isPending}>
            Submit request
          </Button>
        </form>
      )}
      <section className="sa-panel">
        <DataState
          pending={q.isPending}
          error={q.error}
          retry={() => q.refetch()}
        >
          {q.data
            ?.filter((x) => x.kind === "support")
            .map((x) => (
              <div className="hr-list-row" key={x._id}>
                <div>
                  <strong>{x.title}</strong>
                  <small>{date(x.createdAt)}</small>
                  <p className="nv-caption">{x.description}</p>
                </div>
                <Badge>{x.status}</Badge>
              </div>
            ))}
          {!q.data?.some((x) => x.kind === "support") && (
            <Empty title="No support requests yet" />
          )}
        </DataState>
      </section>
    </div>
  );
}
