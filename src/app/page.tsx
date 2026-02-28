"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { storageUrl } from "@/lib/urls";

interface RecentSet {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  subject?: { name: string };
  _count?: { slides: number };
}

interface Subject {
  id: string;
  name: string;
  referenceImagePaths: string;
}

export default function DashboardPage() {
  const [recentSets, setRecentSets] = useState<RecentSet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [counts, setCounts] = useState({ presets: 0, templates: 0, cronJobs: 0 });

  useEffect(() => {
    async function load() {
      const [sets, subs, presets, templates, crons] = await Promise.all([
        fetch("/api/sets").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
        fetch("/api/presets").then((r) => r.json()),
        fetch("/api/templates").then((r) => r.json()),
        fetch("/api/cronjobs").then((r) => r.json()),
      ]);
      setRecentSets(sets.slice(0, 5));
      setSubjects(subs);
      setCounts({
        presets: presets.length,
        templates: templates.length,
        cronJobs: crons.length,
      });
    }
    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>StyleSet</h2>
          <p>Hairstyle variation engine</p>
        </div>
        <Link href="/subjects" className="btn btn-primary">
          + New Subject
        </Link>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <div className="stat-tile">
          <div className="stat-label">Subjects</div>
          <div className="stat-value">{subjects.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Presets</div>
          <div className="stat-value">{counts.presets}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Sets Generated</div>
          <div className="stat-value">{recentSets.length}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Cron Jobs</div>
          <div className="stat-value">{counts.cronJobs}</div>
        </div>
      </div>

      {/* Quick access: subjects with generate */}
      {subjects.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Your Subjects</h3>
          <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {subjects.map((s) => {
              const images: string[] = JSON.parse(s.referenceImagePaths || "[]");
              return (
                <Link key={s.id} href={`/subjects/${s.id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ cursor: "pointer" }}>
                    {images.length > 0 && (
                      <img
                        src={storageUrl(images[0])}
                        alt={s.name}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          borderRadius: "var(--radius-sm)",
                          marginBottom: 10,
                        }}
                      />
                    )}
                    <div className="card-title">{s.name}</div>
                    <div className="card-meta">{images.length} reference image{images.length !== 1 ? "s" : ""}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent sets */}
      {recentSets.length > 0 && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Sets</h3>
            <Link href="/sets" className="text-sm text-secondary">
              View all →
            </Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Slides</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentSets.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td className="text-secondary">{s.subject?.name || "—"}</td>
                    <td>{s._count?.slides ?? "—"}</td>
                    <td>
                      <span
                        className={`badge ${s.status === "ready"
                          ? "badge-success"
                          : s.status === "generating"
                            ? "badge-warning"
                            : s.status === "failed"
                              ? "badge-danger"
                              : "badge-neutral"
                          }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/sets/${s.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subjects.length === 0 && recentSets.length === 0 && (
        <div className="empty-state" style={{ marginTop: 20 }}>
          <h3>Get started</h3>
          <p style={{ marginBottom: 16 }}>Upload a subject reference photo, then generate all hairstyle variations with one click</p>
          <Link href="/subjects" className="btn btn-primary">
            Upload Subject
          </Link>
        </div>
      )}
    </>
  );
}
