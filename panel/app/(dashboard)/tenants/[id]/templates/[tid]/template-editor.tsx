"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Trash2, GripVertical, X,
  User, Briefcase, Phone, Mail, Building2, Globe, MapPin,
  Minus, AlignJustify, Image, Type, Code, Eye, Wand2,
  ChevronUp, ChevronDown,
} from "lucide-react";
import {
  updateTemplateAction,
  deleteTemplateAction,
  previewTemplateAction,
} from "../../actions";
import type { Template } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";

// ── Types ──────────────────────────────────────────────────────────────────────

type FieldKey =
  | "display_name"
  | "job_title"
  | "mobile_phone"
  | "email"
  | "department"
  | "extra_fields.website"
  | "extra_fields.address";

interface FieldBlock {
  id: string; type: "field";
  field: FieldKey; prefix: string; color: string;
  fontSize: number; bold: boolean; italic: boolean; link: boolean;
}
interface ImageBlock {
  id: string; type: "image";
  src: string; width: number; alt: string; linkUrl: string;
}
interface DividerBlock {
  id: string; type: "divider";
  color: string; thickness: number;
}
interface SpacerBlock { id: string; type: "spacer"; height: number; }
interface TextBlock {
  id: string; type: "text";
  content: string; color: string; fontSize: number; bold: boolean;
}
type Block = FieldBlock | ImageBlock | DividerBlock | SpacerBlock | TextBlock;

interface SignatureStyle {
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
}
interface BuilderConfig { v: 1; style: SignatureStyle; blocks: Block[]; }

// ── Constants ─────────────────────────────────────────────────────────────────

const FIELD_META: Record<FieldKey, { label: string; icon: React.ReactNode }> = {
  display_name:          { label: "Ad Soyad",      icon: <User size={12}/> },
  job_title:             { label: "Ünvan",           icon: <Briefcase size={12}/> },
  mobile_phone:          { label: "Telefon",         icon: <Phone size={12}/> },
  email:                 { label: "E-posta",          icon: <Mail size={12}/> },
  department:            { label: "Departman",       icon: <Building2 size={12}/> },
  "extra_fields.website":{ label: "Web Sitesi",      icon: <Globe size={12}/> },
  "extra_fields.address":{ label: "Adres",           icon: <MapPin size={12}/> },
};

const FIELD_SAMPLE: Record<FieldKey, string> = {
  display_name:          "Ahmet Yılmaz",
  job_title:             "Satış Müdürü",
  mobile_phone:          "+90 555 000 00 00",
  email:                 "ahmet@firma.com",
  department:            "Satış",
  "extra_fields.website":"www.firma.com",
  "extra_fields.address":"İstanbul, Türkiye",
};

const FONT_OPTIONS = [
  "Arial, sans-serif",
  "Georgia, serif",
  "Trebuchet MS, sans-serif",
  "Verdana, sans-serif",
  "Times New Roman, serif",
];

const DEFAULT_STYLE: SignatureStyle = {
  fontFamily:     "Arial, sans-serif",
  primaryColor:   "#111827",
  secondaryColor: "#6b7280",
};

const SAMPLE_USER = {
  display_name: "Ahmet Yılmaz",
  job_title: "Satış Müdürü",
  mobile_phone: "+90 555 000 00 00",
  department: "Satış",
  email: "ahmet@firma.com",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function fieldVar(k: FieldKey) {
  return k.startsWith("extra_fields.")
    ? `{{ ${k} | default('') }}`
    : `{{ ${k} | default('') }}`;
}
function fieldCond(k: FieldKey) {
  return k.startsWith("extra_fields.") ? k : k;
}
function fieldHref(k: FieldKey, v: string) {
  if (k === "email")                  return `mailto:${v}`;
  if (k === "mobile_phone")           return `tel:${v}`;
  if (k === "extra_fields.website")   return v;
  return "";
}

function debounce<T extends (...a: Parameters<T>) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...a: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ── HTML Generator ────────────────────────────────────────────────────────────

function blockToHtml(b: Block): string {
  switch (b.type) {
    case "field": {
      const v   = fieldVar(b.field);
      const c   = fieldCond(b.field);
      const txt = b.prefix ? `${b.prefix}${v}` : v;
      const s   = [
        `font-size:${b.fontSize}px`,
        `color:${b.color}`,
        b.bold   ? "font-weight:bold"   : "font-weight:normal",
        b.italic ? "font-style:italic"  : "",
        "font-family:inherit",
        "line-height:1.5",
      ].filter(Boolean).join(";");
      const href = b.link ? fieldHref(b.field, v) : "";
      const inner = href
        ? `<a href="${href}" style="color:${b.color};text-decoration:none;">${txt}</a>`
        : `<span style="${s}">${txt}</span>`;
      return `  <tr><td style="padding:1px 0;">{% if ${c} %}${inner}{% endif %}</td></tr>`;
    }
    case "image": {
      const img = `<img src="${b.src}" width="${b.width}" alt="${b.alt}" style="display:block;max-width:100%;height:auto;border:0;">`;
      const inner = b.linkUrl
        ? `<a href="${b.linkUrl}" style="display:block;">${img}</a>`
        : img;
      return `  <tr><td style="padding:6px 0;">${inner}</td></tr>`;
    }
    case "divider":
      return `  <tr><td style="padding:6px 0;"><div style="border-top:${b.thickness}px solid ${b.color};font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
    case "spacer":
      return `  <tr><td style="height:${b.height}px;line-height:${b.height}px;font-size:0;">&nbsp;</td></tr>`;
    case "text": {
      const s = [
        `font-size:${b.fontSize}px`,
        `color:${b.color}`,
        b.bold ? "font-weight:bold" : "font-weight:normal",
        "font-family:inherit",
      ].join(";");
      return `  <tr><td style="padding:1px 0;"><span style="${s}">${b.content}</span></td></tr>`;
    }
  }
}

function configToHtml(cfg: BuilderConfig): string {
  const comment = `<!-- signed-builder:${JSON.stringify(cfg)} -->`;
  const rows = cfg.blocks.map(blockToHtml).join("\n");
  return `${comment}\n<table cellpadding="0" cellspacing="0" border="0" style="font-family:${cfg.style.fontFamily};border-collapse:collapse;">\n${rows}\n</table>`;
}

function htmlToConfig(html: string): BuilderConfig | null {
  const m = html.match(/<!-- signed-builder:([\s\S]*?) -->/);
  if (!m) return null;
  try { return JSON.parse(m[1]) as BuilderConfig; } catch { return null; }
}

// ── Default blocks ────────────────────────────────────────────────────────────

function starterBlocks(): Block[] {
  return [
    { id: uid(), type: "field", field: "display_name",  prefix: "", color: "#111827", fontSize: 16, bold: true,  italic: false, link: false },
    { id: uid(), type: "field", field: "job_title",     prefix: "", color: "#374151", fontSize: 13, bold: false, italic: false, link: false },
    { id: uid(), type: "divider", color: "#e5e7eb", thickness: 1 },
    { id: uid(), type: "field", field: "mobile_phone",  prefix: "📞 ", color: "#6b7280", fontSize: 12, bold: false, italic: false, link: true },
    { id: uid(), type: "field", field: "email",         prefix: "✉️ ",  color: "#6b7280", fontSize: 12, bold: false, italic: false, link: true },
    { id: uid(), type: "field", field: "department",    prefix: "", color: "#9ca3af", fontSize: 11, bold: false, italic: false, link: false },
  ];
}

// ── Library panel ─────────────────────────────────────────────────────────────

interface LibItem { id: string; label: string; icon: React.ReactNode; make: () => Block; }

const LIB_FIELDS: LibItem[] = (Object.keys(FIELD_META) as FieldKey[]).map(k => ({
  id: `f-${k}`,
  label: FIELD_META[k].label,
  icon: FIELD_META[k].icon,
  make: (): FieldBlock => ({
    id: uid(), type: "field", field: k,
    prefix: "",
    color: k === "display_name" ? "#111827" : "#6b7280",
    fontSize: k === "display_name" ? 15 : 12,
    bold: k === "display_name",
    italic: false,
    link: k === "email" || k === "mobile_phone" || k === "extra_fields.website",
  }),
}));

const LIB_ELEMENTS: LibItem[] = [
  { id: "e-div",   label: "Ayraç",        icon: <Minus size={12}/>,        make: (): DividerBlock => ({ id: uid(), type: "divider", color: "#e5e7eb", thickness: 1 }) },
  { id: "e-spc",   label: "Boşluk",       icon: <AlignJustify size={12}/>, make: (): SpacerBlock  => ({ id: uid(), type: "spacer",  height: 8 }) },
  { id: "e-img",   label: "Logo / Resim", icon: <Image size={12}/>,        make: (): ImageBlock   => ({ id: uid(), type: "image",   src: "", width: 120, alt: "Logo", linkUrl: "" }) },
  { id: "e-txt",   label: "Sabit Metin",  icon: <Type size={12}/>,         make: (): TextBlock    => ({ id: uid(), type: "text",    content: "Metin giriniz", color: "#6b7280", fontSize: 11, bold: false }) },
];

// ── Block canvas preview ──────────────────────────────────────────────────────

function BlockPreview({ block, style }: { block: Block; style: SignatureStyle }) {
  const ff = style.fontFamily.split(",")[0].replace(/['"]/g, "");
  switch (block.type) {
    case "field": {
      const sample = block.prefix + FIELD_SAMPLE[block.field];
      return (
        <span style={{ fontFamily: ff, fontSize: block.fontSize, color: block.color,
            fontWeight: block.bold ? "bold" : "normal", fontStyle: block.italic ? "italic" : "normal" }}>
          {block.link ? <span style={{ textDecoration: "underline", textDecorationColor: block.color }}>{sample}</span> : sample}
        </span>
      );
    }
    case "image":
      return block.src
        ? <img src={block.src} style={{ maxHeight: 36, maxWidth: block.width }} alt={block.alt} />
        : <span className="flex items-center gap-1 text-gray-400 text-xs italic"><Image size={11}/>{block.alt || "Logo"} (URL girin)</span>;
    case "divider":
      return <div style={{ borderTop: `${block.thickness}px solid ${block.color}`, width: "100%" }} />;
    case "spacer":
      return <span className="text-gray-300 text-xs italic">{block.height}px boşluk</span>;
    case "text":
      return <span style={{ fontFamily: ff, fontSize: block.fontSize, color: block.color, fontWeight: block.bold ? "bold" : "normal" }}>{block.content}</span>;
  }
}

// ── Properties panel ──────────────────────────────────────────────────────────

function PropsPanel({ block, onUpdate, onDelete, hint }: {
  block: Block | null;
  onUpdate: (b: Block) => void;
  onDelete: () => void;
  hint: string;
}) {
  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-3 py-8">
        <div className="text-2xl mb-2">✦</div>
        <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>
      </div>
    );
  }

  const set = (patch: Partial<Block>) => onUpdate({ ...block, ...patch } as Block);
  const lbl = "block text-[10px] text-gray-400 mb-1 uppercase tracking-wide font-medium";
  const inp = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      {block.type === "field" && (
        <>
          <div>
            <label className={lbl}>Alan</label>
            <select value={block.field} onChange={e => set({ field: e.target.value as FieldKey })} className={inp}>
              {(Object.keys(FIELD_META) as FieldKey[]).map(k => (
                <option key={k} value={k}>{FIELD_META[k].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Önek / İkon</label>
            <input value={block.prefix} onChange={e => set({ prefix: e.target.value })} className={inp} placeholder="örn. 📞 veya Tel: "/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Renk</label>
              <input type="color" value={block.color} onChange={e => set({ color: e.target.value })}
                className="w-full h-8 border border-gray-200 rounded-lg cursor-pointer p-0.5"/>
            </div>
            <div>
              <label className={lbl}>Boyut</label>
              <input type="number" value={block.fontSize} min={8} max={48}
                onChange={e => set({ fontSize: +e.target.value })} className={inp}/>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={block.bold} onChange={e => set({ bold: e.target.checked })}/>
              Kalın
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={block.italic} onChange={e => set({ italic: e.target.checked })}/>
              İtalik
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={block.link} onChange={e => set({ link: e.target.checked })}/>
              Bağlantı
            </label>
          </div>
        </>
      )}

      {block.type === "image" && (
        <>
          <div>
            <label className={lbl}>Resim URL</label>
            <input value={block.src} onChange={e => set({ src: e.target.value })} className={inp} placeholder="https://..."/>
          </div>
          <div>
            <label className={lbl}>Tıklama Linki (opsiyonel)</label>
            <input value={block.linkUrl} onChange={e => set({ linkUrl: e.target.value })} className={inp} placeholder="https://..."/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Genişlik (px)</label>
              <input type="number" value={block.width} min={20} max={600}
                onChange={e => set({ width: +e.target.value })} className={inp}/>
            </div>
          </div>
          <div>
            <label className={lbl}>Alt metin</label>
            <input value={block.alt} onChange={e => set({ alt: e.target.value })} className={inp}/>
          </div>
        </>
      )}

      {block.type === "divider" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>Renk</label>
            <input type="color" value={block.color} onChange={e => set({ color: e.target.value })}
              className="w-full h-8 border border-gray-200 rounded-lg cursor-pointer p-0.5"/>
          </div>
          <div>
            <label className={lbl}>Kalınlık (px)</label>
            <input type="number" value={block.thickness} min={1} max={8}
              onChange={e => set({ thickness: +e.target.value })} className={inp}/>
          </div>
        </div>
      )}

      {block.type === "spacer" && (
        <div>
          <label className={lbl}>Yükseklik (px)</label>
          <input type="number" value={block.height} min={2} max={80}
            onChange={e => set({ height: +e.target.value })} className={inp}/>
        </div>
      )}

      {block.type === "text" && (
        <>
          <div>
            <label className={lbl}>İçerik</label>
            <input value={block.content} onChange={e => set({ content: e.target.value })} className={inp}/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Renk</label>
              <input type="color" value={block.color} onChange={e => set({ color: e.target.value })}
                className="w-full h-8 border border-gray-200 rounded-lg cursor-pointer p-0.5"/>
            </div>
            <div>
              <label className={lbl}>Boyut</label>
              <input type="number" value={block.fontSize} min={8} max={48}
                onChange={e => set({ fontSize: +e.target.value })} className={inp}/>
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input type="checkbox" checked={block.bold} onChange={e => set({ bold: e.target.checked })}/>
            Kalın
          </label>
        </>
      )}

      <button onClick={onDelete}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors mt-1">
        <X size={11}/> Bloğu kaldır
      </button>
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZone({ idx, active, onOver, onDrop }: {
  idx: number; active: boolean;
  onOver: (e: React.DragEvent, i: number) => void;
  onDrop: (e: React.DragEvent, i: number) => void;
}) {
  return (
    <div
      onDragOver={e => onOver(e, idx)}
      onDrop={e => onDrop(e, idx)}
      className={`transition-all rounded-lg ${
        active ? "h-10 border-2 border-dashed border-brand bg-brand/5 my-1" : "h-1.5 my-0.5"
      }`}
    />
  );
}

// ── Visual Builder ────────────────────────────────────────────────────────────

function VisualBuilder({ config, onChange, emptyHint, starterPrompt, removeLabel, propHint }: {
  config: BuilderConfig;
  onChange: (c: BuilderConfig) => void;
  emptyHint: string;
  starterPrompt: string;
  removeLabel: string;
  propHint: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<{ lib: LibItem } | { idx: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const { blocks, style } = config;

  function patch(newBlocks: Block[], newStyle?: SignatureStyle) {
    onChange({ ...config, blocks: newBlocks, style: newStyle ?? style });
  }
  function patchStyle(s: Partial<SignatureStyle>) {
    onChange({ ...config, style: { ...style, ...s } });
  }
  function patchBlock(updated: Block) {
    patch(blocks.map(b => b.id === updated.id ? updated : b));
  }
  function removeBlock(id: string) {
    patch(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function moveBlock(idx: number, dir: -1 | 1) {
    const n = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= n.length) return;
    [n[idx], n[target]] = [n[target], n[idx]];
    patch(n);
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDropTarget(idx);
  }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDropTarget(null);
    if (!dragFrom) return;
    if ("lib" in dragFrom) {
      const nb = dragFrom.lib.make();
      const n = [...blocks];
      n.splice(idx, 0, nb);
      patch(n);
      setSelectedId(nb.id);
    } else {
      const from = dragFrom.idx;
      if (from === idx) return;
      const n = [...blocks];
      const [moved] = n.splice(from, 1);
      const at = from < idx ? idx - 1 : idx;
      n.splice(at, 0, moved);
      patch(n);
    }
    setDragFrom(null);
  }
  function onDragEnd() { setDragFrom(null); setDropTarget(null); }

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;
  const isDragging = dragFrom !== null;

  return (
    <div className="flex flex-1 min-h-0 border rounded-xl overflow-hidden bg-white">
      {/* ── Library ── */}
      <div className="w-[148px] shrink-0 border-r bg-gray-50 flex flex-col overflow-y-auto">
        <div className="px-3 pt-3 pb-2 border-b">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Özellikler</p>
        </div>
        <div className="p-2 space-y-1">
          {LIB_FIELDS.map(item => (
            <div key={item.id} draggable
              onDragStart={() => setDragFrom({ lib: item })}
              onDragEnd={onDragEnd}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-gray-600 bg-white border border-gray-200 cursor-grab active:cursor-grabbing hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors select-none">
              {item.icon} {item.label}
            </div>
          ))}
        </div>
        <div className="px-3 pt-2 pb-2 border-t">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Elementler</p>
        </div>
        <div className="p-2 space-y-1">
          {LIB_ELEMENTS.map(item => (
            <div key={item.id} draggable
              onDragStart={() => setDragFrom({ lib: item })}
              onDragEnd={onDragEnd}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-gray-600 bg-white border border-gray-200 cursor-grab active:cursor-grabbing hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors select-none">
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Style toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-white shrink-0 flex-wrap gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Yazı tipi</span>
            <select value={style.fontFamily} onChange={e => patchStyle({ fontFamily: e.target.value })}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand">
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(",")[0].replace(/['"]/g, "")}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">İsim rengi</span>
            <input type="color" value={style.primaryColor} onChange={e => patchStyle({ primaryColor: e.target.value })}
              className="w-7 h-7 border border-gray-200 rounded-lg cursor-pointer p-0.5"/>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Detay rengi</span>
            <input type="color" value={style.secondaryColor} onChange={e => patchStyle({ secondaryColor: e.target.value })}
              className="w-7 h-7 border border-gray-200 rounded-lg cursor-pointer p-0.5"/>
          </div>
          <button onClick={() => { if (!confirm(starterPrompt)) return; patch(starterBlocks()); setSelectedId(null); }}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1 hover:border-brand hover:text-brand transition-colors">
            <Wand2 size={11}/> Başlangıç şablonu
          </button>
        </div>

        {/* Blocks area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-0"
          onDragOver={e => { if (blocks.length === 0) { e.preventDefault(); setDropTarget(0); }}}
          onDrop={e => { if (blocks.length === 0) onDrop(e, 0); }}>
          {blocks.length === 0 && (
            <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dropTarget === 0 && isDragging ? "border-brand bg-brand/5" : "border-gray-200"}`}>
              <div className="text-3xl mb-2">✦</div>
              <p className="text-sm text-gray-400">{emptyHint}</p>
            </div>
          )}

          {blocks.length > 0 && (
            <DropZone idx={0}
              active={dropTarget === 0 && isDragging && !("idx" in (dragFrom ?? {}) && (dragFrom as {idx:number}).idx === 0)}
              onOver={onDragOver} onDrop={onDrop}/>
          )}

          {blocks.map((block, i) => (
            <div key={block.id}>
              <div
                draggable
                onDragStart={() => setDragFrom({ idx: i })}
                onDragEnd={onDragEnd}
                onClick={() => setSelectedId(selectedId === block.id ? null : block.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer group ${
                  selectedId === block.id
                    ? "border-brand bg-brand/5 ring-1 ring-brand shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                } ${"idx" in (dragFrom ?? {}) && (dragFrom as {idx:number}).idx === i ? "opacity-30" : ""}`}>
                <GripVertical size={13} className="text-gray-300 cursor-grab shrink-0"/>
                <div className="flex-1 min-w-0 py-0.5 overflow-hidden">
                  <BlockPreview block={block} style={style}/>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); moveBlock(i, -1); }} disabled={i === 0}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed">
                    <ChevronUp size={13}/>
                  </button>
                  <button onClick={e => { e.stopPropagation(); moveBlock(i, 1); }} disabled={i === blocks.length - 1}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed">
                    <ChevronDown size={13}/>
                  </button>
                  <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }}
                    className="p-0.5 rounded text-gray-400 hover:text-red-500 ml-0.5">
                    <X size={13}/>
                  </button>
                </div>
              </div>
              <DropZone idx={i + 1}
                active={
                  dropTarget === i + 1 && isDragging &&
                  !("idx" in (dragFrom ?? {}) && Math.abs((dragFrom as {idx:number}).idx - (i + 1)) <= 1)
                }
                onOver={onDragOver} onDrop={onDrop}/>
            </div>
          ))}
        </div>
      </div>

      {/* ── Properties ── */}
      <div className="w-[200px] shrink-0 border-l bg-white flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-2 border-b bg-gray-50">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Özellikler</p>
        </div>
        <PropsPanel
          block={selectedBlock}
          onUpdate={patchBlock}
          onDelete={() => selectedBlock && removeBlock(selectedBlock.id)}
          hint={propHint}
        />
      </div>
    </div>
  );
}

// ── Main TemplateEditor ───────────────────────────────────────────────────────

export default function TemplateEditor({ tenantId, template }: { tenantId: string; template: Template; }) {
  const router = useRouter();
  const { T } = useLang();

  const initialCfg = htmlToConfig(template.html_content);
  const [mode, setMode]       = useState<"visual" | "html" | "preview">(initialCfg ? "visual" : "html");
  const [config, setConfig]   = useState<BuilderConfig>(initialCfg ?? { v: 1, style: DEFAULT_STYLE, blocks: [] });
  const [html, setHtml]       = useState(template.html_content);
  const [name, setName]       = useState(template.name);
  const [isDefault, setIsDefault] = useState(template.is_default);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // Sync: when config changes in visual mode, keep html in sync
  function handleConfigChange(c: BuilderConfig) {
    setConfig(c);
    setHtml(configToHtml(c));
    if (mode === "preview") doPreview(configToHtml(c));
  }

  // Sync: when html changes in html mode, don't try to parse back (destructive)
  function handleHtmlChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setHtml(v);
    debouncedPreview(v);
  }

  const debouncedPreview = useCallback(
    debounce(async (content: string) => {
      try {
        const res = await previewTemplateAction(tenantId, content, SAMPLE_USER);
        setPreviewHtml(res.html);
      } catch {}
    }, 600),
    [tenantId],
  );

  async function doPreview(content: string) {
    try {
      const res = await previewTemplateAction(tenantId, content, SAMPLE_USER);
      setPreviewHtml(res.html);
    } catch {}
  }

  function switchMode(m: "visual" | "html" | "preview") {
    if (m === "visual" && mode !== "visual") {
      // If coming from html mode, try to re-parse. If no config, warn.
      const parsed = htmlToConfig(html);
      if (parsed) {
        setConfig(parsed);
      } else if (html.trim() && !confirm(T.templates.editor_convert_visual + "\n\n(Mevcut HTML kaybedilecek)")) {
        return;
      } else {
        setConfig({ v: 1, style: DEFAULT_STYLE, blocks: [] });
      }
    }
    if (m === "html" && mode === "visual") {
      setHtml(configToHtml(config));
    }
    if (m === "preview") {
      const content = mode === "visual" ? configToHtml(config) : html;
      doPreview(content);
    }
    setMode(m);
  }

  async function handleSave() {
    setSaving(true);
    const content = mode === "visual" ? configToHtml(config) : html;
    try {
      await updateTemplateAction(tenantId, template.id, { name, html_content: content, is_default: isDefault });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`${T.common.confirm_delete} "${name}"?`)) return;
    await deleteTemplateAction(tenantId, template.id);
    router.push(`/tenants/${tenantId}/templates`);
    router.refresh();
  }

  const tabs: { key: "visual" | "html" | "preview"; label: string; icon: React.ReactNode }[] = [
    { key: "visual",   label: T.templates.editor_visual_tab,   icon: <Wand2 size={13}/> },
    { key: "html",     label: T.templates.editor_html_tab,     icon: <Code size={13}/> },
    { key: "preview",  label: T.templates.editor_preview_tab,  icon: <Eye size={13}/> },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3 shrink-0 flex-wrap gap-y-2">
        <input value={name} onChange={e => setName(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm font-medium w-52 focus:outline-none focus:ring-2 focus:ring-brand"/>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)}/>
          {T.templates.editor_default_label}
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={14}/> {T.templates.editor_delete}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
            <Save size={14}/>
            {saved ? T.templates.editor_saved : saving ? T.templates.editor_saving : T.templates.editor_save}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-3 shrink-0 items-center">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => switchMode(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === tab.key ? "bg-brand text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
        {mode === "preview" && (
          <span className="ml-3 text-xs text-gray-400">
            {T.templates.editor_sample_label} {SAMPLE_USER.display_name} · {SAMPLE_USER.job_title}
          </span>
        )}
        {mode === "html" && !htmlToConfig(html) && (
          <span className="ml-3 text-xs text-amber-500 flex items-center gap-1">
            <Code size={11}/> {T.templates.editor_has_no_config}
          </span>
        )}
      </div>

      {/* Content */}
      {mode === "visual" && (
        <VisualBuilder
          config={config}
          onChange={handleConfigChange}
          emptyHint={T.templates.editor_visual_empty}
          starterPrompt={T.templates.editor_starter_confirm}
          removeLabel={T.templates.editor_remove_block}
          propHint={T.templates.editor_prop_hint}
        />
      )}

      {mode === "html" && (
        <div className="flex-1 min-h-0 rounded-xl border overflow-hidden">
          <textarea value={html} onChange={handleHtmlChange} spellCheck={false}
            className="w-full h-full p-4 font-mono text-xs resize-none focus:outline-none bg-gray-950 text-green-300"/>
        </div>
      )}

      {mode === "preview" && (
        <div className="flex-1 min-h-0 rounded-xl border overflow-auto bg-white p-6">
          <p className="text-xs text-gray-400 mb-4 border-b pb-2">{T.templates.editor_simulated}</p>
          <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{T.portal.sample_body}</p>
          {previewHtml
            ? <div dangerouslySetInnerHTML={{ __html: previewHtml }}/>
            : <p className="text-gray-400 text-xs italic">{T.templates.editor_preview_placeholder}</p>}
        </div>
      )}
    </div>
  );
}
