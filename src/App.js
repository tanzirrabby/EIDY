import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { db, auth } from "./firebase";
import { toJpeg } from "html-to-image";

import PaymentSuccess from './PaymentSuccess';
import PaymentFail from './PaymentFail';
import PaymentComponent from './PaymentComponent';

/* ═══════════════════════════════════════════════════
   CONSTANTS & DATA
═══════════════════════════════════════════════════ */
const GOLD  = "#D4AF37";
const GOLD2 = "#F5D76E";

const BOX_THEMES = [
  { id:"royal",   label:"Royal Gold",    box:"linear-gradient(145deg,#8B6914,#D4AF37,#8B6914)", lid:"linear-gradient(145deg,#A07820,#F5D76E,#A07820)", ribbon:"#C0392B", glow:"rgba(212,175,55,0.6)"  },
  { id:"teal",    label:"Ocean Teal",    box:"linear-gradient(145deg,#0D4A50,#1A8A94,#0D4A50)", lid:"linear-gradient(145deg,#0D5C63,#1AABB8,#0D5C63)", ribbon:"#D4AF37", glow:"rgba(26,171,184,0.6)"  },
  { id:"purple",  label:"Midnight",      box:"linear-gradient(145deg,#2D1B6E,#5B35CC,#2D1B6E)", lid:"linear-gradient(145deg,#3D25A0,#7B50E0,#3D25A0)", ribbon:"#F5D76E", glow:"rgba(91,53,204,0.6)"   },
  { id:"emerald", label:"Emerald",       box:"linear-gradient(145deg,#0D3B2E,#1A7A54,#0D3B2E)", lid:"linear-gradient(145deg,#0D4A38,#1AAA70,#0D4A38)", ribbon:"#D4AF37", glow:"rgba(26,122,84,0.6)"   },
  { id:"crimson", label:"Crimson Night", box:"linear-gradient(145deg,#4A0E0E,#8B2020,#4A0E0E)", lid:"linear-gradient(145deg,#5A1212,#A03030,#5A1212)", ribbon:"#F5D76E", glow:"rgba(139,32,32,0.6)"   },
  { id:"pearl",   label:"Pearl",         box:"linear-gradient(145deg,#8B7355,#C4A882,#8B7355)", lid:"linear-gradient(145deg,#A08060,#D4B896,#A08060)", ribbon:"#2D1B6E", glow:"rgba(196,168,130,0.6)" },
];

const GIFT_TYPES = [
  { id:"card",   icon:"🎴", label:"Eid Card"         },
  { id:"dua",    icon:"🤲", label:"Blessed Dua"      },
  { id:"poem",   icon:"📜", label:"Eid Poem"         },
  { id:"memory", icon:"💌", label:"Cherished Memory" },
  { id:"wish",   icon:"⭐", label:"Special Wish"     },
  { id:"secret", icon:"🔮", label:"Secret Message"   },
];

const CARD_PALETTES = [
  "linear-gradient(135deg,#0D3D44 0%,#051218 100%)",
  "linear-gradient(135deg,#2D1B6E 0%,#0D0820 100%)",
  "linear-gradient(135deg,#0D3B2A 0%,#041210 100%)",
  "linear-gradient(135deg,#3B0D0D 0%,#0A0404 100%)",
  "linear-gradient(135deg,#1A1044 0%,#07040E 100%)",
  "linear-gradient(135deg,#3B2E0D 0%,#0A0804 100%)",
];

const EID_MESSAGES = {
  card:   [n=>`To the wonderful ${n} — may this Eid bring you rivers of joy, mountains of peace, and every blessing your heart silently prays for. Eid ul-Fitr Mubarak! 🌙`, n=>`${n}, after a month of devotion and gratitude, the crescent moon has risen to celebrate you. May Allah shower His mercy on you and yours. Eid Mubarak! ✨`, n=>`Dearest ${n}, may the sweetness of Eid sewiyan linger in your home, the echo of Takbeer fill your heart, and the love of family wrap you always. Eid Mubarak!`],
  dua:    [n=>`Ya Allah, bless ${n} abundantly — in health, in wealth, in family, in faith. Make easy for them what is hard, and open every door that has been closed. Ameen. 🤲`, n=>`May Allah accept ${n}'s prayers this Eid, grant them the best of this world and the next, and keep them under His mercy always. Taqabbalallahu Minna Wa Minkum. 🌙`, n=>`O Allah, on this blessed Eid, I ask You to fill ${n}'s life with barakah, their heart with contentment, and their path with Your light. Ameen ya Rabb. ☪️`],
  poem:   [n=>`The crescent appears, silver and bright,\nAnd ${n}, you shine with that same soft light.\nMay your Eid be as golden as dawn's first ray,\nAnd blessings find you every single day. 🌙✨`, n=>`When lanterns sway and prayers rise high,\nI think of ${n} beneath the same sky.\nMay every star that watches tonight\nWitness your happiness, pure and bright. ⭐`, n=>`On this Eid morning, the world is new,\nAnd every good wish I have, ${n}, is for you.\nMay your table be full, your heart at peace,\nAnd every sorrow find its release. 🕌`],
  memory: [n=>`${n}, remember when we'd stay up counting the moon? Those moments are the treasure I carry every Eid. May this one create memories just as golden. 💛`, n=>`Every Eid reminds me of all the laughter we've shared, ${n}. Here's to adding more chapters to our story. 🌙`, n=>`${n}, some friendships feel like a gift from Allah Himself. You are that gift in my life. Wishing you an Eid as beautiful as our moments together.`],
  wish:   [n=>`${n}! I wish you a year of open doors, answered prayers, full tables, warm hugs, and the kind of deep happiness that no hardship can touch. Eid Mubarak! 🎉`, n=>`For you, ${n}: I wish every sunrise feels like a new beginning, every evening brings gratitude, and every Eid is better than the last. 🌅`, n=>`${n}, my wish for you this Eid — may you always have reasons to smile, people to love, faith to lean on, and peace in your soul. 🌟`],
  secret: [n=>`${n}... you make every gathering brighter. Your energy, your kindness, your laugh — they're irreplaceable. Eid Mubarak, beautiful soul. 🔮`, n=>`Okay ${n}, secret time — you're genuinely one of the best people I know, and I don't say it enough. This Eid, I'm saying it: you're extraordinary. 💫`, n=>`${n}, here's a secret gift: you are more loved than you know, more appreciated than you hear, and more wonderful than you believe. Eid Mubarak. 🌙`],
};

const rnd = arr => arr[Math.floor(Math.random()*arr.length)];
const AVATARS = ["🌙","⭐","🏮","✨","🌟","☪️","🕌","🌸","💫","🤲"];

function timeAgo(ts) {
  if (!ts) return "";
  const d = Date.now() - (ts?.toMillis?.() || ts);
  if(d<60000)   return "just now";
  if(d<3600000) return Math.floor(d/60000)+"m ago";
  if(d<86400000)return Math.floor(d/3600000)+"h ago";
  return Math.floor(d/86400000)+"d ago";
}

/* ═══════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════ */
const inputSt = {
  width:"100%", background:"rgba(255,255,255,0.04)",
  border:"1px solid rgba(212,175,55,0.2)", borderRadius:10,
  padding:"14px 16px", color:"rgba(255,255,255,0.95)",
  fontFamily:"'Cormorant Garamond',serif", fontSize:"18px", outline:"none",
  boxSizing: "border-box" 
};
const labelSt = {
  display:"block", fontFamily:"'Cinzel Decorative',cursive",
  fontSize:"0.75rem", color:"rgba(212,175,55,0.7)", 
  letterSpacing:2, marginBottom:8,
};
const miniBtnSt = {
  padding:"8px 14px", borderRadius:100,
  border:"1px solid rgba(255,255,255,0.1)",
  background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.65)",
  fontSize:"0.85rem", cursor:"pointer", transition:"all 0.18s", 
};

/* ═══════════════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════════════ */
function AuthScreen({ onLogin }) {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplay] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    if (!username.trim() || !password.trim()) { setError("Fill in all fields"); return; }
    const email = username.trim().toLowerCase() + "@eidgiftbox.app";
    setLoading(true); setError("");
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const dname = displayName.trim() || username.trim();
        await updateProfile(cred.user, { displayName: dname });
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          username: username.trim().toLowerCase(),
          displayName: dname,
          avatar: rnd(AVATARS),
          createdAt: serverTimestamp(),
        });
        onLogin({ uid: cred.user.uid, username: username.trim().toLowerCase(), displayName: dname, avatar: rnd(AVATARS) });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        const profile = snap.exists() ? snap.data() : { uid: cred.user.uid, username: username.trim().toLowerCase(), displayName: username.trim(), avatar: "🌙" };
        onLogin(profile);
      }
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setError("Username taken — try another!");
      else if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") setError("Account not found — register first!");
      else if (e.code === "auth/wrong-password") setError("Incorrect password!");
      else if (e.code === "auth/weak-password") setError("Password must be at least 6 characters!");
      else setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      background:"linear-gradient(160deg,#07090F,#0D0820 50%,#050D14)"}}>
      <div style={{width:"100%",maxWidth:420,background:"rgba(255,255,255,0.03)",
        border:"1px solid rgba(212,175,55,0.2)",borderRadius:24,padding:"36px 28px", boxSizing: "border-box",
        boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:"3.5rem",animation:"moonFloat 4s ease-in-out infinite",
            filter:`drop-shadow(0 0 20px ${GOLD}99)`,marginBottom:12}}>🎁</div>
          <h1 style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"1.4rem",
            background:`linear-gradient(130deg,${GOLD},${GOLD2},${GOLD})`,
            backgroundSize:"220% 220%",WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",backgroundClip:"text",
            animation:"shimmer 4s linear infinite",letterSpacing:2}}>Eid Gift Box</h1>
          <p style={{fontFamily:"'Amiri',serif",color:"rgba(212,175,55,0.5)",
            fontSize:"1rem",marginTop:6,letterSpacing:2}}>عيد الفطر المبارك</p>
        </div>
        <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.03)",
          border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:4,marginBottom:22}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{
              flex:1,padding:"14px",borderRadius:9,border:"none",
              background:mode===m?"rgba(212,175,55,0.15)":"transparent",
              borderWidth:mode===m?1:0,borderStyle:"solid",
              borderColor:mode===m?"rgba(212,175,55,0.3)":"transparent",
              color:mode===m?GOLD:"rgba(255,255,255,0.45)",
              fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",cursor:"pointer",
            }}>{m==="login"?"Sign In":"Create Account"}</button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <input value={username} onChange={e=>setUsername(e.target.value)}
            placeholder="Choose a username…" maxLength={20} style={inputSt}
            onKeyDown={e=>e.key==="Enter"&&handle()}/>
          {mode==="register"&&(
            <input value={displayName} onChange={e=>setDisplay(e.target.value)}
              placeholder="Display name (optional)…" maxLength={30} style={inputSt}/>
          )}
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="Password (min 6 chars)…" style={inputSt}
            onKeyDown={e=>e.key==="Enter"&&handle()}/>
          
          {error&&<p style={{fontSize:"0.9rem",color:"#F87171",textAlign:"center"}}>{error}</p>}
          <button onClick={handle} disabled={loading} style={{
            padding:"16px",borderRadius:12,border:"none",
            background:"linear-gradient(130deg,#D4AF37,#B8860B,#D4AF37)",
            backgroundSize:"200% 200%",animation:"shimmer 3s linear infinite",
            color:"#1a0800",fontFamily:"'Cinzel Decorative',cursive",
            fontSize:"14px",fontWeight:"bold",letterSpacing:2,cursor:loading?"not-allowed":"pointer",
            boxShadow:"0 6px 20px rgba(212,175,55,0.3)",marginTop:12,
          }}>
            {loading?"…":mode==="login"?"🌙 Sign In":"✨ Create Account"}
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:"0.85rem",color:"rgba(255,255,255,0.3)",
          marginTop:20,lineHeight:1.6}}>
          Shake the box to reveal your Eid surprise! 🎁<br/>
          Share your username so friends can send you gifts.<br/>
                      @tanzirabby
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GIFT BOX SHAKE COMPONENT
═══════════════════════════════════════════════════ */
function GiftBox({ box, onOpen }) {
  const [shakes, setShakes]     = useState(0);
  const [shaking, setShaking]   = useState(false);
  const [lidOff, setLidOff]     = useState(false);
  const [particles, setParticles] = useState([]);
  const NEEDED = 3;
  const theme  = BOX_THEMES.find(t=>t.id===box.theme)||BOX_THEMES[0];

  const shake = () => {
    if (box.opened||shaking||lidOff) return;
    setShaking(true);
    const n = shakes+1;
    setShakes(n);
    setTimeout(()=>setShaking(false), 600);
    if (n >= NEEDED) {
      setTimeout(()=>setLidOff(true), 400);
      setTimeout(()=>spawnParticles(), 900);
      setTimeout(()=>onOpen(box.id), 1200);
    }
  };

  const spawnParticles = () => {
    const items=["✨","⭐","🌟","💫","🎉","🌙","✦","★","❤️"];
    setParticles(Array.from({length:22},(_,i)=>({
      id:i,item:rnd(items),
      x:(Math.random()-0.5)*280,y:-(80+Math.random()*180),
      rot:Math.random()*720,dur:0.8+Math.random()*0.7,delay:i*0.04,
    })));
    setTimeout(()=>setParticles([]),2500);
  };

  const progress = Math.min(shakes/NEEDED*100,100);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,position:"relative"}}>
      {particles.map(p=>(
        <div key={p.id} style={{
          position:"absolute",top:"40%",left:"50%",pointerEvents:"none",zIndex:30,
          fontSize:"1.6rem",opacity:0,
          animation:`particle ${p.dur}s ease-out ${p.delay}s forwards`,
          "--px":`${p.x}px`,"--py":`${p.y}px`,"--pr":`${p.rot}deg`,
        }}>{p.item}</div>
      ))}
      <div style={{position:"relative",width:140,height:130,cursor:box.opened?"default":"pointer",userSelect:"none"}}
        onClick={shake}>
        {/* Lid */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,height:38,
          background:theme.lid,borderRadius:"10px 10px 4px 4px",
          boxShadow:`0 4px 20px ${theme.glow},inset 0 1px 0 rgba(255,255,255,0.2)`,
          transform:lidOff?"translateY(-60px) rotate(-12deg) scale(0.8)":"translateY(0)",
          opacity:lidOff?0:1,transition:"transform 0.6s cubic-bezier(0.34,1.56,0.64,1),opacity 0.4s",
          zIndex:2,animation:shaking?"boxShake 0.5s ease":"none",
        }}>
          <div style={{position:"absolute",top:"50%",left:0,right:0,height:8,
            background:theme.ribbon,transform:"translateY(-50%)",opacity:0.9}}/>
          <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",width:28,height:20,zIndex:3}}>
            <div style={{position:"absolute",left:0,top:0,width:12,height:12,
              background:theme.ribbon,borderRadius:"50% 50% 0 50%",transform:"rotate(-30deg)"}}/>
            <div style={{position:"absolute",right:0,top:0,width:12,height:12,
              background:theme.ribbon,borderRadius:"50% 50% 50% 0",transform:"rotate(30deg)"}}/>
            <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",
              width:8,height:8,background:theme.ribbon,borderRadius:"50%"}}/>
          </div>
        </div>
        {/* Body */}
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,height:100,
          background:theme.box,borderRadius:"4px 4px 12px 12px",
          boxShadow:`0 8px 30px ${theme.glow},inset 0 1px 0 rgba(255,255,255,0.1)`,
          animation:shaking?"boxShake 0.5s ease":"none",overflow:"hidden",
        }}>
          <div style={{position:"absolute",top:0,bottom:0,left:"50%",width:8,
            background:theme.ribbon,transform:"translateX(-50%)",opacity:0.9}}/>
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.08}}>
            <defs><pattern id={`bp${box.id?.slice(-4)}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <polygon points="10,1 12,7 19,7 13,11 15,17 10,13 5,17 7,11 1,7 8,7"
                stroke="#fff" strokeWidth="0.5" fill="none"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill={`url(#bp${box.id?.slice(-4)})`}/>
          </svg>
          <div style={{position:"absolute",bottom:10,right:12,fontSize:"1.6rem",opacity:0.6}}>
            {GIFT_TYPES.find(g=>g.id===box.giftType)?.icon||"🎁"}
          </div>
          {lidOff&&<div style={{position:"absolute",inset:0,
            background:`radial-gradient(circle at 50% 20%,${theme.glow},transparent 70%)`,
            animation:"glowPulse 1s ease-in-out infinite alternate"}}/>}
        </div>
        {shakes>0&&!box.opened&&<div style={{
          position:"absolute",inset:-8,borderRadius:20,
          border:`2px solid ${theme.glow.replace("0.6","0.35")}`,
          animation:"ringPulse 1s ease-in-out infinite",
        }}/>}
      </div>
      {!box.opened&&shakes>0&&(
        <div style={{width:140,marginTop:10}}>
          <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:100,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progress}%`,
              background:`linear-gradient(to right,${theme.glow},${GOLD2})`,
              borderRadius:100,transition:"width 0.3s ease"}}/>
          </div>
          <div style={{textAlign:"center",fontSize:"0.8rem",color:"rgba(255,255,255,0.45)",marginTop:6,letterSpacing:1}}>
            {NEEDED-shakes>0?`${NEEDED-shakes} more shake${NEEDED-shakes>1?"s":""}!`:"Opening…"}
          </div>
        </div>
      )}
      {!box.opened&&shakes===0&&(
        <div style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.4)",marginTop:12,letterSpacing:1,
          textAlign:"center",animation:"bounce 2s ease-in-out infinite"}}>
          👆 Tap to shake!
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   OPENED CARD (BUG-FREE DOWNLOAD FIX USING HTML-TO-IMAGE)
═══════════════════════════════════════════════════ */
function OpenedCard({ box }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const palIdx = Math.abs((box.id?.charCodeAt?.(0)||0) + (box.from?.charCodeAt?.(0)||0)) % CARD_PALETTES.length;
  const pal    = CARD_PALETTES[palIdx];
  const gType  = GIFT_TYPES.find(g=>g.id===box.giftType)||GIFT_TYPES[0];

  // 📸 NEW FLAWLESS DOWNLOAD FUNCTION
  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Small delay to ensure any animations have finished
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use the modern html-to-image library
      const dataUrl = await toJpeg(cardRef.current, { 
        quality: 0.95, 
        pixelRatio: 2, // Keeps the image high resolution
        backgroundColor: "#051218"
      });
      
      const link = document.createElement("a");
      link.download = `Eid_Gift_from_${box.from}.jpg`;
      link.href = dataUrl;
      
      document.body.appendChild(link); 
      link.click();
      document.body.removeChild(link); 
      
    } catch (err) {
      console.error("Failed to download image", err);
      alert("Oops! Failed to save image.");
    }
    setDownloading(false);
  };
  
  return (
    <div style={{animation:"cardReveal 0.7s cubic-bezier(0.34,1.56,0.64,1) both"}}>
      
      {/* THIS WRAPPER WILL BE DOWNLOADED AS AN IMAGE */}
      <div ref={cardRef} style={{background:pal,border:"1px solid rgba(201,168,76,0.3)",borderRadius:20,
        padding:"32px 28px",position:"relative",overflow:"hidden",
        boxShadow:"0 12px 40px rgba(0,0,0,0.5)"}}>
        
        {/* Beautiful SVG Background Pattern (Works perfectly with html-to-image) */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.06,pointerEvents:"none"}}>
          <defs><pattern id={`cp${box.id?.slice(-4)}`} x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
            <polygon points="22,3 26,16 40,16 29,24 33,37 22,29 11,37 15,24 4,16 18,16"
              stroke={GOLD} strokeWidth="0.5" fill="none"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill={`url(#cp${box.id?.slice(-4)})`}/>
        </svg>

        <div style={{position:"relative",zIndex:2}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{fontSize:"2.2rem"}}>{gType.icon}</div>
            <div>
              <div style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"0.75rem",color:GOLD,letterSpacing:2}}>{gType.label.toUpperCase()}</div>
              <div style={{fontFamily:"'Great Vibes',cursive",fontSize:"1.6rem",color:"rgba(255,255,255,0.9)",marginTop:2}}>from {box.from}</div>
            </div>
          </div>
          
          <div style={{height:1,background:"linear-gradient(to right,transparent,rgba(201,168,76,0.4),transparent)",marginBottom:20}}/>
          
          {/* 📸 RENDER THE ATTACHED PHOTO */}
          {box.image && (
            <div style={{textAlign: "center", marginBottom: 20}}>
              <img 
                src={box.image} 
                alt="Gift attachment" 
                crossOrigin="anonymous" 
                style={{
                  maxWidth: "100%", 
                  maxHeight: "300px", 
                  borderRadius: 16, 
                  border: `2px solid rgba(212,175,55,0.3)`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  objectFit: "cover"
                }} 
              />
            </div>
          )}

          <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:"1.15rem",
            color:"rgba(255,255,255,0.95)",lineHeight:1.8,whiteSpace:"pre-line",
            textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>{box.message}</p>
            
          {/* 💵 SALAMI REVEAL TICKET */}
          {box.salamiAmount > 0 && (
            <div style={{marginTop: 24, padding: "20px", background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))", border: `1px dashed ${GOLD}`, borderRadius: 16, textAlign: "center", position: "relative", overflow: "hidden"}}>
              <div style={{position:"absolute", top:0, left:0, bottom:0, width:6, background: box.mfsMethod==="bKash"?"#E2136E":"#F37021"}} />
              <div style={{fontSize: "0.8rem", color: GOLD, fontFamily: "'Cinzel Decorative',cursive", letterSpacing: 2}}>EID SALAMI RECEIVED</div>
              <div style={{fontSize: "2.5rem", color: "#fff", fontWeight: "bold", margin: "8px 0", textShadow: "0 2px 10px rgba(212,175,55,0.4)"}}>
                ৳{box.salamiAmount}
              </div>
              <div style={{fontSize: "0.85rem", color: "rgba(255,255,255,0.6)"}}>
                Sent via <strong style={{color: box.mfsMethod==="bKash"?"#E2136E":"#F37021"}}>{box.mfsMethod}</strong><br/>
                TrxID: <span style={{fontFamily:"monospace", color:"#fff"}}>{box.trxId || "N/A"}</span>
              </div>
            </div>
          )}

          <div style={{height:1,background:"linear-gradient(to right,transparent,rgba(201,168,76,0.3),transparent)",margin:"20px 0 16px"}}/>
          <div style={{fontFamily:"'Amiri',serif",fontSize:"0.9rem",color:"rgba(201,168,76,0.65)",textAlign:"center",letterSpacing:2}}>
            عيد الفطر المبارك ✦ Eid ul-Fitr Mubarak
          </div>
        </div>
      </div>
      
      {/* ⬇️ DOWNLOAD BUTTON */}
      <button onClick={downloadCard} disabled={downloading} style={{
        marginTop: 16, width: "100%", padding: "14px", borderRadius: 14, border: `1px solid ${GOLD}55`,
        background: "rgba(212,175,55,0.08)", color: GOLD, cursor: downloading ? "wait" : "pointer",
        fontFamily: "'Cormorant Garamond',serif", fontSize: "1.05rem", fontWeight: 600,
        transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10
      }}>
        {downloading ? "⏳ Preparing your image..." : "⬇️ Download Card as Image"}
      </button>

    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BOX CARD (inbox/sent item)
═══════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════
   BOX CARD (inbox/sent item)
═══════════════════════════════════════════════════ */
function BoxCard({ box, currentUser, onOpen, onDelete }) {
  const isRecipient = box.to === currentUser;
  const isSender    = box.from === currentUser;
  const theme       = BOX_THEMES.find(t=>t.id===box.theme)||BOX_THEMES[0];
  const [showFull, setShowFull] = useState(false);

  return (
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(212,175,55,0.14)",
      borderRadius:20,padding:"24px",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
      transition:"transform 0.2s,box-shadow 0.2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.45)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.3)";}}>
      <div style={{display:"flex",gap:18,alignItems:"flex-start"}}>
        {/* Mini box */}
        <div style={{flexShrink:0}}>
          <div style={{width:64,height:60,position:"relative",
            cursor:isRecipient&&!box.opened?"pointer":"default"}}
            onClick={()=>{ if(isRecipient&&!box.opened) setShowFull(true); }}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:20,
              background:theme.lid,borderRadius:"6px 6px 2px 2px",
              boxShadow:`0 2px 10px ${theme.glow}`,
              transform:box.opened?"translateY(-20px) scale(0.7)":"translateY(0)",
              opacity:box.opened?0:1,transition:"all 0.4s"}}/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:44,
              background:theme.box,borderRadius:"2px 2px 8px 8px",boxShadow:`0 4px 16px ${theme.glow}`}}>
              <div style={{position:"absolute",top:0,bottom:0,left:"50%",width:4,
                background:theme.ribbon,transform:"translateX(-50%)",opacity:0.8}}/>
            </div>
            {!box.opened&&isRecipient&&<div style={{position:"absolute",inset:-4,borderRadius:12,
              border:`1px solid ${theme.glow.replace("0.6","0.3")}`,animation:"ringPulse 2s ease-in-out infinite"}}/>}
          </div>
          {box.opened&&<div style={{textAlign:"center",fontSize:"0.75rem",color:"rgba(255,255,255,0.4)",marginTop:6,letterSpacing:1}}>opened</div>}
        </div>
        {/* Info */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"0.85rem",color:GOLD,letterSpacing:1}}>
              {isSender?`To: ${box.to}`:`From: ${box.from}`}
            </span>
            <span style={{fontSize:"0.75rem",background:"rgba(212,175,55,0.1)",
              border:"1px solid rgba(212,175,55,0.2)",borderRadius:100,padding:"3px 10px",
              color:"rgba(212,175,55,0.8)"}}>
              {GIFT_TYPES.find(g=>g.id===box.giftType)?.icon} {GIFT_TYPES.find(g=>g.id===box.giftType)?.label}
            </span>
            
            {/* Show Paid status if real salami was sent! */}
            {box.paid && (
              <span style={{fontSize:"0.75rem",background:"rgba(74,222,128,0.15)", border:"1px solid rgba(74,222,128,0.3)",borderRadius:100,padding:"3px 10px", color:"#4ADE80"}}>
                💵 Paid ৳{box.salamiAmount}
              </span>
            )}

            {!box.opened&&isRecipient&&<span style={{fontSize:"0.75rem",background:"rgba(212,175,55,0.15)",
              border:"1px solid rgba(212,175,55,0.4)",borderRadius:100,padding:"3px 10px",
              color:GOLD,animation:"glowPulse 2s ease-in-out infinite"}}>🎁 New!</span>}
          </div>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
            fontSize:"1.05rem",color:"rgba(255,255,255,0.6)",lineHeight:1.6,
            overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:10}}>
            {box.opened||isSender?`"${box.message.slice(0,80)}…"`:"🔒 Shake to reveal your Eid surprise!"}
          </p>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <span style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.4)"}}>{timeAgo(box.createdAt)}</span>
            
            {isRecipient&&!box.opened&&(
              <button onClick={()=>setShowFull(true)} style={{padding:"6px 16px",borderRadius:100,
                border:`1px solid ${GOLD}44`,background:"rgba(212,175,55,0.1)",color:GOLD,
                fontSize:"0.8rem",cursor:"pointer",letterSpacing:1}}>Open Gift →</button>
            )}
            
            {isRecipient&&box.opened&&(
              <button onClick={()=>setShowFull(s=>!s)} style={{padding:"6px 16px",borderRadius:100,
                border:"1px solid rgba(255,255,255,0.15)",background:"transparent",
                color:"rgba(255,255,255,0.5)",fontSize:"0.8rem",cursor:"pointer"}}>
                {showFull?"Hide":"View"} Card</button>
            )}
            
            {/* NEW SENDER BUTTONS */}
            {isSender&&(
              <>
                {!box.paid && (
                  <button onClick={()=>setShowFull(s=>!s)} style={{padding:"6px 14px",borderRadius:100,
                    border:"1px solid rgba(74,222,128,0.4)",background:"rgba(74,222,128,0.05)",
                    color:"#4ADE80",fontSize:"0.8rem",cursor:"pointer"}}>
                    {showFull ? "Close" : "💸 Add Real Salami"}
                  </button>
                )}
                <button onClick={()=>onDelete(box.id)} style={{padding:"6px 14px",borderRadius:100,
                  border:"1px solid rgba(255,80,80,0.3)",background:"transparent",
                  color:"rgba(255,80,80,0.6)",fontSize:"0.8rem",cursor:"pointer"}}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shake experience */}
      {showFull&&!box.opened&&isRecipient&&(
        <div style={{marginTop:24,display:"flex",flexDirection:"column",alignItems:"center",gap:24,
          padding:"36px 20px",background:"rgba(0,0,0,0.3)",borderRadius:16,animation:"cardReveal 0.4s ease"}}>
          <div style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"0.8rem",
            color:GOLD,letterSpacing:2,textAlign:"center"}}>YOUR EID GIFT AWAITS</div>
          <GiftBox box={box} onOpen={(id)=>{ onOpen(id); setTimeout(()=>setShowFull(false),3000); }}/>
        </div>
      )}
      
      {showFull&&box.opened&&<div style={{marginTop:20,animation:"cardReveal 0.4s ease"}}><OpenedCard box={box}/></div>}
      
      {/* 🔴 THIS IS WHERE YOUR PAYMENT COMPONENT GOES! */}
      {showFull && isSender && !box.paid && (
        <div style={{marginTop:20,animation:"cardReveal 0.4s ease"}}>
           <PaymentComponent boxId={box.id} senderName={currentUser} />
        </div>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CREATE GIFT FORM
═══════════════════════════════════════════════════ */
function CreateGift({ user, onCreated, showToast }) {
  const [to,      setTo]      = useState("");
  const [type,    setType]    = useState("card");
  const [theme,   setTheme]   = useState("royal");
  const [msg,     setMsg]     = useState("");
  const [salami,  setSalami]  = useState("");
  const [mfs,     setMfs]     = useState("bKash");
  const [trxId,   setTrxId]   = useState("");
  const [image,   setImage]   = useState(null);
  const [imgLoad, setImgLoad] = useState(false);
  
  const [aiLoad,  setAiLoad]  = useState(false);
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [preview, setPreview] = useState(false);
  const themeObj = BOX_THEMES.find(t=>t.id===theme)||BOX_THEMES[0];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgLoad(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        let scale = 1;
        if (img.width > MAX_WIDTH) {
          scale = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL("image/jpeg", 0.7)); 
        setImgLoad(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const aiWrite = async () => {
    if (!to.trim()) { showToast("Enter recipient name first!"); return; }
    setAiLoad(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:220,
          messages:[{role:"user",content:`Write a short beautiful Eid ul-Fitr gift message (2-4 sentences, no hashtags) as a ${GIFT_TYPES.find(g=>g.id===type)?.label} from "${user.displayName||user.username}" to "${to}". Heartfelt and personal. Just the message text.`}]})
      });
      const data = await res.json();
      setMsg(data.content?.[0]?.text?.trim() || rnd(EID_MESSAGES[type])(to));
    } catch { setMsg(rnd(EID_MESSAGES[type])(to)); }
    setAiLoad(false);
  };

  const send = async () => {
    if (!to.trim()||!msg.trim()) { showToast("Fill in recipient and message!"); return; }
    if (salami > 0 && !trxId.trim()) { showToast("Please enter the TrxID for your Salami!"); return; }
    
    setSending(true);
    try {
      const boxRef = await addDoc(collection(db,"boxes"),{
        from: user.username, fromDisplay: user.displayName||user.username,
        to: to.trim().toLowerCase(),
        giftType: type, 
        theme: theme, 
        message: msg.trim(),
        salamiAmount: Number(salami) || 0,
        mfsMethod: mfs,
        trxId: trxId.trim(),
        image: image,
        opened: false, 
        createdAt: serverTimestamp(),
      });
      // Send notification
      await addDoc(collection(db,"notifications"),{
        to: to.trim().toLowerCase(),
        from: user.username,
        text: `${user.displayName||user.username} sent you an Eid gift box! 🎁`,
        read: false,
        boxId: boxRef.id,
        createdAt: serverTimestamp(),
      });
      onCreated();
      setSent(true);
      setTimeout(()=>{ 
        setSent(false); setSending(false); setTo(""); setMsg(""); 
        setSalami(""); setTrxId(""); setImage(null); setPreview(false); 
      },2000);
    } catch(e) { showToast("Error sending. Try again!"); setSending(false); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <label style={labelSt}>🎯 Send To (username)</label>
        <input value={to} onChange={e=>setTo(e.target.value)}
          placeholder="Friend's username…" maxLength={20} style={inputSt}/>
      </div>
      <div>
        <label style={labelSt}>🎴 Gift Type</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {GIFT_TYPES.map(g=>(
            <button key={g.id} onClick={()=>{setType(g.id);setMsg("");}} style={{
              padding:"12px 8px",borderRadius:12,
              border:type===g.id?`1px solid ${GOLD}`:"1px solid rgba(255,255,255,0.08)",
              background:type===g.id?"rgba(212,175,55,0.12)":"rgba(255,255,255,0.02)",
              color:type===g.id?GOLD:"rgba(255,255,255,0.65)",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.2s",
            }}>
              <span style={{fontSize:"1.6rem"}}>{g.icon}</span>
              <span style={{fontSize:"0.8rem",letterSpacing:0.5}}>{g.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={labelSt}>🎨 Box Theme</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {BOX_THEMES.map(t=>(
            <button key={t.id} onClick={()=>setTheme(t.id)} style={{
              padding:"14px 10px",borderRadius:12,background:t.box,
              border:theme===t.id?"2px solid #fff":"2px solid transparent",
              cursor:"pointer",color:"rgba(255,255,255,0.9)",fontSize:"0.85rem",
              boxShadow:theme===t.id?`0 0 16px ${t.glow}`:"none",
              transform:theme===t.id?"scale(1.05)":"scale(1)",transition:"all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      
      {/* 📸 PHOTO ATTACHMENT SECTION */}
      <div>
        <label style={{...labelSt, marginBottom:8}}>📸 Attach a Selfie / Photo (Optional)</label>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <label style={{
            padding:"10px 16px", borderRadius:12, border:"1px dashed rgba(212,175,55,0.4)",
            background:"rgba(212,175,55,0.05)", color:GOLD, fontSize:"0.85rem",
            cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8, transition:"all 0.2s"
          }}>
            {imgLoad ? "⏳ Processing..." : image ? "✅ Photo Attached!" : "Upload Image"}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}} />
          </label>
          {image && (
            <button onClick={()=>setImage(null)} style={{background:"none", border:"none", color:"#F87171", cursor:"pointer", fontSize:"0.8rem"}}>
              Remove
            </button>
          )}
        </div>
        {image && <img src={image} alt="preview" style={{width:"80px", height:"80px", objectFit:"cover", borderRadius:10, marginTop:10, border:`1px solid ${GOLD}`}} />}
      </div>

      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <label style={{...labelSt,marginBottom:0}}>💌 Message</label>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setMsg(rnd(EID_MESSAGES[type])(to||"you"))} style={miniBtnSt}>🎲 Random</button>
            <button onClick={aiWrite} disabled={aiLoad} style={{...miniBtnSt,borderColor:"rgba(212,175,55,0.4)",color:GOLD}}>
              {aiLoad?"…":"✨ AI Write"}
            </button>
          </div>
        </div>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)}
          placeholder="Write your Eid message, or use AI Write…" maxLength={500}
          style={{...inputSt,minHeight:120,resize:"none",display:"block",width:"100%",fontStyle:"italic",lineHeight:1.65}}/>
        <div style={{textAlign:"right",fontSize:"0.8rem",color:"rgba(255,255,255,0.4)",marginTop:6}}>{msg.length}/500</div>
      </div>

      {/* 💸 REAL EID SALAMI SECTION */}
      <div style={{background:"rgba(212,175,55,0.05)", border:"1px dashed rgba(212,175,55,0.3)", borderRadius:16, padding:"20px"}}>
        <label style={{...labelSt, marginBottom:12}}>💸 Send Real Eid Salami (Optional)</label>
        <div style={{display:"flex", gap:10, marginBottom:salami>0?12:0}}>
          <select value={mfs} onChange={e=>setMfs(e.target.value)} style={{...inputSt, width:"110px", padding:"12px", cursor:"pointer", color:GOLD}}>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
          </select>
          <input type="number" value={salami} onChange={e=>setSalami(e.target.value)} placeholder="Amount (৳)" style={{...inputSt, flex:1}}/>
        </div>
        
        {salami > 0 && (
          <div style={{animation:"slideDown 0.3s ease"}}>
            <p style={{fontSize:"0.9rem", color:"rgba(255,255,255,0.5)", marginBottom:10, fontStyle:"italic"}}>
              Send ৳{salami} to the recipient using your {mfs} app, then paste the Transaction ID below:
            </p>
            <input value={trxId} onChange={e=>setTrxId(e.target.value)} placeholder="Enter TrxID (e.g., 9A7B6C5D)" style={inputSt}/>
          </div>
        )}
      </div>

      <button onClick={()=>setPreview(p=>!p)} style={{...miniBtnSt,width:"100%",padding:"12px",justifyContent:"center",display:"flex"}}>
        {preview?"▲ Hide Preview":"👁 Preview Gift Box"}
      </button>
      {preview&&(
        <div style={{background:"rgba(0,0,0,0.3)",borderRadius:16,padding:"32px",
          display:"flex",flexDirection:"column",alignItems:"center",gap:20,animation:"cardReveal 0.35s ease"}}>
          <div style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"0.8rem",
            color:"rgba(255,255,255,0.4)",letterSpacing:2}}>PREVIEW</div>
          <div style={{position:"relative",width:140,height:130}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:38,
              background:themeObj.lid,borderRadius:"10px 10px 4px 4px",boxShadow:`0 4px 20px ${themeObj.glow}`}}>
              <div style={{position:"absolute",top:"50%",left:0,right:0,height:8,background:themeObj.ribbon,transform:"translateY(-50%)"}}/>
              <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",width:28,height:20}}>
                <div style={{position:"absolute",left:0,top:0,width:12,height:12,background:themeObj.ribbon,borderRadius:"50% 50% 0 50%",transform:"rotate(-30deg)"}}/>
                <div style={{position:"absolute",right:0,top:0,width:12,height:12,background:themeObj.ribbon,borderRadius:"50% 50% 50% 0",transform:"rotate(30deg)"}}/>
                <div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",width:8,height:8,background:themeObj.ribbon,borderRadius:"50%"}}/>
              </div>
            </div>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:100,
              background:themeObj.box,borderRadius:"4px 4px 12px 12px",boxShadow:`0 8px 30px ${themeObj.glow}`}}>
              <div style={{position:"absolute",top:0,bottom:0,left:"50%",width:8,background:themeObj.ribbon,transform:"translateX(-50%)"}}/>
            </div>
          </div>
          {msg&&<p style={{maxWidth:300,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
            fontSize:"1.05rem",color:"rgba(255,255,255,0.75)",lineHeight:1.7,textAlign:"center"}}>
            "{msg.slice(0,120)}{msg.length>120?"…":""}"</p>}
        </div>
      )}
      <button onClick={send} disabled={sending||sent||!to.trim()||!msg.trim()} style={{
        width:"100%",padding:"18px",borderRadius:14,border:"none",
        background:sent?"rgba(74,222,128,0.25)":"linear-gradient(130deg,#D4AF37,#B8860B,#D4AF37)",
        backgroundSize:"200% 200%",
        color:sent?"#4ADE80":"#1a0800",
        fontFamily:"'Cinzel Decorative',cursive",fontSize:"15px", fontWeight:"bold",
        letterSpacing:2,cursor:(sending||sent)?"not-allowed":"pointer",
        boxShadow:sent?"none":"0 6px 22px rgba(212,175,55,0.35)",
        animation:(!sent&&!sending)?"shimmer 3s linear infinite":"none",transition:"all 0.25s",
      }}>
        {sent?"✓ Gift Sent! 🎁":sending?"Sending…":"🎁 Send Eid Gift Box"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════════════════ */
function NotifPanel({ username, onClose }) {
  const [notifs,setNotifs] = useState([]);
  useEffect(()=>{
    const q = query(collection(db,"notifications"),where("to","==",username),orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{
      setNotifs(snap.docs.map(d=>({id:d.id,...d.data()})));
      // Mark all as read
      snap.docs.forEach(d=>{ if(!d.data().read) updateDoc(d.ref,{read:true}); });
    });
    return unsub;
  },[username]);
  return (
    <div style={{position:"fixed",top:70,right:16,width:320,maxHeight:"70vh",overflowY:"auto",
      background:"#0D1228",border:"1px solid rgba(212,175,55,0.3)",borderRadius:18,padding:"20px",
      zIndex:1000,boxShadow:"0 20px 60px rgba(0,0,0,0.8)",animation:"cardReveal 0.3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"0.85rem",color:GOLD,letterSpacing:2}}>NOTIFICATIONS</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"1.6rem"}}>×</button>
      </div>
      {notifs.length===0&&<p style={{color:"rgba(255,255,255,0.4)",fontSize:"1rem",fontStyle:"italic",textAlign:"center",padding:"30px 0"}}>No notifications yet</p>}
      {notifs.map(n=>(
        <div key={n.id} style={{padding:"14px 16px",borderRadius:12,
          background:n.read?"rgba(255,255,255,0.03)":"rgba(212,175,55,0.08)",
          marginBottom:10,border:`1px solid ${n.read?"rgba(255,255,255,0.08)":"rgba(212,175,55,0.2)"}`}}>
          <p style={{fontSize:"0.95rem",color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>{n.text}</p>
          <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.4)", display:"block", marginTop:"6px"}}>{timeAgo(n.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   1️⃣ MAIN HOME COMPONENT 
═══════════════════════════════════════════════════ */
function Home() {
  const [user,       setUser]       = useState(null);
  const [authChecked,setAuthChecked]= useState(false);
  const [inbox,      setInbox]      = useState([]);
  const [sent,       setSent]       = useState([]);
  const [tab,        setTab]        = useState("inbox");
  const [toast,      setToast]      = useState("");
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [unread,     setUnread]     = useState(0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(()=>setToast(""),3200);
  };

  // Auth state listener
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async fireUser=>{
      if (fireUser) {
        const snap = await getDoc(doc(db,"users",fireUser.uid));
        if (snap.exists()) setUser(snap.data());
        else setUser({ uid:fireUser.uid, username:fireUser.email?.split("@")[0]||"user", displayName:fireUser.displayName||"User", avatar:"🌙" });
      } else { setUser(null); }
      setAuthChecked(true);
    });
    return unsub;
  },[]);

  // Real-time inbox listener
  useEffect(()=>{
    if (!user) return;
    const q = query(collection(db,"boxes"),where("to","==",user.username),orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{ setInbox(snap.docs.map(d=>({id:d.id,...d.data()}))); });
    return unsub;
  },[user]);

  // Real-time sent listener
  useEffect(()=>{
    if (!user) return;
    const q = query(collection(db,"boxes"),where("from","==",user.username),orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap=>{ setSent(snap.docs.map(d=>({id:d.id,...d.data()}))); });
    return unsub;
  },[user]);

  // Unread notifications count
  useEffect(()=>{
    if (!user) return;
    const q = query(collection(db,"notifications"),where("to","==",user.username),where("read","==",false));
    const unsub = onSnapshot(q, snap=>setUnread(snap.size));
    return unsub;
  },[user]);

  const handleOpen = async (boxId) => {
    await updateDoc(doc(db,"boxes",boxId),{ opened:true, openedAt:serverTimestamp() });
    const box = inbox.find(b=>b.id===boxId);
    if (box) {
      await addDoc(collection(db,"notifications"),{
        to: box.from,
        from: user.username,
        text: `${user.displayName||user.username} just opened your Eid gift box! 🎉`,
        read:false, createdAt:serverTimestamp(),
      });
    }
    showToast("🎉 Eid Mubarak! Your gift is revealed!");
  };

  const handleDelete = async (boxId) => {
    await deleteDoc(doc(db,"boxes",boxId));
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); setInbox([]); setSent([]);
  };

  if (!authChecked) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"#07090F"}}>
      <div style={{fontSize:"4rem",animation:"moonFloat 2s ease-in-out infinite",
        filter:`drop-shadow(0 0 20px ${GOLD}88)`}}>🎁</div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={setUser}/>;

  const unopened = inbox.filter(b=>!b.opened).length;
  const stars = Array.from({length:50},(_,i)=>({id:i,ch:i%3===0?"✦":"★",top:`${Math.random()*100}%`,left:`${Math.random()*100}%`,fs:`${Math.random()*8+5}px`,op:Math.random()*0.4+0.1,dur:`${Math.random()*3+2}s`,del:`${Math.random()*5}s`}));

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#07090F 0%,#0D0820 45%,#050D14 100%)",
      color:"#e8e0d0",fontFamily:"'Cormorant Garamond',serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Amiri:ital,wght@0,400;0,700;1,400&family=Great+Vibes&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes twinkle{0%,100%{opacity:0.15;transform:scale(0.8);}50%{opacity:1;transform:scale(1.4);}}
        @keyframes moonFloat{0%,100%{transform:translateY(0)rotate(-5deg);}50%{transform:translateY(-14px)rotate(5deg);}}
        @keyframes boxShake{0%,100%{transform:translateX(0)rotate(0);}15%{transform:translateX(-8px)rotate(-3deg);}30%{transform:translateX(8px)rotate(3deg);}45%{transform:translateX(-5px)rotate(-2deg);}60%{transform:translateX(5px)rotate(2deg);}75%{transform:translateX(-3px);}90%{transform:translateX(3px);}}
        @keyframes cardReveal{0%{opacity:0;transform:scale(0.92)translateY(12px);}70%{transform:scale(1.02);}100%{opacity:1;transform:scale(1)translateY(0);}}
        @keyframes particle{0%{opacity:1;transform:translate(0,0)scale(0.5)rotate(0deg);}100%{opacity:0;transform:translate(var(--px),var(--py))scale(1.6)rotate(var(--pr));}}
        @keyframes ringPulse{0%,100%{opacity:0.5;transform:scale(1);}50%{opacity:1;transform:scale(1.06);}}
        @keyframes glowPulse{0%,100%{opacity:0.7;}50%{opacity:1;}}
        @keyframes shimmer{0%{background-position:0% 50%;}100%{background-position:220% 50%;}}
        @keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px);}to{opacity:1;transform:translateY(0);}}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.22);}
        input:focus,textarea:focus,select:focus{border-color:rgba(212,175,55,0.5)!important;box-shadow:0 0 0 3px rgba(212,175,55,0.1);outline:none;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.4);border-radius:4px;}
        select option { background: #0D1228; color: ${GOLD}; }
      `}</style>

      {/* Stars */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        {stars.map(s=><div key={s.id} style={{position:"absolute",color:GOLD,top:s.top,left:s.left,
          fontSize:s.fs,opacity:s.op,animation:`twinkle ${s.dur} ease-in-out infinite`,animationDelay:s.del,pointerEvents:"none"}}>{s.ch}</div>)}
      </div>

      {/* TOPBAR */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,9,26,0.92)",
        backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(212,175,55,0.1)",
        padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"1.8rem",filter:`drop-shadow(0 0 10px ${GOLD}88)`}}>🎁</span>
          <span style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"0.9rem",color:GOLD,letterSpacing:2}}>EID GIFT BOX</span>
        </div>
        <div style={{display:"flex",gap:6,background:"rgba(255,255,255,0.03)",
          border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:6,flex:1,maxWidth:420}}>
          {[
            {id:"inbox",label:`📬 Inbox${unopened>0?` (${unopened})`:""}`},
            {id:"send", label:"🎁 Send"},
            {id:"sent", label:"📤 Sent"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"10px 8px",borderRadius:10,border:"none",
              background:tab===t.id?"rgba(212,175,55,0.12)":"transparent",
              borderWidth:tab===t.id?1:0,borderStyle:"solid",
              borderColor:tab===t.id?"rgba(212,175,55,0.28)":"transparent",
              color:tab===t.id?GOLD:"rgba(255,255,255,0.4)",
              fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontWeight:600,
              cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap",
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setNotifOpen(o=>!o)} style={{position:"relative",background:"none",border:"none",cursor:"pointer",fontSize:"1.5rem",padding:"4px"}}>
            🔔{unread>0&&<span style={{position:"absolute",top:0,right:0,width:20,height:20,borderRadius:"50%",
              background:"#C0392B",color:"white",fontSize:"0.75rem",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{unread}</span>}
          </button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:"1.2rem"}}>{user.avatar||"🌙"}</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontWeight:600,color:"rgba(255,255,255,0.65)",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {user.displayName||user.username}
            </span>
            <button onClick={handleLogout} style={{background:"none",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,color:"rgba(255,255,255,0.4)",fontSize:"0.8rem",cursor:"pointer",padding:"4px 10px"}}>Logout</button>
          </div>
        </div>
      </div>

      {notifOpen&&<NotifPanel username={user.username} onClose={()=>setNotifOpen(false)}/>}

      {/* MAIN */}
      <div style={{position:"relative",zIndex:10,maxWidth:740,margin:"0 auto",padding:"32px 16px 80px"}}>

        {/* INBOX */}
        {tab==="inbox"&&(
          <div style={{animation:"slideDown 0.3s ease"}}>
            <div style={{marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div>
                <h2 style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"1.2rem",color:GOLD,letterSpacing:2}}>Your Gift Box Inbox</h2>
                <p style={{fontSize:"1rem",color:"rgba(255,255,255,0.45)",marginTop:6,fontStyle:"italic"}}>
                  Share your username: <span style={{color:GOLD,fontWeight:600}}>@{user.username}</span>
                </p>
              </div>
              {unopened>0&&<div style={{fontSize:"0.85rem",background:"rgba(212,175,55,0.12)",
                border:"1px solid rgba(212,175,55,0.3)",borderRadius:100,padding:"6px 16px",
                color:GOLD,fontWeight:600,animation:"glowPulse 2s ease-in-out infinite"}}>🎁 {unopened} new!</div>}
            </div>
            {inbox.length===0&&(
              <div style={{textAlign:"center",padding:"80px 20px",background:"rgba(255,255,255,0.02)",
                border:"1px dashed rgba(212,175,55,0.15)",borderRadius:24}}>
                <div style={{fontSize:"5rem",opacity:0.2,animation:"moonFloat 4s ease-in-out infinite",marginBottom:20}}>🎁</div>
                <p style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"0.9rem",color:"rgba(212,175,55,0.4)",letterSpacing:2}}>No gifts yet</p>
                <p style={{color:"rgba(255,255,255,0.35)",fontSize:"1.05rem",marginTop:10,fontStyle:"italic"}}>
                  Share your username <strong style={{color:GOLD}}>@{user.username}</strong> with friends!
                </p>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {inbox.map(b=><BoxCard key={b.id} box={b} currentUser={user.username} onOpen={handleOpen} onDelete={handleDelete}/>)}
            </div>
          </div>
        )}

        {/* SEND */}
        {tab==="send"&&(
          <div style={{animation:"slideDown 0.3s ease"}}>
            <div style={{marginBottom:24}}>
              <h2 style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"1.2rem",color:GOLD,letterSpacing:2}}>Send an Eid Gift Box</h2>
              <p style={{fontSize:"1rem",color:"rgba(255,255,255,0.45)",marginTop:6,fontStyle:"italic"}}>Craft a surprise — your friend shakes it open to reveal your message!</p>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(212,175,55,0.14)",borderRadius:24,padding:"32px 24px"}}>
              <CreateGift user={user} onCreated={()=>setTab("sent")} showToast={showToast}/>
            </div>
          </div>
        )}

        {/* SENT */}
        {tab==="sent"&&(
          <div style={{animation:"slideDown 0.3s ease"}}>
            <div style={{marginBottom:24}}>
              <h2 style={{fontFamily:"'Cinzel Decorative',cursive",fontSize:"1.2rem",color:GOLD,letterSpacing:2}}>Gifts You've Sent</h2>
              <p style={{fontSize:"1rem",color:"rgba(255,255,255,0.45)",marginTop:6,fontStyle:"italic"}}>
                {sent.length===0?"No gifts sent yet!":
                 `${sent.length} gift${sent.length>1?"s":""} • ${sent.filter(b=>b.opened).length} opened`}
              </p>
            </div>
            {sent.length===0&&(
              <div style={{textAlign:"center",padding:"80px 20px",background:"rgba(255,255,255,0.02)",
                border:"1px dashed rgba(212,175,55,0.15)",borderRadius:24}}>
                <div style={{fontSize:"5rem",opacity:0.2,animation:"moonFloat 4s ease-in-out infinite",marginBottom:20}}>🎁</div>
                <p style={{color:"rgba(255,255,255,0.35)",fontStyle:"italic",fontSize:"1.1rem"}}>Send your first Eid gift box!</p>
                <button onClick={()=>setTab("send")} style={{marginTop:20,padding:"14px 28px",borderRadius:12,
                  border:"1px solid rgba(212,175,55,0.3)",background:"rgba(212,175,55,0.1)",color:GOLD,
                  fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontWeight:600,cursor:"pointer"}}>Create a Gift →</button>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {sent.map(b=><BoxCard key={b.id} box={b} currentUser={user.username} onOpen={handleOpen} onDelete={handleDelete}/>)}
            </div>
          </div>
        )}
      </div>

      {toast&&<div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",
        background:"linear-gradient(130deg,#0D5C63,#14808A)",color:"white",
        fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontWeight:600,
        padding:"14px 30px",borderRadius:100,boxShadow:"0 8px 30px rgba(0,0,0,0.6)",
        zIndex:9999,whiteSpace:"nowrap",animation:"cardReveal 0.4s ease"}}>{toast}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   2️⃣ THE ROUTER (The new "App")
═══════════════════════════════════════════════════ */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-fail" element={<PaymentFail />} />
      </Routes>
    </Router>
  );
}

export default App;