"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Folder as FolderIcon,
  ArrowUpRight,
  ArrowLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  DataState,
  Empty,
  Field,
  Modal,
  Badge,
} from "@/components/novya/ui";
import { Markdown } from "@/components/novya/markdown";
import {
  Conversation,
  date,
  useSupport,
  useSupportMutation,
  supportPath,
} from "@/lib/support";
import api from "@/lib/axios";
import { errorMessage } from "@/lib/format";
type Folder = {
  _id: string;
  name: string;
  description?: string;
  conversationCount?: number;
};
export function KoraOrb({ size = 128 }: { size?: number }) {
  return (
    <span
      className="sa-orb"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
export function AssistantPage({
  section,
  id,
}: {
  section?: string;
  id?: string;
  search?: URLSearchParams;
}) {
  if (section === "folders") return <Folders id={id} />;
  if (section === "c" && id) return <Chat id={id} />;
  if (section)
    return (
      <Empty
        title="Page not found"
        action={<Button href="/assistant">New Chat</Button>}
      />
    );
  return <Chat />;
}
function Chat({ id }: { id?: string }) {
  const router = useRouter(),
    qc = useQueryClient(),
    q = useSupport<Conversation>(`/conversations/${id}`, Boolean(id)),
    m = useSupportMutation();
  const folders = useSupport<Folder[]>("/folders");
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(searchParams.get("prompt") || ""),
    [busy, setBusy] = useState(false),
    [move, setMove] = useState(false);
  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const result = (
        await api.post(supportPath("/chat"), {
          message: text,
          conversation_id: id,
        })
      ).data.data as Conversation;
      setMessage("");
      await qc.invalidateQueries({ queryKey: ["hr"] });
      if (!id) router.push("/assistant/c/" + result._id);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const compose = (
    <form
      className={id ? "sa-thread-compose" : "sa-home-input"}
      onSubmit={(e) => {
        e.preventDefault();
        void send(message);
      }}
    >
      <input
        aria-label="Message Kora"
        placeholder="Ask Kora anything..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={busy}
      />
      <button
        type="submit"
        aria-label="Send message"
        disabled={busy || !message.trim()}
      >
        <ArrowUpRight size={16} />
      </button>
    </form>
  );
  if (!id)
    return (
      <div className="sa-home">
        <h1>Kora Assistant</h1>
        <p>
          Your personal assistant across people records, requests and HR
          workflows.
        </p>
        <KoraOrb />
        <h2>How can I help with people operations today?</h2>
        {compose}
        <div className="sa-starters">
          {[
            "Review my HR priorities",
            "Draft onboarding communication",
            "Explain a leave policy",
            "Prepare an interview checklist",
          ].map((s) => (
            <button key={s} disabled={busy} onClick={() => void send(s)}>
              <Sparkles size={12} />
              {s}
            </button>
          ))}
        </div>
        <small>
          Use minimum necessary information. Kora provides guidance and drafts;
          human decisions stay in their owning workflows.
        </small>
      </div>
    );
  return (
    <DataState pending={q.isPending} error={q.error} retry={() => q.refetch()}>
      {q.data && (
        <div className="sa-conv">
          <div className="sa-conv-head">
            <Button href="/assistant">
              <ArrowLeft size={13} />
            </Button>
            <div>
              <h1>{q.data.title}</h1>
              <p>
                People Operations / {date(q.data.updatedAt)} / Private
                conversation
              </p>
            </div>
            <Button onClick={() => setMove(true)}>Move to folder</Button>
          </div>
          <div className="sa-conv-grid">
            <section className="sa-panel sa-thread">
              <div className="sa-thread-head">
                <strong>Kora people operations</strong>
                <Badge>Guidance & drafts</Badge>
              </div>
              <div className="sa-thread-body">
                {q.data.messages?.map((msg, i) => (
                  <div
                    key={msg._id || i}
                    className={`sa-msg ${msg.role === "user" ? "me" : "kora"}`}
                  >
                    <div className="sa-msg-top">
                      <b>{msg.role === "user" ? "You" : "Kora"}</b>
                      <small>{date(msg.createdAt)}</small>
                    </div>
                    <Markdown text={msg.content} />
                  </div>
                ))}
                {busy && <p role="status">Kora is preparing a response...</p>}
              </div>
              {compose}
            </section>
            <aside className="sa-panel sa-context">
              <h3>Conversation context</h3>
              <p>
                Private to you. Use approved policy sources and check their
                version before relying on a draft.
              </p>
              <h4>Next steps</h4>
              <Button href="/tasks/new">Create personal follow-up</Button>
              <Button href="/workflows">Start a people workflow</Button>
              <Button href="/workspace/requests/new">Prepare a request</Button>
              <h4>People data</h4>
              <p className="nv-caption">
                Keep confidential evidence in the assigned canonical record. A
                conversation does not grant access or apply a people decision.
              </p>
            </aside>
          </div>
          <Modal
            open={move}
            onClose={() => setMove(false)}
            title="Move to folder"
          >
            {folders.data?.map((f) => (
              <button
                key={f._id}
                className="hr-list-row"
                onClick={async () => {
                  try {
                    await m.mutateAsync({
                      path: "/conversations/" + id,
                      method: "patch",
                      body: { folder_id: f._id },
                    });
                    setMove(false);
                  } catch {
                    /* The mutation displays the server error. Keep this state available for correction or retry. */
                  }
                }}
              >
                <FolderIcon size={14} />
                {f.name}
              </button>
            ))}
            <Button
              disabled={m.isPending}
              onClick={async () => {
                try {
                  await m.mutateAsync({
                    path: "/conversations/" + id,
                    method: "patch",
                    body: { folder_id: null },
                  });
                  setMove(false);
                } catch {
                  /* The mutation displays the server error. Keep this state available for correction or retry. */
                }
              }}
            >
              Remove from folder
            </Button>
          </Modal>
        </div>
      )}
    </DataState>
  );
}
function Folders({ id }: { id?: string }) {
  const q = useSupport<Folder[]>("/folders"),
    c = useSupport<Conversation[]>("/conversations"),
    m = useSupportMutation();
  const [term, setTerm] = useState(""),
    [edit, setEdit] = useState<Folder | null | undefined>(),
    [remove, setRemove] = useState<Folder>();
  const folder = q.data?.find((f) => f._id === id),
    list =
      c.data?.filter(
        (x) =>
          (!id || x.folder_id === id) &&
          x.title.toLowerCase().includes(term.toLowerCase()),
      ) || [];
  return (
    <div className="sa-page">
      <div className="sa-head">
        <div>
          <h1>{id ? folder?.name || "Folder" : "Folders"}</h1>
          <p>Organize your conversations and continue your HR work.</p>
        </div>
        <Button onClick={() => setEdit(null)}>
          <Plus size={13} />
          Create folder
        </Button>
      </div>
      <label className="sa-search">
        <Search size={14} />
        <input
          aria-label="Search conversations"
          placeholder="Search conversations"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </label>
      <DataState
        pending={q.isPending || c.isPending}
        error={q.error || c.error}
        retry={() => {
          q.refetch();
          c.refetch();
        }}
      >
        {!id && (
          <div className="hr-grid three">
            {q.data?.map((f) => (
              <section className="sa-panel" key={f._id}>
                <Link href={"/assistant/folders/" + f._id}>
                  <FolderIcon size={18} />
                  <h3>{f.name}</h3>
                  <p>{f.description}</p>
                  <small>
                    {c.data?.filter((x) => x.folder_id === f._id).length || 0}{" "}
                    conversations
                  </small>
                </Link>
                <div className="hr-actions">
                  <Button onClick={() => setEdit(f)}>Rename</Button>
                  <Button onClick={() => setRemove(f)}>Delete</Button>
                </div>
              </section>
            ))}
          </div>
        )}
        <h3>Recent conversations</h3>
        <div className="hr-grid two">
          {list.map((x) => (
            <Link
              className="sa-panel"
              key={x._id}
              href={"/assistant/c/" + x._id}
            >
              <h3>{x.title}</h3>
              <small>{date(x.updatedAt)}</small>
            </Link>
          ))}
        </div>
        {!list.length && (
          <Empty
            title="No conversations yet"
            action={<Button href="/assistant">New Chat</Button>}
          />
        )}
      </DataState>
      <Modal
        open={edit !== undefined}
        onClose={() => setEdit(undefined)}
        title={edit ? "Rename folder" : "Create folder"}
      >
        <form
          onSubmit={async (e) => {
            try {
              e.preventDefault();
              const b = Object.fromEntries(new FormData(e.currentTarget));
              await m.mutateAsync({
                path: edit ? "/folders/" + edit._id : "/folders",
                method: edit ? "patch" : "post",
                body: b,
              });
              setEdit(undefined);
            } catch {
              /* The mutation displays the server error. Keep this state available for correction or retry. */
            }
          }}
        >
          <Field
            name="name"
            label="Folder name"
            required
            defaultValue={edit?.name}
          />
          <Field
            name="description"
            label="Description"
            type="textarea"
            defaultValue={edit?.description}
          />
          <Button type="submit" primary disabled={m.isPending}>
            Save folder
          </Button>
        </form>
      </Modal>
      <Modal
        open={!!remove}
        onClose={() => setRemove(undefined)}
        title="Delete folder?"
        description="Conversations will be kept outside this folder."
      >
        <Button
          disabled={m.isPending}
          onClick={async () => {
            try {
              await m.mutateAsync({
                path: "/folders/" + remove?._id,
                method: "delete",
              });
              setRemove(undefined);
            } catch {
              /* The mutation displays the server error. Keep this state available for correction or retry. */
            }
          }}
        >
          Delete folder
        </Button>
      </Modal>
    </div>
  );
}
