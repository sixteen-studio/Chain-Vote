"use client";

import { motion } from "framer-motion";
import { ButtonLink } from "@/components/ui/button-link";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { VoteSessionCard } from "@/components/voting/VoteSessionCard";
import { mockCandidates, mockVotingSessions, mockDashboardStats } from "@/lib/mock-data";
import {
  ShieldCheckIcon,
  LinkIcon,
  GlobeIcon,
  ArrowRightIcon,
  LockIcon,
  ZapIcon,
  BarChart3Icon,
  UsersIcon,
  CheckSquareIcon,
  UserPlusIcon,
  BarChartIcon,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export default function LandingContent() {
  const { data: stats } = useApiResource("/api/public/stats", mockDashboardStats);
  const { data: votingSessions } = useApiResource<typeof mockVotingSessions>(
    "/api/sessions",
    mockVotingSessions
  );
  const { data: candidates } = useApiResource<typeof mockCandidates>("/api/candidates", mockCandidates);
  const activeSessions = votingSessions.filter((s) => s.status === "ACTIVE");
  const activeCandidates = candidates.filter((c) =>
    activeSessions.some((s) => s.id === c.votingSessionId)
  );

  return (
    <div className="relative">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden aurora-bg">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <div className="badge-active inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                Berjalan di Hardhat Localhost
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[1.05] tracking-tight mb-6"
            >
              Voting{" "}
              <span className="gradient-text glow-text">Transparan</span>
              <br />
              di{" "}
              <span className="relative">
                Blockchain
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-linear-to-r from-primary to-secondary rounded-full opacity-60" />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Setiap suara dicatat immutable di smart contract Ethereum —
              transparan, aman, dan tidak dapat dimanipulasi.
              Satu NIK, satu wallet, satu suara.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4">
              <ButtonLink
                href="/vote"
                size="lg"
                className="bg-linear-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary text-white border-0 gap-2 px-8 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 text-base inline-flex items-center"
              >
                <CheckSquareIcon className="w-5 h-5" />
                Mulai Voting
                <ArrowRightIcon className="w-5 h-5" />
              </ButtonLink>
              <ButtonLink
                href="/candidates"
                size="lg"
                variant="outline"
                className="border-primary/20 hover:border-border-strong text-text-secondary hover:text-text-primary bg-transparent gap-2 px-8 text-base inline-flex items-center"
              >
                <UsersIcon className="w-5 h-5" />
                Lihat Kandidat
              </ButtonLink>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={itemVariants}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted"
            >
              {[
                { icon: <ShieldCheckIcon className="w-4 h-4" />, label: "NIK Terenkripsi" },
                { icon: <LinkIcon className="w-4 h-4" />, label: "On-Chain Audit" },
                { icon: <LockIcon className="w-4 h-4" />, label: "Anti Double Vote" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-text-muted">
                  <span className="text-primary">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-muted"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-primary/60 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              {
                value: stats.totalVotes.toLocaleString("id-ID"),
                label: "Total Suara",
                icon: <BarChart3Icon className="w-5 h-5" />,
              },
              {
                value: stats.activeVotingSessions,
                label: "Voting Aktif",
                icon: <ZapIcon className="w-5 h-5" />,
              },
              {
                value: stats.totalUsers.toLocaleString("id-ID"),
                label: "Voter Terdaftar",
                icon: <GlobeIcon className="w-5 h-5" />,
              },
              {
                value: stats.totalVotingSessions,
                label: "Total Sesi",
                icon: <ShieldCheckIcon className="w-5 h-5" />,
              },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="glass-card rounded-2xl p-6 text-center hover-lift">
                  <div
                    className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-3 text-white"
                  >
                    {stat.icon}
                  </div>
                  <p className="font-display font-extrabold text-3xl gradient-text">
                    {stat.value}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── KANDIDAT PREVIEW ─── */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">
                Kandidat Aktif
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-3">
                Kenali Para Kandidat
              </h2>
              <p className="text-text-muted max-w-xl mx-auto">
                Pelajari profil dan visi misi kandidat dari sesi voting yang sedang aktif sebelum memberikan suara Anda.
              </p>
            </motion.div>

            {activeCandidates.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                {activeCandidates.slice(0, 4).map((candidate, i) => (
                  <div key={candidate.id} className="w-full max-w-70 sm:w-70">
                    <CandidateCard candidate={candidate} index={i} showVotes />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted">
                Tidak ada kandidat dari voting aktif saat ini.
              </div>
            )}

            <motion.div variants={itemVariants} className="text-center">
              <ButtonLink
                href="/candidates"
                variant="outline"
                className="border-primary/20 hover:border-border-strong gap-2 text-text-secondary hover:text-text-primary bg-transparent inline-flex items-center"
              >
                <UsersIcon className="w-4 h-4" />
                Lihat Semua Kandidat
                <ArrowRightIcon className="w-4 h-4" />
              </ButtonLink>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FITUR ─── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">
                Keunggulan
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary">
                Mengapa ChainVote?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <GlobeIcon className="w-6 h-6" />,
                  title: "Transparan",
                  desc: "Setiap transaksi suara tercatat di blockchain Hardhat lokal yang bisa diaudit dari log contract dan block deployment.",
                },
                {
                  icon: <ShieldCheckIcon className="w-6 h-6" />,
                  title: "Aman & Terverifikasi",
                  desc: "Identitas voter diverifikasi melalui NIK, email, dan MetaMask wallet. Satu NIK = satu akun = satu suara — tidak bisa double voting.",
                },
                {
                  icon: <LinkIcon className="w-6 h-6" />,
                  title: "Terdesentralisasi",
                  desc: "Smart contract berjalan di jaringan Ethereum — tidak ada single point of failure atau manipulasi terpusat oleh pihak manapun.",
                },
              ].map((feature, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <div
                    className="glass-card rounded-2xl p-7 h-full hover-lift"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.15) 0%, transparent 60%)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-secondary flex items-center justify-center mb-5 text-white shadow-lg">
                      {feature.icon}
                    </div>
                    <h3 className="font-display font-bold text-xl text-text-primary mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-text-muted leading-relaxed text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── VOTING PREVIEW ─── */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="text-center mb-12">
              <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-3">
                Sesi Voting
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-3">
                Voting yang Sedang Berlangsung
              </h2>
              <p className="text-text-muted max-w-xl mx-auto">
                Berikan suara Anda pada sesi voting yang sedang aktif. Suara Anda dicatat permanen di blockchain.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {votingSessions.slice(0, 3).map((session, i) => (
                <VoteSessionCard key={session.id} session={session} index={i} />
              ))}
            </div>

            <motion.div variants={itemVariants} className="text-center">
              <ButtonLink
                href="/vote"
                size="lg"
                className="bg-linear-to-r from-primary to-secondary hover:from-primary-dark text-white border-0 gap-2 shadow-xl shadow-primary/20 inline-flex items-center"
              >
                <CheckSquareIcon className="w-5 h-5" />
                Lihat Semua Voting
                <ArrowRightIcon className="w-5 h-5" />
              </ButtonLink>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA BOTTOM ─── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass-card rounded-3xl p-12 relative overflow-hidden neon-border">
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 pointer-events-none" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-primary/30 animate-float">
                  <LinkIcon className="w-8 h-8" />
                </div>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-text-primary mb-4">
                  Siap Berpartisipasi?
                </h2>
                <p className="text-text-muted mb-8 max-w-md mx-auto">
                  Daftar sekarang dengan NIK + email + MetaMask wallet dan berikan suara Anda yang transparan di blockchain.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <ButtonLink
                    href="/register"
                    size="lg"
                    className="bg-linear-to-r from-primary to-secondary hover:from-primary-dark text-white border-0 gap-2 shadow-xl shadow-primary/25 px-8 inline-flex items-center"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    Daftar Sekarang
                    <ArrowRightIcon className="w-5 h-5" />
                  </ButtonLink>
                  <ButtonLink
                    href="/results"
                    size="lg"
                    variant="outline"
                    className="border-border-strong hover:border-primary text-text-secondary hover:text-primary bg-transparent px-8 inline-flex items-center gap-2"
                  >
                    <BarChartIcon className="w-5 h-5" />
                    Lihat Hasil Voting
                  </ButtonLink>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
