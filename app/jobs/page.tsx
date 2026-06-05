"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { JOBS_QUERY } from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { IconSearch, IconMapPin, IconBookmark, IconLoader2, IconBriefcase, IconClock } from "@tabler/icons-react";

const jobTypes   = ["All", "Full-time", "Remote", "Contract"];
const expLevels  = ["All", "0–2 years", "2–4 years", "5+ years"];
const locations  = ["All", "Remote", "Bangalore", "Mumbai", "Hyderabad"];

const mockJobs = [
  { id: "1", title: "Senior Rust Engineer",    companyName: "Acme Corp",    location: "Remote",     experienceRequired: "2–4 years", jobType: "Full-time", package: "30–45 LPA", createdAt: new Date().toISOString() },
  { id: "2", title: "GraphQL Architect",        companyName: "TechFlow",     location: "Bangalore",  experienceRequired: "5+ years",  jobType: "Full-time", package: "25–40 LPA", createdAt: new Date().toISOString() },
  { id: "3", title: "Backend Engineer — Infra", companyName: "Synapse Labs", location: "Remote",     experienceRequired: "2–4 years", jobType: "Contract",  package: "18–28 LPA", createdAt: new Date().toISOString() },
  { id: "4", title: "Distributed Systems Lead", companyName: "Vector AI",    location: "Hyderabad",  experienceRequired: "5+ years",  jobType: "Full-time", package: "40–60 LPA", createdAt: new Date().toISOString() },
  { id: "5", title: "TypeScript Frontend Dev",  companyName: "UX Studio",    location: "Remote",     experienceRequired: "0–2 years", jobType: "Remote",    package: "12–18 LPA", createdAt: new Date().toISOString() },
];

const colors = ["#6B4EFF","#ec4899","#22c55e","#f59e0b","#8b5cf6","#06b6d4"];

export default function JobsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch]   = useState("");
  const [jobType, setJobType] = useState("All");
  const [exp, setExp]         = useState("All");
  const [loc, setLoc]         = useState("All");

  const { data, loading } = useQuery(JOBS_QUERY, {
    variables: { filter: { jobType: jobType !== "All" ? jobType : undefined, location: loc !== "All" ? loc : undefined, search: search || undefined } },
    skip: !user,
    onError: () => {},
  });

  if (!isLoading && !user) { router.push("/login"); return null; }

  const jobs = data?.jobs?.length ? data.jobs : mockJobs;
  const filtered = jobs.filter((j: any) => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchType = jobType === "All" || j.jobType === jobType;
    const matchLoc  = loc === "All" || j.location === loc;
    return matchSearch && matchType && matchLoc;
  });

  return (
    <>
      <Navbar />
      <div style={{ marginTop: "var(--nav-h)", background: "var(--bg)", minHeight: "100vh", padding: "20px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.pageTitle}>Find Your Next Role</h1>
              <p style={{ fontSize: 14, color: "var(--t3)" }}>{filtered.length} opportunities available</p>
            </div>
            <div style={s.searchBar}>
              <IconSearch size={16} color="var(--t3)" />
              <input placeholder="Search by title, company, or skill…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, fontFamily: "inherit", flex: 1, color: "var(--t1)" }} />
            </div>
          </div>

          <div style={s.layout}>
            {/* Filters */}
            <div className="card" style={s.filters}>
              <div style={s.filterTitle}>Filters</div>
              <FilterGroup label="Job Type"   options={jobTypes}  selected={jobType} onSelect={setJobType} />
              <FilterGroup label="Experience" options={expLevels} selected={exp}     onSelect={setExp} />
              <FilterGroup label="Location"   options={locations} selected={loc}     onSelect={setLoc} />
              <button onClick={() => { setJobType("All"); setExp("All"); setLoc("All"); setSearch(""); }}
                style={{ fontSize: 12, color: "var(--purple)", background: "transparent", marginTop: 8, fontWeight: 600 }}>
                Clear all filters
              </button>
            </div>

            {/* Job list */}
            <div>
              {loading && <div style={{ textAlign: "center", padding: 32 }}><IconLoader2 size={24} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} /></div>}
              {filtered.map((job: any, i: number) => (
                <div key={job.id} className="card fade" style={s.jobCard}>
                  <div style={s.jobHead}>
                    <div style={{ ...s.compLogo, background: colors[i % colors.length] + "20", color: colors[i % colors.length] }}>
                      {job.companyName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.jobTitle}>{job.title}</div>
                      <div style={s.jobMeta}>
                        {job.companyName}
                        {job.location && <> · <IconMapPin size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {job.location}</>}
                        {job.createdAt && <> · <IconClock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {new Date(job.createdAt).toLocaleDateString()}</>}
                      </div>
                    </div>
                    <button style={s.bookmarkBtn}><IconBookmark size={16} color="var(--t3)" /></button>
                  </div>
                  <div style={s.pills}>
                    {job.jobType          && <span style={s.pillPurple}>{job.jobType}</span>}
                    {job.experienceRequired && <span style={s.pill}>{job.experienceRequired}</span>}
                    {job.package           && <span style={s.pillGreen}>{job.package}</span>}
                  </div>
                  <div style={s.jobFooter}>
                    <button className="btn-primary" style={{ fontSize: 13, padding: "7px 20px", borderRadius: 6 }}>Apply Now</button>
                    <button className="btn-outline" style={{ fontSize: 13, padding: "6px 20px", borderRadius: 6 }}>View Details</button>
                  </div>
                </div>
              ))}
              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--t3)" }}>No jobs found matching your filters.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function FilterGroup({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)", marginBottom: 8 }}>{label}</div>
      {options.map((opt) => (
        <div key={opt} onClick={() => onSelect(opt)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}>
          <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${selected === opt ? "var(--purple)" : "var(--border2)"}`, background: selected === opt ? "var(--purple)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
            {selected === opt && <div style={{ width: 6, height: 6, borderRadius: 2, background: "#fff" }} />}
          </div>
          <span style={{ fontSize: 13, color: selected === opt ? "var(--purple)" : "var(--t2)", fontWeight: selected === opt ? 600 : 400 }}>{opt}</span>
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20, flexWrap: "wrap" },
  pageTitle: { fontSize: 22, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.02em", marginBottom: 2 },
  searchBar: { display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 14px", minWidth: 280, boxShadow: "var(--shadow)" },
  layout: { display: "grid", gridTemplateColumns: "210px 1fr", gap: 16 },
  filters: { padding: 16, height: "fit-content", position: "sticky", top: "calc(var(--nav-h) + 20px)" },
  filterTitle: { fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 16 },
  jobCard: { padding: 18, marginBottom: 10 },
  jobHead: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  compLogo: { width: 46, height: 46, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 },
  jobTitle: { fontSize: 15, fontWeight: 700, color: "var(--t1)", marginBottom: 3 },
  jobMeta: { fontSize: 12, color: "var(--t3)" },
  bookmarkBtn: { width: 34, height: 34, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" },
  pills: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  pill: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--t2)" },
  pillPurple: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "var(--purple-light)", color: "var(--purple)", border: "1px solid rgba(107,78,255,0.2)" },
  pillGreen: { padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" },
  jobFooter: { display: "flex", gap: 8 },
};