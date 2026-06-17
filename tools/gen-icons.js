/* Generates the PWA app icons for Neon Hockey with zero dependencies.
   Draws a neon air-hockey motif (rounded table + glowing puck) into an RGBA
   buffer and encodes it as PNG using Node's built-in zlib. */
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

// ---- minimal PNG encoder (8-bit RGBA, colour type 6) ----
function crc32(buf){
  let c = ~0;
  for (let i=0;i<buf.length;i++){
    c ^= buf[i];
    for (let k=0;k<8;k++) c = (c>>>1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const tb = Buffer.from(type,"ascii");
  const body = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body),0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba){
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  // raw scanlines with filter byte 0
  const stride = w*4;
  const raw = Buffer.alloc(h*(stride+1));
  for (let y=0;y<h;y++){
    raw[y*(stride+1)] = 0;
    rgba.copy(raw, y*(stride+1)+1, y*stride, y*stride+stride);
  }
  const idat = zlib.deflateSync(raw, {level:9});
  return Buffer.concat([sig, chunk("IHDR",ihdr), chunk("IDAT",idat), chunk("IEND",Buffer.alloc(0))]);
}

// ---- tiny drawing helpers ----
function makeCanvas(size){ return { size, buf:Buffer.alloc(size*size*4) }; }
function px(c,x,y,r,g,b,a){
  if (x<0||y<0||x>=c.size||y>=c.size||a<=0) return;
  const i=(y*c.size+x)*4;
  const sa=a, da=c.buf[i+3]/255, out=sa+da*(1-sa);
  if (out<=0) return;
  c.buf[i]  =Math.round((r*sa + c.buf[i]  *da*(1-sa))/out);
  c.buf[i+1]=Math.round((g*sa + c.buf[i+1]*da*(1-sa))/out);
  c.buf[i+2]=Math.round((b*sa + c.buf[i+2]*da*(1-sa))/out);
  c.buf[i+3]=Math.round(out*255);
}
// signed distance to a rounded rectangle (centre cx,cy; half extents hw,hh; corner r)
function sdRoundRect(x,y,cx,cy,hw,hh,r){
  const qx=Math.abs(x-cx)-(hw-r), qy=Math.abs(y-cy)-(hh-r);
  const ax=Math.max(qx,0), ay=Math.max(qy,0);
  return Math.hypot(ax,ay)+Math.min(Math.max(qx,qy),0)-r;
}

function draw(size, pad){
  const c = makeCanvas(size);
  const S = size, cx=S/2, cy=S/2;
  const inset = pad*S;                 // maskable safe-zone padding
  const hw=(S-inset*2)/2, hh=hw, r=S*0.20;
  const stroke=S*0.028, glow=S*0.05;
  for (let y=0;y<S;y++){
    for (let x=0;x<S;x++){
      // background: dark navy with a soft diagonal cyan/magenta wash
      const dx=(x-cx)/S, dy=(y-cy)/S, d=Math.hypot(dx,dy);
      let R=7,G=10,B=22;                          // base #070a16
      const cyW=Math.max(0,0.5-(d)) ; const mgW=Math.max(0,(x+y)/(2*S)-0.55);
      R+=cyW*10+mgW*90; G+=cyW*40+mgW*16; B+=cyW*70+mgW*70;
      px(c,x,y,R,G,B,1);
      // table frame (rounded rect) — neon cyan edge with outer/inner glow
      const sd=sdRoundRect(x,y,cx,cy,hw,hh,r);
      const edge=Math.max(0,1-Math.abs(sd)/(stroke/2));
      if (edge>0) px(c,x,y,150,240,255,Math.min(1,edge));
      const gl=Math.exp(-Math.abs(sd)/glow)*0.5;
      if (gl>0.02 && sd<0) px(c,x,y,33,230,255,gl*0.5);
      if (gl>0.02 && sd>0) px(c,x,y,255,43,214,gl*0.35);
      // centre line (violet)
      if (sd<-stroke && Math.abs(y-cy)<S*0.006) px(c,x,y,138,92,255,0.9);
    }
  }
  // goal marks: short bars top & bottom inside the frame
  const gw=hw*0.5;
  for (let x=Math.round(cx-gw);x<=Math.round(cx+gw);x++){
    for (let t=0;t<Math.round(stroke*0.9);t++){
      px(c,x,Math.round(cy-hh+r*0.35)+t,33,230,255,0.9);
      px(c,x,Math.round(cy+hh-r*0.35)-t,255,43,214,0.9);
    }
  }
  // the puck: glowing white-cyan disc at centre
  const pr=S*0.135;
  for (let y=Math.round(cy-pr*2);y<Math.round(cy+pr*2);y++){
    for (let x=Math.round(cx-pr*2);x<Math.round(cx+pr*2);x++){
      const dd=Math.hypot(x-cx,y-cy);
      if (dd<pr){
        const t=dd/pr;
        const R=255-t*200, G=255-t*40, B=255-t*10;       // white -> cyan-ish
        px(c,x,y,R,G,B,1);
      } else {
        const g=Math.exp(-(dd-pr)/(S*0.045))*0.6;          // glow halo
        if (g>0.02) px(c,x,y,160,240,255,g);
      }
    }
  }
  return encodePNG(S,S,c.buf);
}

const outDir = path.join(__dirname,"..","icons");
fs.mkdirSync(outDir,{recursive:true});
const targets = [
  ["icon-192.png", 192, 0.0],
  ["icon-512.png", 512, 0.0],
  ["icon-maskable-192.png", 192, 0.12],
  ["icon-maskable-512.png", 512, 0.12],
  ["apple-touch-180.png", 180, 0.06],
  ["favicon-64.png", 64, 0.0]
];
for (const [name,size,pad] of targets){
  fs.writeFileSync(path.join(outDir,name), draw(size,pad));
  console.log("wrote icons/"+name+" ("+size+"px)");
}
console.log("done");
