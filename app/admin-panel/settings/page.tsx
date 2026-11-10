"use client";

import { useState, useEffect } from "react";
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  DEFAULT_FOOTER_INFO_LINKS,
  DEFAULT_FOOTER_HELP_LINKS,
  type StoreSettings,
} from "@/lib/firestoreSettings";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadSettings()
      .then((s) => {
        // ✅ FORCE arrays to exist, even if Firestore data is old
        setSettings({
          ...s,
          footerInfoLinks: Array.isArray(s.footerInfoLinks) && s.footerInfoLinks.length > 0
            ? s.footerInfoLinks
            : DEFAULT_FOOTER_INFO_LINKS,
          footerHelpLinks: Array.isArray(s.footerHelpLinks) && s.footerHelpLinks.length > 0
            ? s.footerHelpLinks
            : DEFAULT_FOOTER_HELP_LINKS,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // ✅ Ensure arrays are valid before saving
      const toSave = {
        ...settings,
        footerInfoLinks: Array.isArray(settings.footerInfoLinks) && settings.footerInfoLinks.length > 0
          ? settings.footerInfoLinks
          : DEFAULT_FOOTER_INFO_LINKS,
        footerHelpLinks: Array.isArray(settings.footerHelpLinks) && settings.footerHelpLinks.length > 0
          ? settings.footerHelpLinks
          : DEFAULT_FOOTER_HELP_LINKS,
      };
      await saveSettings(toSave);
      showToast("✓ Settings saved");
    } catch (err) {
      showToast("✗ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8546B] border-t-transparent" />
      </div>
    );
  }

  // ✅ DEFENSIVE: Never let these be undefined
  const infoLinks = Array.isArray(settings.footerInfoLinks) && settings.footerInfoLinks.length > 0
    ? settings.footerInfoLinks
    : DEFAULT_FOOTER_INFO_LINKS;
  const helpLinks = Array.isArray(settings.footerHelpLinks) && settings.footerHelpLinks.length > 0
    ? settings.footerHelpLinks
    : DEFAULT_FOOTER_HELP_LINKS;

  return (
    <div className="min-h-screen bg-[#FFF6F6] p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[#2B1A24] px-4 py-3 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Store Settings</h1>
            <p className="mt-1 text-sm text-[#6B5558]">Everything editable — no code changes needed</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#E8546B] px-6 py-3 text-sm font-bold text-white shadow-orange-glow hover:bg-[#b02a58] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>

        <div className="space-y-5">
          <Section title="Store Info">
            <TextField label="Store Name" value={settings.storeName || ""} onChange={(v) => update("storeName", v)} />
            <TextField label="Logo URL" value={settings.logoUrl || ""} onChange={(v) => update("logoUrl", v)} placeholder="https://i.ibb.co/..." />
            <TextField label="Owner Name" value={settings.ownerName || ""} onChange={(v) => update("ownerName", v)} />
            <TextArea label="Footer Description" value={settings.footerDescription || ""} onChange={(v) => update("footerDescription", v)} rows={3} />
          </Section>

          <Section title="Contact Information">
            <TextField label="Phone" value={settings.contactPhone || ""} onChange={(v) => update("contactPhone", v)} />
            <TextField label="Email" value={settings.contactEmail || ""} onChange={(v) => update("contactEmail", v)} />
            <TextField label="Address" value={settings.contactAddress || ""} onChange={(v) => update("contactAddress", v)} />
            <TextField label="Business Hours" value={settings.contactHours || ""} onChange={(v) => update("contactHours", v)} />
          </Section>

          <Section title="Social Media Links">
            <TextField label="Facebook URL" value={settings.facebookUrl || ""} onChange={(v) => update("facebookUrl", v)} placeholder="https://facebook.com/yourpage" />
            <TextField label="Instagram URL" value={settings.instagramUrl || ""} onChange={(v) => update("instagramUrl", v)} placeholder="https://instagram.com/yourprofile" />
            <TextField label="WhatsApp Number (social icon)" value={settings.whatsappNumber || ""} onChange={(v) => update("whatsappNumber", v)} placeholder="8801689768307" />
            <TextField label="WhatsApp Chat Number (product page)" value={settings.whatsappChatNumber || ""} onChange={(v) => update("whatsappChatNumber", v)} placeholder="8801689768307" />
          </Section>

          <Section title="Newsletter">
            <TextField label="Newsletter Title" value={settings.newsletterTitle || ""} onChange={(v) => update("newsletterTitle", v)} />
            <TextField label="Newsletter Subtitle" value={settings.newsletterSubtitle || ""} onChange={(v) => update("newsletterSubtitle", v)} />
          </Section>

          <Section title="Shipping">
            <NumField label="Flat Shipping Charge (৳)" value={settings.shippingCharge || 0} onChange={(v) => update("shippingCharge", v)} />
            <TextField label="Estimated Delivery Days" value={settings.estimatedDeliveryDays || ""} onChange={(v) => update("estimatedDeliveryDays", v)} placeholder="15–25 Days" />
          </Section>

          <Section title="Payment Methods">
            <TextField label="bKash Number" value={settings.bkashNumber || ""} onChange={(v) => update("bkashNumber", v)} />
            <TextField label="Nagad Number" value={settings.nagadNumber || ""} onChange={(v) => update("nagadNumber", v)} />
            <TextField label="Bank Name" value={settings.bankName || ""} onChange={(v) => update("bankName", v)} />
            <TextField label="Bank Account Number" value={settings.bankAccountNumber || ""} onChange={(v) => update("bankAccountNumber", v)} />
            <TextField label="Bank Account Holder" value={settings.bankAccountHolder || ""} onChange={(v) => update("bankAccountHolder", v)} />
          </Section>

          <Section title="Footer — Information Links">
            <p className="text-xs text-[#6B5558] mb-2">These appear under the "Information" column.</p>
            {infoLinks.map((link, idx) => (
              <div key={link.id} className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => {
                    const next = [...infoLinks];
                    next[idx] = { ...next[idx], label: e.target.value };
                    update("footerInfoLinks", next);
                  }}
                  placeholder="Label"
                  className="rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) => {
                    const next = [...infoLinks];
                    next[idx] = { ...next[idx], href: e.target.value };
                    update("footerInfoLinks", next);
                  }}
                  placeholder="/about"
                  className="rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm"
                />
              </div>
            ))}
          </Section>

          <Section title="Footer — Help & Support Links">
            <p className="text-xs text-[#6B5558] mb-2">These appear under the "Help & Support" column.</p>
            {helpLinks.map((link, idx) => (
              <div key={link.id} className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => {
                    const next = [...helpLinks];
                    next[idx] = { ...next[idx], label: e.target.value };
                    update("footerHelpLinks", next);
                  }}
                  placeholder="Label"
                  className="rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) => {
                    const next = [...helpLinks];
                    next[idx] = { ...next[idx], href: e.target.value };
                    update("footerHelpLinks", next);
                  }}
                  placeholder="/contact"
                  className="rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2 text-sm"
                />
              </div>
            ))}
          </Section>

          <div className="flex justify-end pb-10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#E8546B] px-8 py-3 text-sm font-bold text-white shadow-orange-glow hover:bg-[#b02a58] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save All Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm space-y-3">
      <h2 className="font-serif text-lg font-bold text-[#2B1A24]">{title}</h2>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#6B5558]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#6B5558]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-none rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none"
      />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#6B5558]">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-[#FAD4DD] bg-[#FFF6F6] px-3 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none"
      />
    </div>
  );
}