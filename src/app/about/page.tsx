
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
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-16 lg:p-24">
      <div className="max-w-5xl mx-auto space-y-24">
        
        <nav className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold uppercase tracking-widest text-xs">
            <ArrowLeft size={16} />
            Back to App
          </Link>
          <Badge variant="outline" className="px-4 py-1 rounded-full border-border font-bold text-[10px] tracking-widest uppercase">Developer Specs</Badge>
        </nav>

        <section className="space-y-8">
          <h1 className="text-6xl md:text-7xl font-headline font-bold tracking-tight">
            Minimalist <br />
            <span className="text-primary">Backend Excellence.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
            I specialize in high-concurrency real-time systems. PulseQueue is a focused demonstration of 
            advanced **Full Stack Development**, moving beyond basic CRUD to complex distributed state management.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 border border-border rounded-xl space-y-6 hover:bg-muted/30 transition-colors">
            <Server className="text-primary" size={32} />
            <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Backend Engineering</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Proficient in building scalable, secure environments with **Django**, **Express.js**, and **Node.js**.
            </p>
          </div>

          <div className="p-8 border border-border rounded-xl space-y-6 hover:bg-muted/30 transition-colors">
            <Database className="text-accent" size={32} />
            <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Database Strategy</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Expertise in **MongoDB**, **PostgreSQL**, and **Firebase RTDB**. Mastering atomic operations and low-latency sync.
            </p>
          </div>

          <div className="p-8 border border-border rounded-xl space-y-6 hover:bg-muted/30 transition-colors">
            <Layout className="text-foreground/70" size={32} />
            <h3 className="text-xl font-headline font-bold uppercase tracking-tight">Full Stack Vision</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Seamlessly integrating **React 19** frontends with robust, type-safe backend logic and APIs.
            </p>
          </div>
        </div>

        <section className="space-y-12">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <Code2 size={24} className="text-primary" />
            <h2 className="text-2xl font-headline font-bold uppercase tracking-widest">Stack Proficiency</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-primary text-[10px] uppercase tracking-[0.3em]">Core Frameworks</h4>
                <div className="flex flex-wrap gap-2">
                  {["Django", "Express.js", "Next.js", "Node.js"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-4 py-1 font-bold rounded-lg border border-border bg-muted/50">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-accent text-[10px] uppercase tracking-[0.3em]">Databases</h4>
                <div className="flex flex-wrap gap-2">
                  {["MongoDB", "PostgreSQL", "Firebase RTDB", "Redis"].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-4 py-1 font-bold rounded-lg border border-border bg-muted/50">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
              <p>
                My philosophy is **"Complexity hidden by Simplicity."** Whether architecting RESTful services in **Express** or managing relational data in **PostgreSQL**, I prioritize performance and clean interfaces.
              </p>
              <div className="pt-6 flex gap-4">
                <Link href="#" className="p-3 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Github size={20} />
                </Link>
                <Link href="#" className="p-3 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Linkedin size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-12 text-center opacity-20">
          <p className="font-bold uppercase tracking-[0.6em] text-[10px]">
            Engineered for Precision • 2025
          </p>
        </footer>
      </div>
    </div>
  );
}
