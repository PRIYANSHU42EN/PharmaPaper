"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import SubscribeButton from "@/components/video/SubscribeButton";

// ── Types ──────────────────────────────────────────────────────
interface TrialStatus {
  isTrial: boolean;
  isPremium: boolean;
  daysLeft?: number;
  trialEnd?: string;
  planType?: string;
}

interface Referral {
  referral_code: string;
  total_referrals: number;
  total_days_earned: number;
}

interface Payment {
  id: string;
  plan_type: string;
  status: string;
  amount: number;
  created_at: string;
  expires_at?: string;
}

// ── Helpers ────────────────────────────────────────────────────
function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function planLabel(type: string) {
  const map: Record<string, string> = {
    premium_monthly: "Monthly Plan",
    premium_yearly:  "Yearly Vault",
    premium_onetime: "Yearly Plan",
    video_pass:      "Video Pass",
    video_monthly:   "Video Pass (Monthly)",
    trial_free:      "Free Trial",
    trial_card:      "Card Trial",
  };
  return map[type] ?? type;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [trial, setTrial] = useState<TrialStatus>({ isTrial: false, isPremium: false });
  const [referral, setReferral] = useState<Referral>({ referral_code: "", total_referrals: 0, total_days_earned: 0 });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [videoStats, setVideoStats] = useState<{ completedCount: number; subscriptions: any[] }>({
    completedCount: 0,
    subscriptions: [],
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"overview" | "referrals" | "billing" | "completion" | "subscriptions">("overview");

  useEffect(() => {
    async function loadData() {
      try {
        const [trialRes, referralRes, paymentsRes, videoStatsRes] = await Promise.all([
          fetch("/api/trial/status"),
          fetch("/api/referral/generate"),
          fetch("/api/payments/history"),
          fetch("/api/user/video-stats"),
        ]);

        if (trialRes.ok) {
          const trialData = await trialRes.json();
          setTrial(trialData);
        }
        if (referralRes.ok) {
          const referralData = await referralRes.json();
          if (referralData.referral) {
            setReferral(referralData.referral);
          }
        }
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData);
        }
        if (videoStatsRes.ok) {
          const statsData = await videoStatsRes.json();
          if (statsData.success) {
            setVideoStats({
              completedCount: statsData.completedCount,
              subscriptions: statsData.subscriptions || [],
            });
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const referralLink = referral.referral_code
    ? `https://pharmapaper.com?ref=${referral.referral_code}`
    : "https://pharmapaper.com";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `📚 Free pharmacy notes for B.Pharm & D.Pharm!\nUse my code *${referral.referral_code}* for a FREE 14-day premium trial!\n👉 ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(`Use code ${referral.referral_code} for 14-day free trial at PharmPaper!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const trialPercent = trial.daysLeft ? Math.round((trial.daysLeft / 14) * 100) : 0;
  const milestoneNext = 5 - (referral.total_referrals % 5);
  const milestoneProgress = ((referral.total_referrals % 5) / 5) * 100;

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center font-mono text-xs tracking-wider uppercase text-brand">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #050508;
          --surface:   #0B0B0F;
          --surface2:  #14141F;
          --border:    rgba(255,255,255,0.05);
          --border2:   rgba(255,255,255,0.1);
          --indigo:    #0582CA;
          --indigo-l:  #00A6FB;
          --indigo-d:  #006494;
          --teal:      #38BDF8;
          --amber:     #fbbf24;
          --red:       #f87171;
          --green:     #4ade80;
          --text:      #F0ECE4;
          --muted:     rgba(240,236,228,0.5);
          --faint:     rgba(240,236,228,0.2);
        }

        body {
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          min-height: 100vh;
        }

        .dash { max-width: 900px; margin: 0 auto; padding: 4rem 1.5rem 6rem; }

        /* Header */
        .header { margin-bottom: 2.5rem; }
        .header-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .greeting { font-family: 'Syne', sans-serif; font-size: 1.9rem; font-weight: 800; line-height: 1.1; }
        .greeting span { color: var(--indigo-l); }
        .header-sub { color: var(--muted); font-size: 0.9rem; margin-top: .4rem; }
        .badge-premium {
          background: linear-gradient(135deg, var(--indigo-d), var(--indigo));
          color: #fff; font-size: .7rem; font-weight: 600; letter-spacing: .06em;
          padding: .35rem .85rem; border-radius: 99px; font-family: 'Syne', sans-serif;
          text-transform: uppercase;
        }

        /* Tabs */
        .tabs { display: flex; gap: .5rem; margin-bottom: 2rem; padding: .3rem; background: var(--surface); border-radius: 14px; border: 1px solid var(--border); width: fit-content; }
        .tab {
          padding: .55rem 1.3rem; border-radius: 10px; font-size: .85rem;
          font-family: 'Syne', sans-serif; font-weight: 600; cursor: pointer;
          border: none; background: transparent; color: var(--muted); transition: all .2s;
        }
        .tab.active { background: var(--surface2); color: var(--text); box-shadow: 0 1px 8px rgba(0,0,0,.4); }
        .tab:hover:not(.active) { color: var(--text); }

        /* Cards */
        .card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 1.6rem; position: relative; overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          background: linear-gradient(135deg, rgba(5,130,202,.04) 0%, transparent 60%);
          pointer-events: none;
        }
        .card-label { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-family: 'Syne', sans-serif; margin-bottom: .7rem; }
        .card-value { font-family: 'Syne', sans-serif; font-size: 2.4rem; font-weight: 800; line-height: 1; }
        .card-sub { font-size: .82rem; color: var(--muted); margin-top: .35rem; }

        /* Grid layouts */
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        @media (max-width: 640px) { .grid-3, .grid-2 { grid-template-columns: 1fr; } }

        /* Trial card */
        .trial-card {
          background: var(--surface); border-radius: 20px; padding: 1.6rem;
          border: 1px solid var(--border2); margin-bottom: 1.25rem;
          background-image: linear-gradient(135deg, rgba(5,130,202,.08) 0%, rgba(56,189,248,.04) 100%);
        }
        .trial-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
        .trial-title { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; }
        .days-badge {
          font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800;
          color: var(--indigo-l);
        }
        .days-badge small { font-size: .75rem; font-weight: 400; color: var(--muted); display: block; text-align: right; }

        /* Progress bar */
        .progress-wrap { background: rgba(255,255,255,.06); border-radius: 99px; height: 8px; overflow: hidden; margin: .8rem 0 .4rem; }
        .progress-fill { height: 100%; border-radius: 99px; transition: width .6s ease; }
        .progress-indigo { background: linear-gradient(90deg, var(--indigo-d), var(--indigo-l)); }
        .progress-teal   { background: linear-gradient(90deg, #0284c7, var(--teal)); }
        .progress-amber  { background: linear-gradient(90deg, #d97706, var(--amber)); }

        /* Referral code box */
        .code-box {
          background: rgba(0,0,0,.35); border: 1px solid var(--border2);
          border-radius: 14px; padding: 1rem 1.2rem;
          display: flex; align-items: center; justify-content: space-between;
          margin: 1rem 0;
        }
        .code-text { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; letter-spacing: .15em; color: var(--indigo-l); }
        .code-label { font-size: .7rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }

        /* Buttons */
        .btn { padding: .6rem 1.2rem; border-radius: 10px; font-size: .85rem; font-weight: 600; font-family: 'Syne', sans-serif; cursor: pointer; border: none; transition: all .2s; text-decoration: none; display: inline-block; text-align: center; }
        .btn-primary { background: var(--indigo); color: #000; }
        .btn-primary:hover { background: var(--indigo-l); }
        .btn-ghost { background: rgba(255,255,255,.05); color: var(--text); border: 1px solid var(--border2); }
        .btn-ghost:hover { background: rgba(255,255,255,.1); }
        .btn-green  { background: rgba(74,222,128,.1); color: var(--green); border: 1px solid rgba(74,222,128,.2); }
        .btn-green:hover { background: rgba(74,222,128,.2); }
        .btn-blue   { background: rgba(56,189,248,.1); color: var(--teal); border: 1px solid rgba(56,189,248,.2); }
        .btn-blue:hover { background: rgba(56,189,248,.2); }
        .btn-full   { width: 100%; display: block; text-align: center; }

        /* Share buttons row */
        .share-row { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-top: .8rem; }

        /* Milestone row */
        .milestone-row { display: flex; gap: .5rem; margin-top: 1.2rem; }
        .milestone {
          flex: 1; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 12px; padding: .7rem; text-align: center;
        }
        .milestone.reached { border-color: rgba(5,130,202,.4); background: rgba(5,130,202,.08); }
        .milestone-n { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; }
        .milestone-label { font-size: .65rem; color: var(--muted); margin-top: .2rem; }
        .milestone-reward { font-size: .65rem; color: var(--indigo-l); margin-top: .15rem; }

        /* Payment table */
        .pay-table { width: 100%; border-collapse: collapse; }
        .pay-table th { text-align: left; font-size: .72rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); font-family: 'Syne', sans-serif; padding: .5rem .8rem .9rem; }
        .pay-table td { padding: .85rem .8rem; font-size: .88rem; border-top: 1px solid var(--border); }
        .pay-table tr:hover td { background: rgba(255,255,255,.02); }

        /* Status pill */
        .pill { display: inline-block; padding: .2rem .7rem; border-radius: 99px; font-size: .72rem; font-weight: 600; font-family: 'Syne', sans-serif; text-transform: uppercase; }
        .pill-paid { background: rgba(74,222,128,.1); color: var(--green); }
        .pill-pending { background: rgba(251,191,36,.1); color: var(--amber); }
        .pill-failed { background: rgba(248,113,113,.1); color: var(--red); }

        /* Expiry warning */
        .expiry-warn {
          background: rgba(248,113,113,.05); border: 1px solid rgba(248,113,113,.2);
          border-radius: 14px; padding: 1rem 1.2rem;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .expiry-warn p { font-size: .87rem; color: var(--red); }
        .expiry-warn small { font-size: .75rem; color: var(--muted); display: block; margin-top: .15rem; }

        /* Divider */
        .divider { height: 1px; background: var(--border); margin: 1.2rem 0; }

        /* Animate in */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s ease both; }
        .delay-1 { animation-delay: .05s; }
        .delay-2 { animation-delay: .1s; }
        .delay-3 { animation-delay: .15s; }
        .delay-4 { animation-delay: .2s; }
      `}</style>

      <div className="dash">

        {/* ── Header ── */}
        <div className="header fade-up">
          <div className="header-top">
            <div>
              <h1 className="greeting">Hello, {user?.firstName || "Student"}! <span>My Dashboard</span></h1>
              <p className="header-sub">pharmapaper.com — PharmPaper Workspace</p>
            </div>
            {trial.isPremium && (
              <span className="badge-premium">
                {trial.isTrial ? '🎓 Trial Active' : '⭐ Premium'}
              </span>
            )}
          </div>
        </div>

        {/* ── Expiry Warning (if ≤3 days left) ── */}
        {trial.isTrial && trial.daysLeft !== undefined && trial.daysLeft <= 3 && (
          <div className="expiry-warn fade-up delay-1">
            <div>
              <p>⚠️ Your premium trial expires in {trial.daysLeft} day{trial.daysLeft !== 1 ? 's' : ''}!</p>
              <small>Upgrade now to keep your unlimited study vaults and PYQs access.</small>
            </div>
            <Link href="/upgrade" className="btn btn-primary">
              Upgrade →
            </Link>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="tabs fade-up delay-1 flex flex-wrap gap-2">
          {([
            { id: "overview", label: "📊 Overview" },
            { id: "completion", label: "📈 Completion Stats" },
            { id: "subscriptions", label: "🔔 Subscriptions" },
            { id: "referrals", label: "🔗 Referrals" },
            { id: "billing", label: "💳 Billing" },
          ] as const).map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════
            TAB: OVERVIEW
        ════════════════════════════════ */}
        {tab === 'overview' && (
          <>
            {/* Trial status card */}
            <div className="trial-card fade-up delay-2">
              <div className="trial-header">
                <div>
                  <div className="card-label">Premium Trial</div>
                  <div className="trial-title">
                    {trial.isTrial ? '14-Day Free Trial' : 'Premium Active'}
                  </div>
                  {trial.trialEnd && (
                    <div className="card-sub" style={{ marginTop: '.3rem' }}>
                      Expires {fmt(trial.trialEnd)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="days-badge">
                    {trial.daysLeft ?? '∞'}
                    <small>days left</small>
                  </div>
                </div>
              </div>

              {trial.isTrial && (
                <>
                  <div className="progress-wrap">
                    <div className="progress-fill progress-indigo"
                      style={{ width: `${trialPercent}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--muted)' }}>
                    <span>Day {14 - (trial.daysLeft ?? 0)}</span>
                    <span>Day 14</span>
                  </div>
                </>
              )}

              <div className="divider" />

              <div style={{ display: 'flex', gap: '.7rem' }}>
                <Link href="/upgrade" className="btn btn-primary" style={{ flex: 1 }}>
                  ⭐ Upgrade to Premium
                </Link>
                <Link href="/upgrade" className="btn btn-ghost" style={{ flex: 1 }}>
                  View Plans
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid-3 fade-up delay-3">
              <div className="card">
                <div className="card-label">Days Earned</div>
                <div className="card-value" style={{ color: 'var(--teal)' }}>
                  {referral.total_days_earned}
                </div>
                <div className="card-sub">via referrals</div>
              </div>
              <div className="card">
                <div className="card-label">Friends Referred</div>
                <div className="card-value" style={{ color: 'var(--amber)' }}>
                  {referral.total_referrals}
                </div>
                <div className="card-sub">total referrals</div>
              </div>
              <div className="card">
                <div className="card-label">Total Payments</div>
                <div className="card-value">
                  {payments.length}
                </div>
                <div className="card-sub">transactions</div>
              </div>
            </div>

            {/* Quick referral share */}
            {referral.referral_code && (
              <div className="card fade-up delay-4">
                <div className="card-label">Your Referral Code</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.3rem' }}>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '.12em', color: 'var(--indigo-l)' }}>
                      {referral.referral_code}
                    </div>
                    <div className="card-sub">Each friend = +7 days free for you</div>
                  </div>
                  <button className="btn btn-primary" onClick={copyLink}>
                    {copied ? '✅ Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════
            TAB: REFERRALS
        ════════════════════════════════ */}
        {tab === 'referrals' && (
          <>
            {/* Stats */}
            <div className="grid-2 fade-up delay-1">
              <div className="card">
                <div className="card-label">Friends Referred</div>
                <div className="card-value" style={{ color: 'var(--indigo-l)' }}>
                  {referral.total_referrals}
                </div>
                <div className="card-sub">all time</div>
              </div>
              <div className="card">
                <div className="card-label">Free Days Earned</div>
                <div className="card-value" style={{ color: 'var(--teal)' }}>
                  {referral.total_days_earned}
                </div>
                <div className="card-sub">{referral.total_referrals} × 7 days</div>
              </div>
            </div>

            {/* Code box + share */}
            {referral.referral_code && (
              <div className="card fade-up delay-2">
                <div className="card-label">Your Unique Referral Code</div>
                <div className="code-box">
                  <div>
                    <div className="code-label">Share this code</div>
                    <div className="code-text">{referral.referral_code}</div>
                  </div>
                  <button className="btn btn-primary" onClick={copyLink}>
                    {copied ? '✅ Copied!' : '📋 Copy Link'}
                  </button>
                </div>

                <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '.5rem' }}>
                  Share on:
                </div>
                <div className="share-row">
                  <button className="btn btn-green" onClick={shareWhatsApp}>
                    📱 WhatsApp
                  </button>
                  <button className="btn btn-blue" onClick={shareTelegram}>
                    ✈️ Telegram
                  </button>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '.8rem', color: 'var(--muted)', background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: '.8rem 1rem' }}>
                  🔗 <span style={{ color: 'var(--faint)', wordBreak: 'break-all' }}>
                    pharmapaper.com?ref={referral.referral_code}
                  </span>
                </div>
              </div>
            )}

            {/* Milestone tracker */}
            <div className="card fade-up delay-3">
              <div className="card-label">Milestone Rewards</div>
              <div style={{ marginTop: '.3rem', marginBottom: '.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: 'var(--muted)', marginBottom: '.4rem' }}>
                  <span>{referral.total_referrals % 5} / 5 towards next milestone</span>
                  <span style={{ color: 'var(--indigo-l)' }}>{milestoneNext} more to go</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-fill progress-teal" style={{ width: `${milestoneProgress}%` }} />
                </div>
              </div>

              <div className="milestone-row">
                {[
                  { n: 5,  reward: '1 month free' },
                  { n: 10, reward: '3 months free' },
                  { n: 20, reward: '1 year free' },
                ].map(m => (
                  <div key={m.n} className={`milestone ${referral.total_referrals >= m.n ? 'reached' : ''}`}>
                    <div className="milestone-n">
                      {referral.total_referrals >= m.n ? '🏆' : `${m.n}`}
                    </div>
                    <div className="milestone-label">referrals</div>
                    <div className="milestone-reward">{m.reward}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="card fade-up delay-4">
              <div className="card-label">How It Works</div>
              <div style={{ marginTop: '.6rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                {[
                  ['1', 'Share your code with pharmacy friends'],
                  ['2', 'They sign up and start their free trial'],
                  ['3', 'You instantly get +7 days added'],
                  ['4', 'Hit 5 referrals → earn 1 month free!'],
                ].map(([n, text]) => (
                  <div key={n} style={{ display: 'flex', gap: '.9rem', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(5,130,202,.1)', border: '1px solid rgba(5,130,202,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: '.8rem', color: 'var(--indigo-l)', flexShrink: 0 }}>
                      {n}
                    </div>
                    <span style={{ fontSize: '.88rem', color: 'var(--muted)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════
            TAB: BILLING
        ════════════════════════════════ */}
        {tab === 'billing' && (
          <>
            {/* Current plan */}
            <div className="trial-card fade-up delay-1">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <div className="card-label">Current Plan</div>
                  <div className="trial-title">
                    {trial.isTrial ? 'Free Trial' : trial.isPremium ? 'Premium' : 'Free'}
                  </div>
                  {trial.trialEnd && (
                    <div className="card-sub" style={{ marginTop: '.25rem' }}>
                      {trial.isTrial ? 'Expires' : 'Renews'} {fmt(trial.trialEnd)}
                    </div>
                  )}
                </div>
                <Link href="/upgrade" className="btn btn-primary">
                  {trial.isPremium ? '🔄 Change Plan' : '⭐ Upgrade'}
                </Link>
              </div>
            </div>

            {/* Plan options — prices match /pricing page */}
            <div className="grid-2 fade-up delay-2">
              <div className="card" style={{ borderColor: 'rgba(5,130,202,.2)' }}>
                <div className="card-label">Monthly</div>
                <div className="card-value">₹199</div>
                <div className="card-sub">per month · Full Access</div>
                <div className="divider" />
                <Link href="/pricing" className="btn btn-ghost btn-full" style={{ marginTop: '.3rem' }}>
                  Select Plan
                </Link>
              </div>
              <div className="card" style={{ borderColor: 'rgba(5,130,202,.4)', background: 'linear-gradient(135deg, rgba(5,130,202,.08), rgba(56,189,248,.02))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="card-label">Yearly Vault</div>
                  <span style={{ background: 'var(--indigo)', color: '#000', fontSize: '.65rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: 99, fontFamily: 'Syne' }}>SAVE 58%</span>
                </div>
                <div className="card-value">₹999</div>
                <div className="card-sub">per year · Full Access</div>
                <div className="divider" />
                <Link href="/pricing" className="btn btn-primary btn-full" style={{ marginTop: '.3rem' }}>
                  Best Value
                </Link>
              </div>
            </div>

            {/* Payment history */}
            <div className="card fade-up delay-3">
              <div className="card-label" style={{ marginBottom: '1rem' }}>Payment History</div>
              {payments.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '.88rem', textAlign: 'center', padding: '1.5rem 0' }}>
                  No payments yet.
                </p>
              ) : (
                <table className="pay-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{planLabel(p.plan_type)}</td>
                        <td style={{ color: 'var(--muted)' }}>{fmt(p.created_at)}</td>
                        <td style={{ fontFamily: 'Syne', fontWeight: 700 }}>
                          {p.amount === 0 ? '₹0' : `₹${p.amount}`}
                        </td>
                        <td>
                          <span className={`pill pill-${p.status}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Support */}
            <div className="card fade-up delay-4" style={{ textAlign: 'center', padding: '1.4rem' }}>
              <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>
                Payment issue or need a refund?
              </p>
              <a href="mailto:support@pharmapaper.in"
                style={{ color: 'var(--indigo-l)', fontSize: '.88rem', fontWeight: 600, display: 'block', marginTop: '.5rem' }}>
                support@pharmapaper.in →
              </a>
            </div>
          </>
        )}

        {/* ════════════════════════════════
            TAB: COMPLETION STATS
        ════════════════════════════════ */}
        {tab === 'completion' && (
          <div className="flex flex-col gap-6 fade-up delay-1">
            <div className="trial-card">
              <div className="trial-header">
                <div>
                  <div className="card-label">Learning Progress</div>
                  <div className="trial-title">Lecture Video Completion</div>
                  <div className="card-sub" style={{ marginTop: '.3rem' }}>
                    Track your B.Pharm / D.Pharm syllabus progress
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="days-badge">
                    {videoStats.completedCount}
                    <small>completed</small>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div className="grid-2 animate-fadeIn" style={{ gap: '1.5rem', marginTop: '1rem' }}>
                <div className="p-4 rounded-xl bg-brand-charcoal/40 border border-brand-border">
                  <div className="card-label">Estimated Watch Time</div>
                  <div className="text-xl font-bold font-mono text-brand mt-1">
                    {Math.round(videoStats.completedCount * 45)} <span className="text-xs text-brand-cream/60">mins</span>
                  </div>
                  <p className="text-xs text-brand-cream/40 mt-1">Based on an average of 45 mins per lecture video</p>
                </div>
                
                <div className="p-4 rounded-xl bg-brand-charcoal/40 border border-brand-border">
                  <div className="card-label">Course Milestones</div>
                  <div className="text-xl font-bold font-mono text-brand mt-1">
                    {videoStats.completedCount > 0 ? Math.floor(videoStats.completedCount / 5) : 0} <span className="text-xs text-brand-cream/60">milestones</span>
                  </div>
                  <p className="text-xs text-brand-cream/40 mt-1">Every 5 completed lectures unlocks a milestone badge</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-label">Study Recommendations</div>
              <p className="text-sm text-brand-cream/70 leading-relaxed mb-4">
                Based on your active curriculum, we recommend completing the remaining units of your syllabus and attempting the mock assessments.
              </p>
              <div style={{ display: 'flex', gap: '.7rem' }}>
                <Link href="/notes" className="btn btn-primary" style={{ flex: 1 }}>
                  📚 Read Study Notes
                </Link>
                <Link href="/videos" className="btn btn-ghost" style={{ flex: 1 }}>
                  🎥 Browse Video Vault
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            TAB: SUBSCRIPTIONS
        ════════════════════════════════ */}
        {tab === 'subscriptions' && (
          <div className="flex flex-col gap-6 fade-up delay-1">
            <div className="card">
              <div className="card-label">Your Subscribed Lecturers</div>
              {videoStats.subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-brand-cream/50 mb-4">You have not subscribed to any expert lecturers yet.</p>
                  <Link href="/videos" className="btn btn-primary">
                    Meet Expert Lecturers
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {videoStats.subscriptions.map((lecturer) => (
                    <div
                      key={lecturer.id}
                      className="p-4 rounded-xl bg-brand-charcoal/40 border border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {lecturer.avatar_url ? (
                          <img
                            src={lecturer.avatar_url}
                            alt={lecturer.name}
                            className="w-12 h-12 rounded-full object-cover border border-brand-border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center font-mono text-brand font-bold text-lg">
                            {lecturer.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-brand-cream text-sm">{lecturer.name}</h4>
                          <p className="text-xs text-brand font-mono">{lecturer.specialization || "Pharmacy Expert"}</p>
                          <p className="text-[10px] text-brand-cream/40 line-clamp-1 mt-0.5">{lecturer.bio}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
                        <Link
                          href={`/lecturer/${lecturer.id}`}
                          className="px-4 py-2 border border-brand-border hover:border-brand/40 text-brand-cream/70 hover:text-brand rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          View Channel
                        </Link>
                        <SubscribeButton
                          lecturerId={lecturer.id}
                          initialIsSubscribed={true}
                          initialSubscriberCount={lecturer.total_subscribers || 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
