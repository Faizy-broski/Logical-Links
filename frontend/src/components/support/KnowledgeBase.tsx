"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  KNOWLEDGE_BASE_SECTIONS,
  KNOWLEDGE_BASE_SUBTITLE,
  KNOWLEDGE_BASE_TITLE,
  type KnowledgeBaseBlock,
} from "@/lib/knowledge-base";
import { cn } from "@/lib/utils/cn";

function Blocks({ blocks }: { blocks: KnowledgeBaseBlock[] }) {
  return (
    <div className="space-y-3 pb-4 text-sm leading-relaxed text-muted">
      {blocks.map((b, i) =>
        b.kind === "p" ? (
          <p key={i}>{b.text}</p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

// One card with divider-separated sections. Opening a section closes the
// others, and the same goes for the sub-topics inside an open section.
export function KnowledgeBase() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);

  function toggleSection(slug: string) {
    setOpenSection((cur) => (cur === slug ? null : slug));
    setOpenItem(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
      <div className="border-b border-card-border px-6 py-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{KNOWLEDGE_BASE_TITLE}</h2>
        <p className="mt-0.5 text-sm text-muted">{KNOWLEDGE_BASE_SUBTITLE}</p>
      </div>

      <div className="divide-y divide-card-border">
        {KNOWLEDGE_BASE_SECTIONS.map((section) => {
          const sectionOpen = openSection === section.slug;
          return (
            <div key={section.slug} className="px-6">
              <button
                type="button"
                onClick={() => toggleSection(section.slug)}
                aria-expanded={sectionOpen}
                className="flex w-full items-start justify-between gap-4 py-5 text-left"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground">{section.title}</p>
                  <p className="mt-1 text-sm text-muted">{section.summary}</p>
                </div>
                {sectionOpen ? (
                  <Minus className="mt-1 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Plus className="mt-1 h-4 w-4 shrink-0 text-primary" />
                )}
              </button>

              {sectionOpen && (
                <div className="divide-y divide-card-border/70 border-t border-card-border/70 pb-2 pl-3">
                  {section.items.map((item) => {
                    const key = `${section.slug}:${item.title}`;
                    const itemOpen = openItem === key;
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => setOpenItem(itemOpen ? null : key)}
                          aria-expanded={itemOpen}
                          className="flex w-full items-center justify-between gap-4 py-3.5 text-left"
                        >
                          <span className={cn("text-sm font-semibold", itemOpen ? "text-primary" : "text-primary/80")}>
                            {item.title}
                          </span>
                          {itemOpen ? (
                            <Minus className="h-3.5 w-3.5 shrink-0 text-primary" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                          )}
                        </button>
                        {itemOpen && <Blocks blocks={item.blocks} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
