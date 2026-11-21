import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Sparkles,
  GraduationCap,
  CheckSquare,
  Inbox,
  Calendar,
  Workflow,
  Package,
  Users,
  Folder,
  FileText,
  Sheet,
  Presentation,
  Upload,
  Image,
  Layers,
  HardDrive,
  BookOpen,
  TrendingUp,
  LifeBuoy,
  UserRound,
  Shield,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
  Accessibility,
  Settings,
  ClipboardList,
  UserPlus,
  UserMinus,
  Briefcase,
  Network,
  Activity,
} from "lucide-react";
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  title?: string;
};
export type NavArea = {
  key: string;
  match: (p: string) => boolean;
  back?: { href: string; label: string }[];
  items: NavItem[];
  recentConversations?: boolean;
};
export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/assistant", label: "Assistant", icon: Sparkles },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/workspace", label: "Workspace", icon: Package },
  { href: "/app", label: "App", icon: Package },
];
export const leadNav: NavItem = {
  href: "/team",
  label: "Head of People",
  icon: Users,
};
const under = (base: string) => (p: string) =>
  p === base || p.startsWith(base + "/");
const back = [{ href: "/dashboard", label: "Back to Dashboard" }];
export const peopleNav: NavItem[] = [
  { href: "/workspace/hub", label: "Overview", icon: LayoutGrid },
  { href: "/workspace/people", label: "People", icon: Users },
  {
    href: "/workspace/departments",
    label: "Departments & Teams",
    icon: Network,
  },
  { href: "/workspace/recruiting", label: "Recruiting", icon: Briefcase },
  { href: "/workspace/onboarding", label: "Onboarding", icon: UserPlus },
  { href: "/workspace/requests", label: "Requests", icon: ClipboardList },
  { href: "/workspace/absences", label: "Absences", icon: UserMinus },
  { href: "/workspace/performance", label: "Performance", icon: TrendingUp },
  { href: "/workspace/roles", label: "Roles & Access", icon: ShieldCheck },
];
export const areas: NavArea[] = [
  {
    key: "assistant",
    match: under("/assistant"),
    back,
    recentConversations: true,
    items: [
      {
        href: "/assistant",
        label: "New Chat",
        icon: Sparkles,
        title: "Assistant",
      },
      {
        href: "/assistant/folders",
        label: "Folders",
        icon: Folder,
        title: "Assistant · Folders",
      },
    ],
  },
  {
    key: "learn",
    match: under("/learn"),
    back,
    items: [
      { href: "/learn", label: "Overview", icon: LayoutGrid },
      { href: "/learn/knowledge", label: "Knowledge", icon: BookOpen },
      { href: "/learn/courses", label: "Courses", icon: Layers },
      { href: "/learn/progress", label: "My Progress", icon: TrendingUp },
      { href: "/learn/team", label: "Team Progress", icon: Users },
      { href: "/learn/help", label: "Help Center", icon: LifeBuoy },
    ],
  },
  {
    key: "office",
    match: under("/workspace/office"),
    back: [...back, { href: "/workspace", label: "Back to Workspace" }],
    items: [
      { href: "/workspace/office", label: "Overview", icon: LayoutGrid },
      { href: "/workspace/office/docs", label: "Docs", icon: FileText },
      { href: "/workspace/office/sheets", label: "Sheets", icon: Sheet },
      {
        href: "/workspace/office/presentations",
        label: "Presentations",
        icon: Presentation,
      },
      {
        href: "/workspace/office/transfers",
        label: "Imports & Exports",
        icon: Upload,
      },
    ],
  },
  {
    key: "media",
    match: under("/workspace/media"),
    back: [...back, { href: "/workspace", label: "Back to Workspace" }],
    items: [
      { href: "/workspace/media", label: "Overview", icon: LayoutGrid },
      { href: "/workspace/media/library", label: "Library", icon: Image },
      { href: "/workspace/media/upload", label: "Upload", icon: Upload },
      {
        href: "/workspace/media/collections",
        label: "Collections",
        icon: Layers,
      },
      {
        href: "/workspace/media/brand-assets",
        label: "Brand Assets",
        icon: Sparkles,
      },
      { href: "/workspace/media/storage", label: "Storage", icon: HardDrive },
    ],
  },
  {
    key: "workspace",
    match: (p) => p === "/workspace",
    back,
    items: [
      { href: "/workspace", label: "Overview", icon: LayoutGrid },
      { href: "/workspace/hub", label: "HR Hub", icon: Users },
      { href: "/workspace/office", label: "Office", icon: FileText },
      { href: "/workspace/media", label: "Media", icon: Image },
    ],
  },
  {
    key: "people",
    match: under("/workspace"),
    back: [{ href: "/workspace", label: "Back to Workspace" }],
    items: peopleNav,
  },
  {
    key: "team",
    match: under("/team"),
    back,
    items: [
      { href: "/team", label: "Overview", icon: LayoutGrid },
      { href: "/team/members", label: "HR Team", icon: Users },
      { href: "/team/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/team/workload", label: "Workload", icon: Activity },
      { href: "/team/reviews", label: "Reviews", icon: ClipboardList },
      { href: "/team/coverage", label: "Coverage", icon: Network },
      { href: "/team/performance", label: "Performance", icon: TrendingUp },
      { href: "/team/approvals", label: "Approvals", icon: ShieldCheck },
    ],
  },
  {
    key: "settings",
    match: under("/settings"),
    back,
    items: [
      { href: "/settings", label: "Overview", icon: LayoutGrid },
      { href: "/settings/profile", label: "Profile", icon: UserRound },
      { href: "/settings/security", label: "Account & Security", icon: Shield },
      { href: "/settings/notifications", label: "Notifications", icon: Bell },
      {
        href: "/settings/preferences",
        label: "Work Preferences",
        icon: SlidersHorizontal,
      },
      {
        href: "/settings/privacy",
        label: "Privacy & Sessions",
        icon: ShieldCheck,
      },
      {
        href: "/settings/accessibility",
        label: "App & Accessibility",
        icon: Accessibility,
      },
    ],
  },
];
export function areaFor(p: string) {
  return areas.find((a) => a.match(p)) || null;
}
export function titleFor(p: string) {
  const items = [...areas.flatMap((a) => a.items), ...mainNav];
  const hit = items
    .filter((i) => under(i.href)(p))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return hit?.title || hit?.label || "HR";
}
export const accountMenu: NavItem[] = [
  { href: "/settings/profile", label: "Profile", icon: UserRound },
  { href: "/settings/security", label: "Account & Security", icon: Shield },
  { href: "/settings/privacy", label: "Privacy & Sessions", icon: ShieldCheck },
  {
    href: "/settings/accessibility",
    label: "App & Accessibility",
    icon: Accessibility,
  },
  { href: "/settings", label: "Settings", icon: Settings },
];
