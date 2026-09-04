import {
    Code2,
    Globe,
    Layout,
    Server,
    Network,
    Smartphone,
    Briefcase,
    // [TEMP demo categories] icons — remove together with DEMO_CATEGORIES in the Jobs page
    Palette,
    Boxes,
    Megaphone,
    TrendingUp,
    Users,
    Headphones,
} from "lucide-svelte";

// Category visuals shared by the admin Jobs and Applications pages so every
// card for the same category looks identical (same icon, same color).
export const categoryConfig = {
    full_stack_developer: { label: "Full Stack", icon: Code2, color: "#6366f1" },
    web_developer: { label: "Web Developer", icon: Globe, color: "#06b6d4" },
    frontend_developer: { label: "Frontend", icon: Layout, color: "#8b5cf6" },
    backend_developer: { label: "Backend", icon: Server, color: "#f59e0b" },
    system_architect: { label: "System Architect", icon: Network, color: "#10b981" },
    mobile_developer: { label: "Mobile Dev", icon: Smartphone, color: "#ef4444" },
    // ================================================================
    // [TEMP] Demo category visuals — UI testing only.
    // Remove this block when real categories come from the backend. Real
    // jobs keep working without these entries (getCategoryConfig falls
    // back to the job's key).
    // ================================================================
    engineering: { label: "Engineering", icon: Code2, color: "#2563eb" },
    design: { label: "Design", icon: Palette, color: "#ec4899" },
    product: { label: "Product", icon: Boxes, color: "#9333ea" },
    marketing: { label: "Marketing", icon: Megaphone, color: "#ea580c" },
    finance: { label: "Finance", icon: TrendingUp, color: "#16a34a" },
    human_resources: { label: "Human Resources", icon: Users, color: "#0891b2" },
    customer_support: { label: "Customer Support", icon: Headphones, color: "#d97706" },
    other: { label: "Other Jobs", icon: Briefcase, color: "#64748b" },
};

export function getCategoryConfig(category) {
    return categoryConfig[category] || { label: category?.replace(/_/g, " ") || "Other", icon: Briefcase, color: "#6b7280" };
}
