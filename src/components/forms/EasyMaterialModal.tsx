import React, { useState } from "react";
import { ModalWrapper } from "../common/ModalWrapper";
import { Language, MaterialCategory, MaterialItem, Project } from "../../types";
import { getTranslation } from "../../i18n/translations";
import { todayStr } from "../../utils/formatters";
import { Package, MapPin, Check } from "lucide-react";

type EasyMaterialModalProps = {
  projects: Project[];
  defaultProject?: string;
  lang: Language;
  onSave: (material: Omit<MaterialItem, "id">) => void;
  onClose: () => void;
};

export function EasyMaterialModal({
  projects,
  defaultProject,
  lang,
  onSave,
  onClose,
}: EasyMaterialModalProps) {
  const t = getTranslation(lang);

  const [selectedSite, setSelectedSite] = useState(
    defaultProject && defaultProject !== "ALL" ? defaultProject : projects[0]?.name || ""
  );
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("Binding");
  const [unit, setUnit] = useState("Bags");
  const [quantity, setQuantity] = useState("100");
  const [minStock, setMinStock] = useState("20");
  const [pricePerUnit, setPricePerUnit] = useState("380");
  const [supplierName, setSupplierName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      alert(t.selectSiteFirst);
      return;
    }

    onSave({
      name: name.trim(),
      category,
      unit,
      quantity: parseFloat(quantity) || 0,
      minStock: parseFloat(minStock) || 0,
      pricePerUnit: parseFloat(pricePerUnit) || 0,
      project: selectedSite,
      lastUpdated: todayStr(),
      supplierName: supplierName.trim() || undefined,
    });

    onClose();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.addMaterial}</h2>
          <p className="text-xs text-slate-500">Record inventory items, minimum threshold &amp; rates</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
          Stock
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <MapPin size={14} className="text-blue-600" /> {t.siteRequired} *
          </label>
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-800 transition"
          >
            {projects.map(p => (
              <option key={p.id} value={p.name}>🏗️ {p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Material Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Cement (OPC 53 Grade) / River Sand"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as MaterialCategory)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-slate-800"
            >
              <option value="Binding">Binding (Cement / Lime)</option>
              <option value="Steel">Steel / TMT / Wire</option>
              <option value="Aggregate">Aggregate (Sand / Kapchi)</option>
              <option value="Masonry">Masonry (Bricks / Blocks)</option>
              <option value="Plumbing">Plumbing &amp; Pipes</option>
              <option value="Electrical">Electrical &amp; Conduits</option>
              <option value="Finishing">Finishing (Paints / Tiles)</option>
              <option value="Other">Other Material</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
            <input
              type="text"
              required
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="Bags / Kg / Brass / Cu.M"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Qty *</label>
            <input
              type="number"
              required
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Alert Level</label>
            <input
              type="number"
              value={minStock}
              onChange={e => setMinStock(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Price / Unit (Rs.)</label>
            <input
              type="number"
              value={pricePerUnit}
              onChange={e => setPricePerUnit(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Dealer Name</label>
          <input
            type="text"
            value={supplierName}
            onChange={e => setSupplierName(e.target.value)}
            placeholder="e.g. Shree Ram Building Material Agency"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-800"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 shadow-md"
          >
            <Check size={16} />
            {t.save}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
