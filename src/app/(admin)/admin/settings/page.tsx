"use client";

import { useState } from "react";
import type { SVGProps } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SaveIcon, ShieldIcon, BellIcon, PaletteIcon, DatabaseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("umum");
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "ChainVote",
    adminEmail: "admin@chainvote.com",
    rpcUrl: "http://127.0.0.1:8545",
    enableEmailNotifications: true,
    enableTelegramNotifications: false,
    alertNewUser: true,
    alertVotingEnd: true,
    enable2FA: false,
    sessionTimeout: "30",
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Pengaturan berhasil disimpan.");
    setIsSaving(false);
  };

  const tabs = [
    { id: "umum", label: "Umum", icon: <SettingsIcon className="w-4 h-4" /> },
    { id: "blockchain", label: "Blockchain", icon: <DatabaseIcon className="w-4 h-4" /> },
    { id: "notifikasi", label: "Notifikasi", icon: <BellIcon className="w-4 h-4" /> },
    { id: "keamanan", label: "Keamanan", icon: <ShieldIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi preferensi aplikasi, blockchain RPC, notifikasi, dan keamanan."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Pengaturan" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Tabs */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border border-primary/20 p-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Kategori</h3>
            <div className="flex flex-col gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-linear-to-r from-primary/20 to-primary/5 text-primary border border-primary/30 shadow-[inset_0_0_15px_rgba(var(--primary-color),0.1)]"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent"
                  )}
                >
                  <span className={cn("flex items-center justify-center p-1.5 rounded-lg shrink-0", activeTab === tab.id ? "bg-primary/20" : "bg-bg-elevated")}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === "umum" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-primary/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <PaletteIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-lg">Pengaturan Umum</h3>
                    <p className="text-xs text-text-muted mt-0.5">Kelola identitas platform dan informasi kontak utama.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 block">Nama Platform</label>
                      <Input
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="bg-bg-elevated border-primary/20 text-text-primary focus:border-primary w-full h-11"
                        placeholder="Masukkan nama platform"
                      />
                      <p className="text-xs text-text-muted mt-1.5">Nama ini akan ditampilkan pada header dan email notifikasi.</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 block">Email Administrator</label>
                      <Input
                        type="email"
                        value={settings.adminEmail}
                        onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                        className="bg-bg-elevated border-primary/20 text-text-primary focus:border-primary w-full h-11"
                        placeholder="admin@domain.com"
                      />
                      <p className="text-xs text-text-muted mt-1.5">Email utama untuk menerima pembaruan sistem dan peringatan keamanan.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-primary/5 border-t border-primary/10 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 px-6 h-10"
                >
                  <SaveIcon className="w-4 h-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === "blockchain" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-primary/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <DatabaseIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-lg">Konfigurasi Web3</h3>
                    <p className="text-xs text-text-muted mt-0.5">Pengaturan koneksi node RPC untuk interaksi smart contract.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 block">Default RPC URL (Hardhat Localhost)</label>
                    <Input
                      value={settings.rpcUrl}
                      onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
                      className="bg-bg-elevated border-primary/20 text-text-primary font-mono text-sm focus:border-primary w-full h-11"
                      placeholder="http://127.0.0.1:8545"
                    />
                    <p className="text-xs text-text-muted mt-1.5 leading-relaxed">Digunakan untuk <i>server-side reading</i> dari smart contract jika MetaMask pengguna tidak tersedia. Pastikan URL valid dan memiliki kuota <i>request</i> yang cukup.</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-primary/5 border-t border-primary/10 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 px-6 h-10"
                >
                  <SaveIcon className="w-4 h-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === "notifikasi" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-primary/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <BellIcon className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-lg">Notifikasi Sistem</h3>
                    <p className="text-xs text-text-muted mt-0.5">Atur pemberitahuan apa saja yang ingin Anda terima via email.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-bg-elevated hover:bg-white/5 cursor-pointer hover:border-primary/30 transition-all">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={settings.enableEmailNotifications}
                        onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                        className="rounded border-border-strong text-primary focus:ring-primary w-4 h-4 bg-transparent"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Notifikasi Email Utama</p>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">Kirim pembaruan penting mengenai sistem secara langsung ke email administrator yang terdaftar.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-bg-elevated hover:bg-white/5 cursor-pointer hover:border-primary/30 transition-all">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={settings.alertNewUser}
                        onChange={(e) => setSettings({ ...settings, alertNewUser: e.target.checked })}
                        className="rounded border-border-strong text-primary focus:ring-primary w-4 h-4 bg-transparent"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Peringatan Pengguna Baru</p>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">Beri tahu secara instan setiap kali ada pengguna baru yang berhasil mendaftar ke dalam platform.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-bg-elevated hover:bg-white/5 cursor-pointer hover:border-primary/30 transition-all">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={settings.alertVotingEnd}
                        onChange={(e) => setSettings({ ...settings, alertVotingEnd: e.target.checked })}
                        className="rounded border-border-strong text-primary focus:ring-primary w-4 h-4 bg-transparent"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Laporan Voting Selesai</p>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">Terima ringkasan hasil secara otomatis setiap kali sebuah sesi voting berakhir.</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-primary/5 border-t border-primary/10 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 px-6 h-10"
                >
                  <SaveIcon className="w-4 h-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === "keamanan" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl border border-primary/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <ShieldIcon className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-lg">Keamanan Akses</h3>
                    <p className="text-xs text-text-muted mt-0.5">Tingkatkan keamanan akun admin dan kelola sesi aktif.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-bg-elevated hover:bg-white/5 cursor-pointer hover:border-primary/30 transition-all">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={settings.enable2FA}
                        onChange={(e) => setSettings({ ...settings, enable2FA: e.target.checked })}
                        className="rounded border-border-strong text-primary focus:ring-primary w-4 h-4 bg-transparent"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Autentikasi Dua Faktor (2FA)</p>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">Tingkatkan lapisan keamanan dengan mewajibkan kode verifikasi OTP setiap kali login ke dashboard.</p>
                    </div>
                  </label>

                  <div>
                    <label className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 block">Timeout Sesi Aktif (Menit)</label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                        className="bg-bg-elevated border-primary/20 text-text-primary focus:border-primary w-24 h-11 text-center font-medium"
                        min="5"
                        max="1440"
                      />
                      <span className="text-sm text-text-muted font-medium">Menit</span>
                    </div>
                    <p className="text-xs text-text-muted mt-2 leading-relaxed">Sesi admin akan diakhiri (logout) secara otomatis jika tidak ada aktivitas dalam rentang waktu yang ditentukan.</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-primary/5 border-t border-primary/10 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 px-6 h-10"
                >
                  <SaveIcon className="w-4 h-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
