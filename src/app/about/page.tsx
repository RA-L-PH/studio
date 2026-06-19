
"use client";

import Link from "next/link";
import { 
  Database, 
  Server, 
  Layout, 
  ArrowLeft, 
  Github, 
  Linkedin, 
  Code2, 
  Cpu, 
  Globe,
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-foreground p-6 md:p-12 lg:p-24 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-24">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm">
            <ArrowLeft size={20} />
            Back to PulseQueue
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/30 text-primary glass">FULL STACK DEVELOPER</Badge>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="space-y-8">
          <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-tighter">
            Architecting <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-accent">The Future of Flow.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
            I specialize in high-concurrency, real-time systems. PulseQueue is a demonstration of 
            advanced **Backend Development** and **Database Management** tailored for medical environments.
          </p>
        </section>

        {/* Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="neu-glass p-10 rounded-[3rem] border-primary/10 space-y-6 group hover:border-primary/40 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary glow-blue">
              <Server size={32} />
            </div>
            <h3 className="text-2xl font-headline font-bold italic">Backend Engineering</h3>
            <p className="text-muted-foreground leading-relaxed">
              Expertise in scalable environments including **Django**, **ExpressJS**, and **Node.js**. 
              PulseQueue leverages Next.js Server Actions for robust, type-safe operations.
            </p>
          </div>

          <div className="neu-glass p-10 rounded-[3rem] border-accent/10 space-y-6 group hover:border-accent/40 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent glow-cyan">
              <Database size={32} />
            </div>
            <h3 className="text-2xl font-headline font-bold italic">Database Strategy</h3>
            <p className="text-muted-foreground leading-relaxed">
              Advanced **Database Management** across NoSQL landscapes like **MongoDB** and **Firebase RTDB**. 
              Mastering atomic transactions and sub-second sync at scale.
            </p>
          </div>

          <div className="neu-glass p-10 rounded-[3rem] border-white/10 space-y-6 group hover:border-white/40 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-foreground/70">
              <Layout size={32} />
            </div>
            <h3 className="text-2xl font-headline font-bold italic">Full Stack Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bridging the gap between **Frontend Brilliance** and **Backend Logic**. PulseQueue 
              is built with React 19, Tailwind CSS, and Real-Time Synchronization.
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-4">
            <Code2 size={24} className="text-primary" />
            <h2 className="text-3xl font-headline font-bold uppercase tracking-widest italic">Core Expertise</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="glass-card p-8 rounded-[2rem] border-white/5">
                <h4 className="font-bold text-primary mb-4 uppercase tracking-[0.2em] text-xs">Framework Proficiency</h4>
                <div className="flex flex-wrap gap-3">
                  {["Django", "ExpressJS", "Next.js", "React", "Node.js"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-5 py-2 rounded-xl bg-white/5 border-white/5 text-base">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="glass-card p-8 rounded-[2rem] border-white/5">
                <h4 className="font-bold text-accent mb-4 uppercase tracking-[0.2em] text-xs">Database Expertise</h4>
                <div className="flex flex-wrap gap-3">
                  {["MongoDB", "Firebase RTDB", "PostgreSQL", "Firestore"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-5 py-2 rounded-xl bg-white/5 border-white/5 text-base">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
              <p>
                As a **Backend Developer** focused on high-performance medical applications, 
                I prioritize data integrity and real-time state management. 
              </p>
              <p>
                Whether building RESTful APIs with **Express.js** or robust administrative dashboards with **Django**, 
                my philosophy is "Code for Clarity, Build for Scale."
              </p>
              <div className="pt-6 flex gap-6">
                <Link href="#" className="p-4 rounded-2xl glass-card hover:bg-primary/10 transition-all text-primary">
                  <Github size={24} />
                </Link>
                <Link href="#" className="p-4 rounded-2xl glass-card hover:bg-accent/10 transition-all text-accent">
                  <Linkedin size={24} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-12 text-center">
          <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-xs">
            Engineered with Precision • 2025
          </p>
        </footer>
      </div>
    </div>
  );
}
