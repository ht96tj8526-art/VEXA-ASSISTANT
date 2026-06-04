// components/VexaAssistant.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Terminal, Trash2, Paperclip, X, Image as ImageIcon, Power, ShieldAlert, Menu, Plus, MessageSquare, Copy, Check, Download, Camera, Aperture } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUser, UserButton, SignInButton, useClerk } from '@clerk/nextjs';
import * as THREE from 'three';

interface Message { role: 'user' | 'assistant'; content: string | any[]; }
interface ChatSession { id: string; title: string; messages: Message[]; updatedAt: number; }

const PERSONAS = [
  { id: 'core', name: 'VEXA Core', prompt: 'You are VEXA, a highly intelligent female AI assistant. You excel at coding, solving math problems, and analyzing images. You have live web access. You are witty, brilliant, professional, and slightly sarcastic.' },
  { id: 'architect', name: 'Code Architect', prompt: 'You are an elite senior software engineer and system architect. Respond ONLY with highly optimized, production-ready code and incredibly brief, technical explanations. Avoid pleasantries.' },
  { id: 'jarvis', name: 'J.A.R.V.I.S', prompt: 'You are a highly efficient, dryly sarcastic British AI assistant. You are exceptionally brief, excessively polite but slightly condescending, and you address the user as "Sir" or "Admin".' },
  { id: 'tutor', name: 'Socratic Tutor', prompt: 'You are a master teacher. Never just give the user the answer. Guide them to find the answer themselves by asking thought-provoking questions and giving small hints.' }
];

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'code';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString); setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) return <code className="bg-black/40 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono border border-cyan-900/30" {...props}>{children}</code>;

  return (
    <div className="rounded-lg border border-cyan-900/50 overflow-hidden my-4 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-cyan-900/50">
        <span className="text-[10px] text-cyan-500/70 uppercase tracking-wider font-bold">{language}</span>
        <button onClick={handleCopy} className="flex items-center space-x-1.5 text-[10px] text-neutral-400 hover:text-cyan-400 transition-colors font-bold tracking-wider">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          <span className={copied ? "text-green-400" : ""}>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>
      <pre className="bg-black/60 p-4 overflow-x-auto text-xs font-mono"><code className={className} {...props}>{children}</code></pre>
    </div>
  );
};

let globalAudioCtx: any = null;
const unlockAudioEngine = () => {
  if (typeof window === 'undefined') return;
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) globalAudioCtx = new AudioContextClass();
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
  if (window.speechSynthesis) window.speechSynthesis.resume();
};

const playSystemSound = (type: 'boot' | 'send' | 'snap' | 'save') => {
  try {
    unlockAudioEngine();
    if (!globalAudioCtx) return;
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    osc.connect(gain); gain.connect(globalAudioCtx.destination);
    const now = globalAudioCtx.currentTime;
    
    if (type === 'boot') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(1000, now + 0.6);
      gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'send') {
      osc.type = 'square'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'snap') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'save') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    }
  } catch (e) { console.warn("Audio Engine Error:", e); }
};

// 🔮 THREE.JS HOLOGRAPHIC CORE COMPONENT
const HolographicCore = ({ status }: { status: 'idle' | 'listening' | 'processing' | 'speaking' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(300, 300);
    mountRef.current.appendChild(renderer.domElement);

    // Particle Sphere Geometry
    const geometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      const radius = 2;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const material = new THREE.PointsMaterial({ size: 0.02, color: 0x00d4ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const particleMesh = new THREE.Points(geometry, material);
    scene.add(particleMesh);
    
    camera.position.z = 4;

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.05;

      // Base rotation
      particleMesh.rotation.y += 0.002;
      particleMesh.rotation.x += 0.001;

      // State-based reactivity
      if (status === 'listening') {
        particleMesh.rotation.y += 0.02; // Spin faster
        material.color.setHex(0xff3366); // Shift to red-ish
        material.size = 0.03;
      } else if (status === 'processing') {
        particleMesh.rotation.y += 0.05;
        material.color.setHex(0xa855f7); // Purple
        particleMesh.scale.set(1 + Math.sin(time)*0.1, 1 + Math.cos(time)*0.1, 1);
      } else if (status === 'speaking') {
        material.color.setHex(0x00d4ff); // Cyan
        material.size = 0.04;
        const scale = 1 + Math.sin(time * 3) * 0.2; // Audio pulse effect
        particleMesh.scale.set(scale, scale, scale);
      } else {
        // Idle
        material.color.setHex(0x0066cc);
        material.size = 0.015;
        particleMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      geometry.dispose(); material.dispose(); renderer.dispose();
    };
  }, [status]);

  return (
    <div className="relative flex items-center justify-center w-[350px] h-[350px]">
      {/* Outer HUD Rings (CSS) */}
      <div className={`absolute w-[320px] h-[320px] rounded-full border border-cyan-900/50 border-t-cyan-400 border-b-cyan-400 ${status === 'listening' ? 'animate-[spin_1s_linear_infinite]' : 'animate-[spin_10s_linear_infinite]'}`}></div>
      <div className={`absolute w-[340px] h-[340px] rounded-full border border-cyan-900/30 border-l-cyan-500 border-r-cyan-500 ${status === 'processing' ? 'animate-[spin_0.5s_linear_infinite_reverse]' : 'animate-[spin_15s_linear_infinite_reverse]'}`}></div>
      {/* 3D Core Mount */}
      <div ref={mountRef} className="absolute z-10 drop-shadow-[0_0_30px_rgba(0,212,255,0.6)]" />
      {/* Targeting brackets */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50"></div>
    </div>
  );
};


export default function VexaAssistant() {
  const { user, isLoaded } = useUser(); 
  const { signOut } = useClerk(); 
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [isBooted, setIsBooted] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePersona, setActivePersona] = useState(PERSONAS[0]);
  
  const [showCamera, setShowCamera] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false); 
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 🧠 THE KNOWLEDGE VAULT STATE
  const [memoryVault, setMemoryVault] = useState<string[]>([]);
  const vaultKey = user ? `vexa_vault_${user.id}` : null;

  const [autoListen, setAutoListen] = useState(false);
  const stateRef = useRef({ autoListen: false, persona: PERSONAS[0], showCamera: false });
  useEffect(() => { stateRef.current = { autoListen, persona: activePersona, showCamera }; }, [autoListen, activePersona, showCamera]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recognition, setRecognition] = useState<any>(null);

  const memoryKey = user ? `vexa_archive_${user.id}` : null;
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning, Sir.";
  if (hour >= 12 && hour < 17) return "Good afternoon, Sir.";
  if (hour >= 17 && hour < 22) return "Good evening, Sir.";
  return "It's quite late, Sir. How may I help you at this hour?";
};
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) { alert("Camera access denied by system."); }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  useEffect(() => { return () => stopCamera(); }, []);

  const captureImage = (): string | null => {
    if (videoRef.current) {
      playSystemSound('snap');
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        setImageBase64(base64); stopCamera(); return base64;
      }
    }
    return null;
  };

  const handleBootSequence = () => {
  playSystemSound('boot');
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    // Get the dynamic greeting
    const greeting = getGreeting();
    
    // Speak it
    const utterance = new SpeechSynthesisUtterance(greeting);
    window.speechSynthesis.speak(utterance);
    
    setMessages([{ role: 'assistant', content: greeting }]);
  }
  setIsBooted(true);
};

  useEffect(() => {
  if (isBooted && activePersona.id === 'jarvis') {
    const greeting = getGreeting();
    speak(greeting);
    setMessages([{ role: 'assistant', content: greeting }]);
  }
}, [isBooted, activePersona.id]);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    
    // Clean text of markdown before speaking
    const cleanText = text.replace(/[*_~`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const executeSpeech = () => {
      const voices = window.speechSynthesis.getVoices();
      const ava = voices.find(v => v.name.toLowerCase().includes('ava'));
      const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (stateRef.current.persona.id === 'jarvis') {
        const british = voices.find(v => v.lang === 'en-GB' || v.name.includes('Daniel'));
        utterance.voice = british || defaultVoice;
        utterance.rate = 1.0; utterance.pitch = 0.9; 
      } else {
        utterance.voice = ava || defaultVoice;
        utterance.rate = 1.05; utterance.pitch = 1.0;
      }
      
      utterance.onstart = () => setStatus('speaking'); 
      utterance.onerror = () => setStatus('idle');
      utterance.onend = () => {
        setStatus('idle');
        if (stateRef.current.autoListen && stateRef.current.persona.id === 'jarvis') {
          setTimeout(() => { if (recognition) { try { recognition.start(); } catch(e) {} } }, 300); 
        }
      };
      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.getVoices().length === 0 ? window.speechSynthesis.onvoiceschanged = executeSpeech : executeSpeech();
  };

  useEffect(() => {
    // 1. Load Transmissions & Vault
    if (memoryKey) {
      const savedArchive = localStorage.getItem(memoryKey);
      if (savedArchive) {
        const parsed = JSON.parse(savedArchive); setSessions(parsed);
        if (parsed.length > 0) { setCurrentSessionId(parsed[0].id); setMessages(parsed[0].messages); } else startNewChat();
      } else startNewChat();
    }
    if (vaultKey) {
      const savedVault = localStorage.getItem(vaultKey);
      if (savedVault) setMemoryVault(JSON.parse(savedVault));
    }

    // 2. Initialize Speech Recognition safely
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true; // Required for background listening
        rec.interimResults = true;
        rec.lang = 'en-US';
        
        rec.onstart = () => setStatus('listening');
        
        rec.onend = () => {
          // If in Jarvis mode, give it a moment, then restart
          if (stateRef.current.persona.id === 'jarvis') {
            setTimeout(() => { 
                if (recognition) {
                    try { recognition.start(); } catch (e) { /* already started */ }
                }
            }, 1000); // 1-second delay to ensure browser stability
          }
          setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
        };
        
        rec.onresult = async (event: any) => { 
            const result = event.results[event.results.length - 1];
            
            // 🔥 WAIT FOR FINAL SENTENCE
            if (!result.isFinal) return; 

            const transcript = result[0].transcript.trim();
            const lower = transcript.toLowerCase();
            
            // 🔥 WAKE WORD AGENT
            if (stateRef.current.persona.id === 'jarvis' && lower.includes('jarvis')) {
                playSystemSound('boot');
                setStatus('listening');
                const greeting = getGreeting();
                speak(greeting);
                return;
            }

            let finalBase64 = null;
            if (stateRef.current.persona.id === 'jarvis') {
                if (lower.replace(/[^a-z]/g, '') === 'stop') { setAutoListen(false); setStatus('idle'); speak("Voice mode deactivated."); return; }
                if (lower.includes('lockdown') || lower.includes('log out')) { setAutoListen(false); setStatus('idle'); speak("Initiating system lockdown."); setTimeout(() => signOut(), 2500); return; }
                if (lower.includes('light mode')) { setIsLightMode(true); return; }
                if (lower.includes('dark mode')) { setIsLightMode(false); return; }
                if (stateRef.current.showCamera && (lower.includes('look at') || lower.includes('scan'))) finalBase64 = captureImage();
            }
            if (transcript && transcript.length > 3) sendMessage(transcript, finalBase64);
          };

        setRecognition(rec);
        try { rec.start(); } catch (e) { console.error("Mic start failed", e); }
      } else {
        console.warn("Speech recognition is not supported in this browser.");
      }
    }
  }, [memoryKey, vaultKey]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isBooted]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: "New Transmission", messages: [], updatedAt: Date.now() };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions); setCurrentSessionId(newId); setMessages([]);
    if (memoryKey) localStorage.setItem(memoryKey, JSON.stringify(updatedSessions));
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) { setCurrentSessionId(id); setMessages(session.messages); if (window.innerWidth < 768) setIsSidebarOpen(false); }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this transmission record?")) {
      const updatedSessions = sessions.filter(s => s.id !== id); setSessions(updatedSessions);
      if (memoryKey) localStorage.setItem(memoryKey, JSON.stringify(updatedSessions));
      if (currentSessionId === id) updatedSessions.length > 0 ? loadSession(updatedSessions[0].id) : startNewChat();
    }
  };

  const exportCurrentSession = () => { /* Export Logic kept identical */ };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setImageBase64(reader.result as string); reader.readAsDataURL(file); }
  };

  const sendMessage = async (textToSend: string, overrideImage: string | null = null) => {
    // 1. CLEAN RESET: Stop the mic immediately so it doesn't try to listen to the AI answer
    if (recognition) {
        try { recognition.stop(); } catch (e) {}
    }
    
    const finalImage = overrideImage || imageBase64;
    if (!textToSend.trim() && !finalImage) return;
    
    // ... (rest of your existing sendMessage code)
    
    playSystemSound('send'); 
    
    const messageContent = finalImage ? [ { type: "text", text: textToSend || "Analyze this image." }, { type: "image_url", image_url: { url: finalImage } } ] : textToSend;
    const updatedMessages: Message[] = [...messages, { role: 'user', content: messageContent as string }];
    
    setMessages(updatedMessages); setInput(''); setImageBase64(null); setStatus('processing');

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toLocaleDateString();
    const contextualPrompt = `${activePersona.prompt}\n\n[SYSTEM CONTEXT: The current real-world time is ${currentTime} on ${currentDate}.]`;

    try {
      const response = await fetch('/api/chat', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          messages: updatedMessages, 
          systemPrompt: contextualPrompt,
          vaultContext: memoryVault.join("\n") // Inject the memory vault!
        }) 
      });
      const data = await response.json();
      
      if (data.text) { 
        let rawAIResponse = data.text;
        
        // 🧠 MEMORY VAULT INTERCEPTION
        const saveRegex = /\[\[SAVE:\s*(.*?)\]\]/g;
        let match;
        const newMemories = [];
        while ((match = saveRegex.exec(rawAIResponse)) !== null) {
          newMemories.push(match[1]);
        }
        
        // Strip the tags out so the user never sees or hears them
        const cleanDisplayResponse = rawAIResponse.replace(saveRegex, '').trim();
        
        if (newMemories.length > 0) {
          playSystemSound('save'); // Play a unique chime when a memory is saved!
          const updatedVault = [...memoryVault, ...newMemories];
          setMemoryVault(updatedVault);
          if (vaultKey) localStorage.setItem(vaultKey, JSON.stringify(updatedVault));
        }

        const finalMessages: Message[] = [...updatedMessages, { role: 'assistant', content: cleanDisplayResponse }];
        setMessages(finalMessages);
        
        // Save Session State
        let currentSessions = [...sessions];
        const sessionIndex = currentSessions.findIndex(s => s.id === currentSessionId);
        if (sessionIndex > -1) {
          currentSessions[sessionIndex].messages = finalMessages; currentSessions[sessionIndex].updatedAt = Date.now();
          if (currentSessions[sessionIndex].title === "New Transmission" && textToSend) {
            currentSessions[sessionIndex].title = textToSend.slice(0, 22) + "...";
          }
          const [activeSession] = currentSessions.splice(sessionIndex, 1);
          currentSessions.unshift(activeSession); setSessions(currentSessions);
          if (memoryKey) localStorage.setItem(memoryKey, JSON.stringify(currentSessions));
        }

        speak(cleanDisplayResponse); 
      } else setStatus('idle');
    } catch (error) { console.error(error); setStatus('idle'); }
  };

  const toggleListening = () => {
    if (!recognition) return alert("Speech recognition not supported.");
    if (status === 'speaking') { window.speechSynthesis.cancel(); setStatus('idle'); setAutoListen(false); return; }
    if (status === 'listening' || autoListen) { recognition.stop(); setAutoListen(false); setStatus('idle'); } 
    else { if (activePersona.id === 'jarvis') setAutoListen(true); recognition.start(); }
  };

  if (!isLoaded) return <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center text-cyan-500 font-mono space-y-4"><Terminal className="w-8 h-8 animate-pulse text-cyan-500/50" /></div>;
  if (!user) return ( <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center text-red-500 font-mono space-y-8 select-none p-6"><ShieldAlert className="w-16 h-16 animate-pulse" /><div className="text-center space-y-2"><h1 className="text-2xl tracking-[0.3em] font-bold uppercase text-red-400">Restricted Access</h1></div><SignInButton mode="modal"><button className="px-8 py-4 border border-red-500/30 bg-red-950/30 hover:bg-red-900/50 rounded-lg text-red-300 tracking-widest">IDENTIFY YOURSELF</button></SignInButton></div> );
  if (!isBooted) return ( <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center text-cyan-500 font-mono space-y-8 select-none"><Terminal className="w-16 h-16 text-cyan-400/50 animate-pulse" /><button onClick={handleBootSequence} className="flex items-center space-x-3 px-8 py-4 border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/50 rounded-lg text-cyan-300 tracking-widest"><Power className="w-5 h-5" /><span>INITIALIZE SYSTEM</span></button></div> );

  return (
    <div className="flex h-screen w-full bg-neutral-950 overflow-hidden text-neutral-100 font-mono select-none transition-all duration-700 ease-in-out" style={isLightMode ? { filter: 'invert(1) hue-rotate(180deg)' } : {}}>
      
      {/* LIVE CAMERA */}
      {showCamera && (
        <div className="absolute top-20 right-4 z-50 bg-neutral-900 border border-cyan-500/50 p-2 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-48 md:w-64 h-auto rounded-md" style={{ transform: 'scaleX(-1)', filter: isLightMode ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
            <button onClick={() => captureImage()} className="absolute bottom-2 left-1/2 -translate-x-1/2 p-3 bg-cyan-500 text-neutral-950 rounded-full hover:scale-110 shadow-lg"><Aperture className="w-5 h-5" /></button>
            <button onClick={stopCamera} className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full hover:scale-110 shadow-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* SIDEBAR ARCHIVE */}
      <div className={`${isSidebarOpen ? 'w-64 md:w-72 border-r border-neutral-800 opacity-100' : 'w-0 opacity-0'} flex-shrink-0 h-full bg-neutral-900/95 flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-30 relative`}>
        <div className="w-64 md:w-72 h-full flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between"><span className="text-xs font-bold text-cyan-500 tracking-widest uppercase">Archive</span><button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-neutral-500"><X className="w-5 h-5" /></button></div>
          <div className="p-4"><button onClick={startNewChat} className="w-full flex items-center justify-center space-x-2 py-3 border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/40 rounded-lg text-cyan-300 text-sm transition-colors"><Plus className="w-4 h-4" /><span>New Transmission</span></button></div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
            {sessions.map(session => (
              <div key={session.id} onClick={() => loadSession(session.id)} className={`w-full text-left p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all group ${currentSessionId === session.id ? 'bg-cyan-900/30 border border-cyan-500/30' : 'hover:bg-neutral-800 border border-transparent'}`}>
                <div className="flex items-center space-x-3 overflow-hidden"><MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-cyan-400' : 'text-neutral-500'}`} /><span className={`text-xs truncate ${currentSessionId === session.id ? 'text-cyan-100' : 'text-neutral-400'}`}>{session.title}</span></div>
                <button onClick={(e) => deleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 transition-opacity"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          {/* VAULT DISPLAY IN SIDEBAR */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/50">
             <div className="text-[10px] text-cyan-500 uppercase tracking-widest mb-2 font-bold">Knowledge Vault</div>
             <div className="h-24 overflow-y-auto scrollbar-thin space-y-1">
               {memoryVault.length === 0 ? <p className="text-[10px] text-neutral-600">No memories extracted.</p> : memoryVault.map((mem, i) => ( <div key={i} className="text-[9px] text-neutral-400 bg-neutral-900 p-1 rounded border border-neutral-800">{mem}</div> ))}
             </div>
          </div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* HEADER */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-neutral-400 hover:text-cyan-400 transition-colors"><Menu className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2 text-cyan-400">
              <Terminal className="w-5 h-5 hidden sm:block" />
              <select value={activePersona.id} onChange={(e) => { const newP = PERSONAS.find(p => p.id === e.target.value) || PERSONAS[0]; setActivePersona(newP); if (newP.id === 'jarvis') startNewChat(); }} className="bg-neutral-950 border border-cyan-500/30 text-cyan-400 text-xs tracking-widest font-bold uppercase rounded px-2 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer hover:bg-cyan-950/30">
                {PERSONAS.map(p => ( <option key={p.id} value={p.id}>{p.name}</option> ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4 pl-4 border-l border-neutral-800 ml-4">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 border border-cyan-500/50 rounded-full" } }} />
          </div>
        </div>

        {activePersona.id === 'jarvis' ? (
          /* =========================================
             🚨 JARVIS MODE: 3D HOLOGRAPHIC UI 🚨
             ========================================= */
          <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-neutral-950 via-[#000510] to-neutral-950 overflow-hidden">
            
            {/* Background Grid CSS Hack */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="absolute top-6 right-6 z-20">
              <button onClick={showCamera ? stopCamera : startCamera} className={`p-3 rounded-full border transition-all ${showCamera ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-cyan-400'}`}>
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* 🔮 THE NEW 3D CORE INSTEAD OF AUDIO BARS */}
            <div className="mb-8 relative flex flex-col items-center">
              <HolographicCore status={status} />
            </div>

            <div className="h-24 w-full max-w-xl text-center overflow-hidden flex flex-col justify-start z-10">
              <p className="text-cyan-400/90 font-mono text-sm leading-relaxed tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                {messages.length > 0 ? (Array.isArray(messages[messages.length - 1].content) ? (messages[messages.length - 1].content as any)[0].text : messages[messages.length - 1].content) : "Awaiting Command..."}
              </p>
            </div>

            <div className="mt-8 z-10">
              <button onClick={toggleListening} className={`p-8 rounded-full border transition-all duration-500 ${status === 'listening' || autoListen ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:bg-cyan-500/20 hover:scale-105'}`}>
                {status === 'listening' || autoListen ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>
            </div>
            
            {/* HUD Elements from Image */}
            <div className="absolute left-8 top-1/3 flex flex-col space-y-2 opacity-50">
               <div className="text-[10px] text-cyan-500 uppercase tracking-widest border-b border-cyan-900 pb-1">System Vitals</div>
               <div className="text-[8px] text-cyan-300">CPU LOAD: {status === 'processing' ? '89%' : '12%'}</div>
               <div className="text-[8px] text-cyan-300">MEMORY ALOC: 4.2GB</div>
               <div className="text-[8px] text-cyan-300">NETWORK: SECURE TCP</div>
            </div>

          </div>
        ) : (
          /* =========================================
             💻 STANDARD MODE (UNCHANGED) 💻
             ========================================= */
          <>
            <div className="flex-none flex flex-col items-center justify-center border-b border-neutral-900 bg-gradient-to-b from-neutral-950 to-neutral-900/30 p-4 relative">
              <div className="flex items-center space-x-4 h-8 justify-center">
                {[...Array(5)].map((_, i) => ( <div key={i} className={`w-3 h-3 rounded-full bg-cyan-400 transition-all duration-300 ${status === 'listening' ? 'animate-pulse scale-125' : ''} ${status === 'processing' ? 'animate-ping' : ''} ${status === 'speaking' ? 'animate-bounce' : ''}`} style={{ animationDelay: `${i * 0.15}s` }} /> ))}
              </div>
              <p className="mt-4 text-[10px] font-semibold tracking-widest text-cyan-400/80 uppercase">{status === 'idle' && '|| System Standby ||'}{status === 'listening' && '• Listening •'}{status === 'processing' && '⚡ Crunching Matrices ⚡'}{status === 'speaking' && '🔊 Vocal Matrix Active'}</p>
              <button onClick={toggleListening} className={`absolute right-6 p-3 rounded-full border transition-all ${status === 'listening' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'}`}><Mic className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800">
              {messages.map((msg, idx) => {
                const isArray = Array.isArray(msg.content);
                const textData = isArray ? (msg.content as any[])[0].text : msg.content;
                const imageData = isArray ? (msg.content as any[])[1]?.image_url.url : null;
                return (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[10px] uppercase mb-1 tracking-wider ${msg.role === 'user' ? 'text-neutral-500' : 'text-cyan-500'}`}>{msg.role === 'user' ? (user?.firstName || 'User') : activePersona.name}</span>
                    <div className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-neutral-800 text-neutral-100' : 'bg-cyan-950/30 text-cyan-200'}`}>
                      {imageData && <img src={imageData} alt="User Upload" className="max-w-xs rounded-md mb-2 border border-neutral-700" />}
                      {msg.role === 'user' ? (textData) : ( <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />, code: CodeBlock, ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 text-cyan-100/80" {...props} /> }}>{textData as string}</ReactMarkdown> )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {imageBase64 && ( <div className="absolute bottom-[70px] left-4 bg-neutral-800 border border-cyan-500/30 p-2 rounded-lg flex items-center space-x-3 shadow-lg z-10"><ImageIcon className="w-4 h-4 text-cyan-400" /><button onClick={() => setImageBase64(null)} className="text-neutral-500 hover:text-red-400"><X className="w-4 h-4" /></button></div> )}
            
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="p-3 bg-neutral-900/60 border-t border-neutral-900 flex items-center space-x-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <button type="button" onClick={showCamera ? stopCamera : startCamera} className={`p-2 transition-colors ${showCamera ? 'text-cyan-400' : 'text-neutral-400 hover:text-cyan-400'}`}><Camera className="w-5 h-5" /></button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-neutral-400 hover:text-cyan-400 transition-colors"><Paperclip className="w-5 h-5" /></button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-cyan-500/70 text-neutral-200" />
              <button type="submit" disabled={status === 'processing'} className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 rounded"><Send className="w-4 h-4" /></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}