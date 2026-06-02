"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { useMetaMask } from "@/hooks/useMetaMask";
import {
  LinkIcon,
  WalletIcon,
  UserIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Loader2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-client";

const steps = [
  { id: 1, title: "Data Diri", icon: <UserIcon className="w-4 h-4" /> },
  { id: 2, title: "Connect Wallet", icon: <WalletIcon className="w-4 h-4" /> },
  { id: 3, title: "Konfirmasi", icon: <CheckCircle2Icon className="w-4 h-4" /> },
];

export default function RegisterPage() {
  const { account, connect, shortAddress } = useMetaMask();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", nik: "", email: "" });
  const [touched, setTouched] = useState({ fullName: false, nik: false, email: false });

  const errors = {
    fullName: touched.fullName && !form.fullName ? "Nama lengkap wajib diisi." : "",
    nik: touched.nik && form.nik.length !== 16 ? (form.nik.length === 0 ? "NIK wajib diisi." : "NIK harus 16 digit.") : "",
    email: touched.email && (!form.email || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) ? "Format email tidak valid." : "",
  };

  const isStep1Valid = form.fullName && form.nik.length === 16 && /^[^@]+@[^@]+\.[^@]+$/.test(form.email);

  const handleNext = () => {
    if (currentStep === 1) {
      setTouched({ fullName: true, nik: true, email: true });
      if (!isStep1Valid) {
        toast.error("Harap lengkapi semua data diri dengan benar.");
        return;
      }
    }
    if (currentStep === 2 && !account) {
      toast.error("Hubungkan MetaMask Anda terlebih dahulu.");
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = async () => {
    if (!account) {
      toast.error("Hubungkan MetaMask Anda terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          walletAddress: account,
        }),
      });
      toast.success("Pendaftaran berhasil! Akun siap digunakan.");
      setCurrentStep(4); // Done
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pendaftaran gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 aurora-bg py-12">
      <div className="absolute inset-0 bg-bg-base/60" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-2xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <LinkIcon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-2xl blur-xl opacity-50 -z-10 scale-110" />
            </div>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Daftar ChainVote</h1>
          <p className="text-text-muted text-sm mt-1">Satu akun, satu wallet, satu suara.</p>
        </div>

        {/* Steps Indicator */}
        {currentStep <= 3 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${currentStep === step.id
                  ? "bg-primary text-white"
                  : currentStep > step.id
                    ? "bg-success/15 text-success border border-success/20"
                    : "bg-bg-card text-text-muted border border-primary/20"
                  }`}>
                  {currentStep > step.id ? <CheckCircle2Icon className="w-3.5 h-3.5" /> : step.icon}
                  {step.title}
                </div>
                {i < steps.length - 1 && <div className="w-6 h-px bg-border-subtle" />}
              </div>
            ))}
          </div>
        )}

        <div className="glass-card rounded-3xl p-8 neon-border">
          <AnimatePresence mode="wait">
            {/* Step 1: Data Diri */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display font-bold text-lg text-text-primary mb-6">Data Diri</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Nama Lengkap *</label>
                    <Input
                      placeholder="Masukkan nama lengkap sesuai KTP"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                      className={`bg-bg-elevated border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary ${errors.fullName ? "border-error/50 focus:border-error" : ""}`}
                    />
                    {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">NIK (16 Digit) *</label>
                    <Input
                      placeholder="1234567890123456"
                      maxLength={16}
                      value={form.nik}
                      onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })}
                      onBlur={() => setTouched((t) => ({ ...t, nik: true }))}
                      className={`bg-bg-elevated border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary font-mono ${errors.nik ? "border-error/50 focus:border-error" : ""}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-text-muted">
                        NIK akan di-hash SHA-256 dan tidak pernah disimpan dalam bentuk plain text.
                      </p>
                      <span className={`text-xs font-mono ${form.nik.length === 16 ? "text-success" : "text-text-muted"}`}>{form.nik.length}/16</span>
                    </div>
                    {errors.nik && <p className="text-xs text-error mt-0.5">{errors.nik}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Email *</label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      className={`bg-bg-elevated border-primary/20 text-text-primary placeholder:text-text-muted focus:border-primary ${errors.email ? "border-error/50 focus:border-error" : ""}`}
                    />
                    {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Wallet */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display font-bold text-lg text-text-primary mb-2">Hubungkan Wallet</h2>
                <p className="text-sm text-text-muted mb-6">
                  Satu wallet hanya bisa terikat ke satu akun. Wallet tidak dapat diubah setelah pendaftaran.
                </p>
                {account ? (
                  <div className="p-5 rounded-2xl bg-success/8 border border-success/20 text-center">
                    <CheckCircle2Icon className="w-10 h-10 text-success mx-auto mb-3" />
                    <p className="text-sm text-text-secondary mb-1">Wallet terhubung</p>
                    <p className="font-mono text-xs text-text-muted break-all">{account}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-primary/20 flex items-center justify-center mx-auto mb-4">
                      <WalletIcon className="w-8 h-8 text-text-muted" />
                    </div>
                    <Button
                      onClick={connect}
                      className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2"
                    >
                      <WalletIcon className="w-4 h-4" />
                      Hubungkan MetaMask
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-display font-bold text-lg text-text-primary mb-6">Konfirmasi Data</h2>
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Nama Lengkap", value: form.fullName },
                    { label: "NIK", value: form.nik.replace(/(.{4})/g, "$1 ").trim() + " (akan di-hash)" },
                    { label: "Email", value: form.email },
                    { label: "Wallet", value: shortAddress ?? account ?? "-" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center p-3 rounded-xl bg-bg-elevated border border-primary/20">
                      <span className="text-xs text-text-muted">{label}</span>
                      <span className="text-sm text-text-primary font-medium max-w-[60%] text-right truncate">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <ShieldCheckIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted">
                    Dengan mendaftar, Anda menyetujui bahwa data ini digunakan untuk keperluan voting berbasis blockchain yang transparan.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Done */}
            {currentStep === 4 && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <CheckCircle2Icon className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="font-display font-bold text-xl text-text-primary mb-2">Pendaftaran Berhasil!</h2>
                <p className="text-sm text-text-muted mb-6">
                  Akun Anda berhasil dibuat dan terhubung dengan wallet MetaMask.
                </p>
                <ButtonLink
                  href="/login"
                  className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2 inline-flex items-center justify-center"
                >
                  Masuk ke Akun <ArrowRightIcon className="w-4 h-4" />
                </ButtonLink>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep <= 3 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-primary/20">
              {/* Kembali only shown on step 2 */}
              {currentStep === 2 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                >
                  <ArrowLeftIcon className="w-4 h-4 shrink-0 pointer-events-none" /> Kembali
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button onClick={handleNext} className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2">
                  Lanjut <ArrowRightIcon className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-linear-to-r from-primary to-secondary text-white border-0 gap-2"
                >
                  {isSubmitting ? <><Loader2Icon className="w-4 h-4 animate-spin" />Mendaftar...</> : <>Daftar Sekarang <ArrowRightIcon className="w-4 h-4" /></>}
                </Button>
              )}
            </div>
          )}
        </div>

        {currentStep <= 3 && (
          <p className="text-sm text-text-muted text-center mt-4">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary hover:text-primary-light">Login</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
