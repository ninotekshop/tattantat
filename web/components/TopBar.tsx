
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function TopBar({ title, backUrl = "/" }: { title: string, backUrl?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "white", padding: "16px", marginBottom: "16px" }}>
      <Link href={backUrl} style={{ color: "var(--ink)", display: "flex" }}>
        <ArrowLeft size={24} />
      </Link>
      <div style={{ width: "12px" }}></div>
      <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>{title}</h1>
    </div>
  );
}

