"use client";

import { useState, useEffect } from "react";
import { 
  loadSettings, 
  saveSettings, 
  DEFAULT_SETTINGS, 
  type StoreSettings,
  DEFAULT_FOOTER_INFO_LINKS,
  DEFAULT_FOOTER_HELP_LINKS
} from "@/lib/firestoreSettings";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setSettings({ ...settings, logoUrl: data.url });
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (err) {
      alert("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  // ✅ FIXED: Properly updates the specific link in the array
  const updateInfoLink = (index: number, field: "label" | "href", value: string) => {
    const currentLinks = Array.isArray(settings.footerInfoLinks) && settings.footerInfoLinks.length > 0 
      ? [...settings.footerInfoLinks] 
      : [...DEFAULT_FOOTER_INFO_LINKS];
    
    currentLinks[index] = { ...currentLinks[index], [field]: value };
    setSettings({ ...settings, footerInfoLinks: currentLinks });
  };

  // ✅ FIXED: Properly updates the specific link in the array
  const updateHelpLink = (index: number, field: "label" | "href", value: string) => {
    const currentLinks = Array.isArray(settings.footerHelpLinks) && settings.footerHelpLinks.length > 0 
      ? [...settings.footerHelpLinks] 
      : [...DEFAULT_FOOTER_HELP_LINKS];
      
    currentLinks[index] = { ...currentLinks[index], [field]: value };
    setSettings({ ...settings, footerHelpLinks: currentLinks });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
            Settings
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Store Settings</h1>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="rounded-xl bg-[#E8546B] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#b02a58] disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* GENERAL INFO & LOGO UPLOAD */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2B1A24] mb-4">General Info</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">Store Name</label>
              <input type="text" value={settings.storeName || ""} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-2">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl border border-[#FAD4DD] bg-[#FFF6F6] flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-3xl">🖼️</span>
                  )}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="cursor-pointer rounded-lg border border-[#E8546B] bg-white px-5 py-2.5 text-xs font-bold text-[#E8546B] hover:bg-[#FFF6F6] transition-colors inline-block">
                    {uploadingLogo ? "Uploading..." : "Upload New Logo"}
                  </label>
                  <p className="text-[10px] text-[#A88F92] mt-2">PNG or JPG, max 2MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INSPECTION PRICES */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2B1A24] mb-4">Inspection Service Prices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">Video Inspection Price (৳)</label>
              <input type="number" value={settings.videoInspectionPrice || 180} onChange={(e) => setSettings({ ...settings, videoInspectionPrice: Number(e.target.value) })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">General Inspection Price (৳)</label>
              <input type="number" value={settings.basicInspectionPrice || 50} onChange={(e) => setSettings({ ...settings, basicInspectionPrice: Number(e.target.value) })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
          </div>
        </div>

        {/* SOCIAL LINKS */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2B1A24] mb-4">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">Facebook Page URL</label>
              <input type="text" value={settings.facebookUrl || ""} onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">Instagram Profile URL</label>
              <input type="text" value={settings.instagramUrl || ""} onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">WhatsApp Number</label>
              <input type="text" value={settings.whatsappNumber || ""} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
          </div>
        </div>

        {/* CONTACT INFO */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2B1A24] mb-4">Contact Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">Phone Number</label>
              <input type="text" value={settings.contactPhone || ""} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#6B5558] mb-1">Email Address</label>
              <input type="text" value={settings.contactEmail || ""} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#6B5558] mb-1">Address</label>
              <input type="text" value={settings.contactAddress || ""} onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })} className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" />
            </div>
          </div>
        </div>

        {/* FOOTER LINKS */}
        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2B1A24] mb-2">Footer — Information Links</h3>
          <p className="text-sm text-[#6B5558] mb-4">These appear under the "Information" column.</p>
          <div className="space-y-3">
            {(settings.footerInfoLinks || DEFAULT_FOOTER_INFO_LINKS).map((link, index) => (
              <div key={index} className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={link.label} 
                  onChange={(e) => updateInfoLink(index, "label", e.target.value)} 
                  placeholder="Link Name" 
                  className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" 
                />
                <input 
                  type="text" 
                  value={link.href} 
                  onChange={(e) => updateInfoLink(index, "href", e.target.value)} 
                  placeholder="/url" 
                  className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" 
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#FAD4DD] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-[#2B1A24] mb-2">Footer — Help & Support Links</h3>
          <p className="text-sm text-[#6B5558] mb-4">These appear under the "Help & Support" column.</p>
          <div className="space-y-3">
            {(settings.footerHelpLinks || DEFAULT_FOOTER_HELP_LINKS).map((link, index) => (
              <div key={index} className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={link.label} 
                  onChange={(e) => updateHelpLink(index, "label", e.target.value)} 
                  placeholder="Link Name" 
                  className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" 
                />
                <input 
                  type="text" 
                  value={link.href} 
                  onChange={(e) => updateHelpLink(index, "href", e.target.value)} 
                  placeholder="/url" 
                  className="w-full rounded-lg border border-[#FAD4DD] bg-white px-4 py-2.5 text-sm focus:border-[#E8546B] focus:outline-none" 
                />
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#E8546B] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#b02a58] disabled:opacity-50">
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>

      </div>
    </div>
  );
}