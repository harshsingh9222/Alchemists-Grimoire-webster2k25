import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const TimelineStep = ({ step, idx, setActiveStep }) => {
  const isEven = idx % 2 === 0;
  return (
    <motion.div
      className="relative flex w-full items-start"
      onViewportEnter={() => setActiveStep(idx)}
      viewport={{ root: null, margin: "-40% 0px -40% 0px" }}
    >
      {/* Connector Dot */}
      <div className="absolute left-1/2 top-4 h-4 w-4 -translate-x-1/2 rounded-full bg-pink-300 border-2 border-white/50 z-10 shadow-lg"></div>

      {/* Content */}
      <div
        className={`w-1/2 p-4 ${isEven ? "pr-8 text-right" : "pl-8 text-left"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ amount: 0.6 }}
        >
          <div
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full shadow-xl border-2 border-white/40 ${
              step.color
            } text-3xl mb-3 ${isEven ? "ml-auto" : "mr-auto"}`}
          >
            {step.icon}
          </div>
          <h3 className="text-xl font-bold text-pink-200 mb-1">{step.title}</h3>
          <p className="text-sm text-pink-100 opacity-90 leading-relaxed">
            {step.desc}
          </p>
        </motion.div>
      </div>

      {/* Spacer */}
      <div className="w-1/2"></div>
    </motion.div>
  );
};

const InteractiveTimeline = () => {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);

  const steps = [
    {
      title: "🏰 Landing Page",
      desc: "Welcome — an inviting intro to the app, value props, and quick CTAs to sign up or explore.",
      icon: "✨",
      color: "bg-indigo-500",
      imageUrl: "https://placehold.co/600x400/2a0e61/fda4af?text=Landing+Page",
    },
    {
      title: "🔮 Sign In / Register",
      desc: "Multiple auth paths: email/OTP, Google OAuth — fast entry while preserving existing OTP flow.",
      icon: "🔐",
      color: "bg-violet-500",
      imageUrl: "https://placehold.co/600x400/43127e/fbf1ff?text=Sign+In",
    },
    {
      title: "🧭 Onboarding & Preferences",
      desc: "Quick setup: timezone, notification preferences, and initial medicines import or template selection.",
      icon: "🧾",
      color: "bg-pink-500",
      imageUrl: "https://placehold.co/600x400/6b21a8/fde68a?text=Onboarding",
    },
    {
      title: "📜 Dashboard (Overview)",
      desc: "Your command center: today's doses, upcoming reminders, quick actions and adherence summary.",
      icon: "�",
      color: "bg-rose-500",
      imageUrl: "https://placehold.co/600x400/8b5cf6/fff1f2?text=Dashboard",
    },
    {
      title: "🧪 Add / Edit Medicine",
      desc: "Create or modify medicines: name, dose, schedule, instructions, and attach images or notes.",
      icon: "⚗️",
      color: "bg-teal-500",
      imageUrl: "https://placehold.co/600x400/0ea5a4/ffffff?text=Add+Medicine",
    },
    {
      title: "🗂️ Medicine Catalog",
      desc: "Browse the catalog to find common medicines, add recommended dosage templates, or learn details.",
      icon: "📚",
      color: "bg-sky-500",
      imageUrl: "https://placehold.co/600x400/0369a1/ffffff?text=Catalog",
    },
    {
      title: "⏰ Schedule & Reminders",
      desc: "Set single or recurring schedules, choose reminder channels (push, email), and snooze rules.",
      icon: "⏱️",
      color: "bg-yellow-500",
      imageUrl: "https://placehold.co/600x400/f59e0b/ffffff?text=Scheduling",
    },
    {
      title: "🩺 Dose Tracker (Today)",
      desc: "The active tracker: view today's doses, mark taken/missed, skip or postpone, and see immediate feedback.",
      icon: "✅",
      color: "bg-emerald-500",
      imageUrl: "https://placehold.co/600x400/10b981/ffffff?text=Dose+Tracker",
    },
    {
      title: "📆 Calendar & Day View",
      desc: "Monthly calendar with per-day dose breakdown, view more details and jump to any date (mobile-friendly).",
      icon: "📅",
      color: "bg-violet-400",
      imageUrl: "https://placehold.co/600x400/7c3aed/ffffff?text=Calendar",
    },
    {
      title: "🔔 Notifications & Delivery",
      desc: "Reliable reminders delivered at the right timezone — includes retry logic, delivery history, and settings.",
      icon: "�",
      color: "bg-pink-400",
      imageUrl: "https://placehold.co/600x400/ec4899/ffffff?text=Notifications",
    },
    {
      title: "📖 Logs & Reports",
      desc: "Historical logs of all dose events, exportable reports, adherence charts and trends over time.",
      icon: "🧾",
      color: "bg-sky-600",
      imageUrl: "https://placehold.co/600x400/0ea5e9/ffffff?text=Logs",
    },
    {
      title: "🧰 My Medicines",
      desc: "A dedicated list of your medicines: quick edit, refill reminders, delete or archive entries.",
      icon: "🩺",
      color: "bg-indigo-400",
      imageUrl: "https://placehold.co/600x400/6366f1/ffffff?text=My+Medicines",
    },
    {
      title: "🤖 ChatBot & AI Help",
      desc: "Ask the assistant for dosage tips, FAQs, or to set reminders; get smart suggestions for schedules.",
      icon: "🤖",
      color: "bg-emerald-400",
      imageUrl: "https://placehold.co/600x400/34d399/ffffff?text=ChatBot",
    },
    {
      title: "⚙️ Profile & Settings",
      desc: "Manage account, link Google, control timezone/onboarded state, privacy and notification preferences.",
      icon: "👤",
      color: "bg-gray-500",
      imageUrl: "https://placehold.co/600x400/6b7280/ffffff?text=Profile",
    },
    {
      title: "📬 Help & About",
      desc: "Learn about the app, contact support, read docs, and find onboarding tips to get the most out of it.",
      icon: "�",
      color: "bg-pink-300",
      imageUrl:
        "https://placehold.co/600x400/fda4af/1e1b4b?text=About+%26+Support",
    },
  ];

  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden
      bg-gradient-to-b from-[#2a0e61] via-[#43127e] to-[#1b0a40]"
    >
      {/* Floating particles / stars for circus sync */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.05),_transparent_70%)]"></div>
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-3 h-3 bg-pink-400 rounded-full blur-sm opacity-70"
        ></motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute bottom-32 right-12 w-2 h-2 bg-violet-400 rounded-full blur-sm opacity-60"
        ></motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-pink-300 mb-6 drop-shadow-lg">
            🎪 The Alchemist’s Journey
          </h2>
          <p className="text-lg text-pink-100 max-w-2xl mx-auto leading-relaxed">
            From logging your first elixir to summoning AI predictions — this
            scroll continues the grand circus of wellness, perfectly in sync
            with the magic you saw on the Landing Page.
          </p>
        </div>

        {/* Scrollable Timeline */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start h-[80vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-pink-400/60 scrollbar-track-transparent pr-4"
        >
          {/* Left: Sticky image */}
          <div className="sticky top-10 w-full h-56 md:h-80 lg:h-[400px]">
            <div className="relative w-full h-full rounded-2xl border-4 border-pink-500/30 shadow-[0_0_30px_rgba(255,100,200,0.4)] overflow-hidden">
              <div className="absolute inset-0 bg-purple-900/40 z-10"></div>
              {steps.map((step, idx) => (
                <motion.img
                  key={idx}
                  src={step.imageUrl}
                  alt={step.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{
                    opacity: activeStep === idx ? 1 : 0,
                    scale: activeStep === idx ? 1 : 1.05,
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-pink-200 font-bold text-lg">
              {steps[activeStep].title}
            </p>
          </div>

          {/* Right: Timeline Steps */}
          <div className="relative">
            <div className="absolute left-1/2 top-0 h-full w-1 bg-pink-500/20 -translate-x-1/2"></div>
            <motion.div
              className="absolute left-1/2 top-0 h-full w-1 bg-gradient-to-b from-pink-400 to-violet-400 origin-top -translate-x-1/2"
              style={{ scaleY }}
            />
            <div className="space-y-24">
              {steps.map((step, idx) => (
                <TimelineStep
                  key={idx}
                  step={step}
                  idx={idx}
                  setActiveStep={setActiveStep}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveTimeline;
