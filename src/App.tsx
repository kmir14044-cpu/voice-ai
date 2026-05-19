import { useState, useRef, useEffect } from "react";
import { 
  Plane, 
  Hotel, 
  Mic, 
  MicOff, 
  Headphones, 
  X, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  ShieldCheck,
  Search,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { speechService } from "./lib/speech";

// Component for the Voice Agent Bars Visualizer
const VoiceVisualizer = ({ isActive }: { isActive: boolean }) => (
  <div className="relative flex items-center justify-center">
    <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
    <div className="relative flex items-center gap-1.5 h-32">
      {[12, 20, 32, 24, 16, 28, 14, 10].map((h, i) => (
        <motion.div
          key={i}
          animate={isActive ? { height: [h * 0.5, h * 1.5, h * 0.8] } : { height: h }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
          className={`w-1.5 rounded-full ${i === 2 || i === 5 ? 'bg-cyan-400' : 'bg-cyan-400/60'}`}
          style={{ height: h }}
        />
      ))}
    </div>
  </div>
);

export default function App() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [agentStatus, setAgentStatus] = useState("Ready to assist");
  const [agentHistory, setAgentHistory] = useState<any[]>([]);
  const [lastResponse, setLastResponse] = useState("");

  const toggleAgent = async () => {
    if (!isAgentOpen) {
      setIsAgentOpen(true);
      await speechService.speak("Nomad Voice Assistant active. How can I assist your journey today?");
    } else {
      setIsAgentOpen(false);
      setIsListening(false);
      speechService.stopListening();
    }
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setAgentStatus("Listening...");
      const text = await speechService.listen();
      setIsListening(false);
      setAgentStatus("Processing...");
      
      await processRequest(text);
    } catch (error) {
      console.error(error);
      setIsListening(false);
      setAgentStatus("Ready to assist");
    }
  };

  const processRequest = async (text: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: agentHistory }),
      });
      const data = await response.json();
      
      setLastResponse(data.text);
      setAgentHistory(prev => [...prev, { role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: data.text }] }]);
      setAgentStatus("Speaking...");
      await speechService.speak(data.text);
      setAgentStatus("Ready to assist");
    } catch (error) {
      console.error(error);
      setAgentStatus("Connectivity Error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] overflow-x-hidden selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-10 h-20 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20"></div>
          <span className="text-xl font-light tracking-widest uppercase">
            Nomad<span className="font-bold text-cyan-500 underline decoration-1 underline-offset-4">Voice</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-[10px] font-bold tracking-[0.2em] uppercase text-white/50">
          <a href="#" className="text-white border-b border-cyan-500 pb-1">Assistant</a>
          <a href="#" className="hover:text-white transition-colors">My Bookings</a>
          <a href="#" className="hover:text-white transition-colors">Explore</a>
          <div className="w-px h-4 bg-white/20"></div>
          <span className="text-white/80">User: Traveler</span>
        </div>
        <button 
          onClick={toggleAgent}
          className="px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2 group"
        >
          <span className="text-[10px] uppercase tracking-widest font-bold">Launch AI</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:bg-black" />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center px-12 overflow-hidden bg-gradient-to-b from-black to-[#0a0c10]">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="/src/assets/images/luxury_travel_hero_1779175853474.png" 
            alt="Landing Background" 
            className="w-full h-full object-cover grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <p className="text-cyan-500 uppercase tracking-[0.5em] font-bold text-xs mb-6">Ultra-Low Latency AI</p>
            <h1 className="text-8xl md:text-9xl font-serif italic text-white/90 leading-[0.9] mb-10 tracking-tighter">
              Bespoke <br />Journeys.
            </h1>
            <p className="text-lg text-white/40 font-light max-w-xl mb-12 leading-relaxed border-l border-cyan-500/30 pl-8">
              Navigate the globe with the world's most sophisticated voice-first travel platform. 
              Seamless bookings, instant resolution, absolute privacy.
            </p>
            
            <div className="flex gap-6">
              <button onClick={toggleAgent} className="px-10 py-5 bg-cyan-500 text-black font-bold rounded-sm hover:bg-cyan-400 transition-all uppercase text-[10px] tracking-[0.2em] cyan-glow">
                Start Speaking Now
              </button>
              <button className="px-10 py-5 border border-white/10 hover:bg-white/5 transition-all text-white uppercase text-[10px] tracking-[0.2em]">
                Explore Fleet
              </button>
            </div>
          </motion.div>
        </div>

        <div className="absolute right-[-10%] bottom-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[200px]" />
      </section>

      {/* Services Grid */}
      <section className="py-32 px-10 border-t border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <p className="text-cyan-500 uppercase tracking-[0.4em] font-bold text-[10px] mb-6">Unrivaled Intelligence</p>
              <h2 className="text-6xl font-serif italic text-white/90">The Nomad Ecosystem</h2>
            </div>
            <p className="text-white/30 max-w-sm text-xs leading-relaxed uppercase tracking-widest font-medium">
              A global network of elite inventory, powered by next-generation voice automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/5">
            <ExperienceCard 
              icon={<Plane className="w-5 h-5 text-cyan-400" />} 
              title="Global Mobility" 
              desc="Instant access to first-class inventory and empty-leg private charters across 140 countries."
            />
            <ExperienceCard 
              icon={<Hotel className="w-5 h-5 text-cyan-400" />} 
              title="Curation Node" 
              desc="Intelligent filtering of the world's most architecturally significant and private properties."
            />
            <ExperienceCard 
              icon={<ShieldCheck className="w-5 h-5 text-cyan-400" />} 
              title="Secure Transit" 
              desc="End-to-end encryption for all bookings and biometric-grade identity verification."
            />
          </div>
        </div>
      </section>

      <footer className="py-12 px-10 border-t border-white/5 text-white/20 text-[10px] uppercase tracking-[0.4em] flex justify-between bg-black">
        <p>© 2026 Nomad Digital. Handcrafted for Global Explorers.</p>
        <div className="flex gap-12">
          <a href="#" className="hover:text-cyan-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-cyan-500 transition-colors">Protocol</a>
          <a href="#" className="hover:text-cyan-500 transition-colors">Specialist</a>
        </div>
      </footer>

      {/* Voice Agent Overlay - Elegant Dark 8/12 grid */}
      <AnimatePresence>
        {isAgentOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          >
            {/* Overlay Header */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-10">
               <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500"></div>
                <span className="text-sm font-light tracking-widest uppercase">Nomad<span className="font-bold">Voice</span></span>
              </div>
              <button onClick={toggleAgent} className="text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </header>

            <main className="flex-1 grid grid-cols-12 gap-0">
              {/* Main Agent Area (8 col) */}
              <section className="col-span-8 relative flex flex-col items-center justify-center border-r border-white/5 bg-gradient-to-b from-black to-[#0a0c10] p-12">
                <div className="absolute top-12 left-12">
                  <h2 className="text-4xl font-serif italic text-white/90">How can I assist <br/>your journey today?</h2>
                  <p className="mt-4 text-[10px] text-white/40 font-mono tracking-tighter uppercase whitespace-pre">SESSION ID: VX-{Math.floor(Math.random()*999)}-ALPHA</p>
                </div>

                <div className="flex flex-col items-center">
                  <VoiceVisualizer isActive={isListening || agentStatus === "Speaking..."} />
                  
                  <div className="mt-12 text-center max-w-xl">
                    <p className={`text-lg font-light tracking-wide mb-2 ${isListening ? 'text-cyan-400 animate-pulse' : 'text-white/60'}`}>
                      {agentStatus}
                    </p>
                    {lastResponse && (
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-serif italic text-white/90 mt-8 leading-relaxed"
                      >
                        "{lastResponse}"
                      </motion.p>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-16 flex flex-col items-center">
                  {!isListening && agentStatus !== "Speaking..." && agentStatus !== "Processing..." ? (
                    <button 
                      onClick={startListening}
                      className="px-12 py-5 bg-white text-black font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-cyan-500 transition-all rounded-sm shadow-xl"
                    >
                      Hold Space or Click to Speak
                    </button>
                  ) : (
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 animate-pulse">Voice Verified • Streaming</p>
                  )}
                </div>
              </section>

              {/* Sidebar Context (4 col) */}
              <aside className="col-span-4 bg-[#080808] flex flex-col p-10 overflow-y-auto">
                <div className="flex-1 space-y-12">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold mb-6">Active Context</h3>
                    <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 glass">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase mb-1">Global Intelligence</p>
                          <p className="text-xl font-medium">Real-time Inventory</p>
                        </div>
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-[8px] font-bold rounded uppercase tracking-widest">Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-6">
                        <div>
                          <p className="text-[10px] uppercase text-white/30 mb-1">Destinations</p>
                          <p className="text-xs">Paris, Tokyo, NY</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-white/30 mb-1">Response Time</p>
                          <p className="text-xs text-cyan-400">120ms</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-6">Suggested Queries</h3>
                    <div className="space-y-3">
                      {["Check flight availability to Paris", "Find luxury hotels in Tokyo", "Book a penthouse for next week"].map((q, i) => (
                        <button key={i} className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all flex items-center justify-between group">
                          <span className="text-xs text-white/70 italic group-hover:text-white">"{q}"</span>
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-auto border-t border-white/5">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-cyan-900/10 border border-cyan-500/20">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                    <div className="flex-1">
                      <p className="text-[10px] uppercase font-bold text-cyan-500">System Status</p>
                      <p className="text-xs text-cyan-100/60">Ultra-low latency active</p>
                    </div>
                  </div>
                </div>
              </aside>
            </main>

            <footer className="h-16 bg-black border-t border-white/5 flex items-center justify-between px-10">
              <div className="flex gap-8">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">EN-US</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">SECURE LINE</span>
              </div>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Handcrafted for Global Explorers © 2026</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExperienceCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-12 border-r last:border-r-0 border-white/5 hover:bg-white/[0.02] transition-all group">
      <div className="mb-10 p-4 w-fit rounded-full bg-cyan-500/5 border border-cyan-500/10 group-hover:bg-cyan-500/10 transition-all cyan-glow">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-4 tracking-tight text-white/90 underline decoration-cyan-500/30 underline-offset-8 decoration-1 italic font-serif ">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed font-light mb-8">
        {desc}
      </p>
      <div className="flex items-center gap-3 text-cyan-500 opacity-40 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-cyan-400">Intelligence Node</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
}

