const input=document.getElementById("file-input");
const dropZone=document.getElementById("drop-zone");
const fileArea=document.getElementById("file-area");
const fileList=document.getElementById("file-list");
const fileCount=document.getElementById("file-count");
const runButton=document.getElementById("run-button");
const clearButton=document.getElementById("clear-button");
const statusText=document.getElementById("status");
const tabs=[...document.querySelectorAll(".tool-tab")];
const selectedFiles=[];
let currentTool="merge";
document.getElementById("year").textContent=new Date().getFullYear();
if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const config={
 merge:{title:"Merge PDF files",desc:"Combine multiple PDFs into one document in your chosen order.",hint:"Select two or more PDF files",accept:"application/pdf,.pdf",multiple:true,button:"Merge PDFs"},
 split:{title:"Split PDF pages",desc:"Save selected pages as a separate PDF. Use ranges such as 1-3, 5, 8-10.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Split PDF"},
 rotate:{title:"Rotate PDF pages",desc:"Rotate every page in your PDF by 90, 180 or 270 degrees.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Rotate PDF"},
 compress:{title:"Compress PDF",desc:"Reduce PDF size by rendering pages as compressed images. Visual layout is retained, but text will no longer be selectable or searchable.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Compress PDF"},
 "to-images":{title:"PDF to Images",desc:"Convert each PDF page into a PNG image and download them in a ZIP file.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Convert to Images"},
 "from-images":{title:"Images to PDF",desc:"Combine JPG and PNG images into one PDF document.",hint:"Select one or more images",accept:"image/png,image/jpeg,.png,.jpg,.jpeg",multiple:true,button:"Create PDF"},
 "page-numbers":{title:"Add PDF Page Numbers",desc:"Add a page number to the bottom center of every page.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Add Page Numbers"},
 watermark:{title:"Add PDF Watermark",desc:"Stamp your own text across every page of the PDF.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Add Watermark"},
 "delete-pages":{title:"Delete PDF Pages",desc:"Remove selected pages using page numbers or ranges.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Delete Pages"},
 reorder:{title:"Reorder PDF Pages",desc:"Set a new page order, for example 3, 1, 2. Include every page exactly once.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Reorder Pages"},
 "to-text":{title:"PDF to Text",desc:"Extract selectable text from each PDF page into a TXT file.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Extract Text"}
};
function setStatus(m,t=""){statusText.textContent=m;statusText.className=t?"status "+t:"status";}
function sizeText(n){return n<1048576?Math.max(1,Math.round(n/1024))+" KB":(n/1048576).toFixed(1)+" MB";}
function renderFiles(){
 fileList.replaceChildren();selectedFiles.forEach(f=>{const li=document.createElement("li");li.textContent=f.name+" · "+sizeText(f.size);fileList.append(li);});
 fileArea.hidden=!selectedFiles.length;fileCount.textContent=selectedFiles.length+(selectedFiles.length===1?" file":" files");
 const enough=(currentTool==="merge"||currentTool==="from-images")?selectedFiles.length>=2:selectedFiles.length===1;
 runButton.disabled=!enough;clearButton.disabled=!selectedFiles.length;
 if(!selectedFiles.length)setStatus("Choose "+((currentTool==="merge"||currentTool==="from-images")?"at least two files.":"a file to get started."));
 else if(!enough)setStatus("Add at least one more file.");else setStatus("Ready. "+selectedFiles.length+" file(s) selected.");
}
function addOption(labelText,id,values,labels){
 const wrap=document.createElement("div");wrap.className="option-field";const label=document.createElement("label");label.htmlFor=id;label.textContent=labelText;
 const select=document.createElement("select");select.id=id;values.forEach((v,i)=>{const o=document.createElement("option");o.value=v;o.textContent=labels[i];select.append(o);});wrap.append(label,select);document.getElementById("options").append(wrap);
}
function renderOptions(){
 const area=document.getElementById("options");area.replaceChildren();
 if(currentTool==="split"){const wrap=document.createElement("div");wrap.className="option-field";const label=document.createElement("label");label.htmlFor="page-ranges";label.textContent="Pages to extract (example: 1-3, 5, 8-10)";const field=document.createElement("input");field.id="page-ranges";field.placeholder="1-3, 5";field.value="1";wrap.append(label,field);area.append(wrap);}
 if(currentTool==="rotate")addOption("Rotation angle","rotation-angle",["90","180","270"],["90° clockwise","180°","270° clockwise"]);
 if(currentTool==="to-images")addOption("Image quality","image-scale",["1","1.5","2"],["Standard","High","Very high"]);
 if(currentTool==="compress"){addOption("Compression level","compression-level",["small","balanced","clear"],["Smaller file (lower quality)","Balanced (recommended)","Clearer pages (larger file)"]);const p=document.createElement("p");p.className="muted";p.textContent="Important: real compression converts each page into a JPEG image. The pages should look similar, but text will no longer be selectable or searchable, and forms, links and bookmarks may not be preserved. If the compressed file is not smaller, the original PDF is downloaded unchanged.";area.append(p);}
 if(currentTool==="page-numbers"){const wrap=document.createElement("div");wrap.className="option-field";const label=document.createElement("label");label.htmlFor="number-start";label.textContent="Starting number";const field=document.createElement("input");field.id="number-start";field.type="number";field.min="1";field.value="1";wrap.append(label,field);area.append(wrap);}
 if(currentTool==="watermark"){const wrap=document.createElement("div");wrap.className="option-field";const label=document.createElement("label");label.htmlFor="watermark-text";label.textContent="Watermark text";const field=document.createElement("input");field.id="watermark-text";field.maxLength=80;field.placeholder="CONFIDENTIAL";wrap.append(label,field);area.append(wrap);addOption("Watermark opacity","watermark-opacity",["0.15","0.25","0.4"],["Light","Medium","Dark"]);}
 if(currentTool==="delete-pages"){const wrap=document.createElement("div");wrap.className="option-field";const label=document.createElement("label");label.htmlFor="delete-ranges";label.textContent="Pages to delete (example: 2, 4-6)";const field=document.createElement("input");field.id="delete-ranges";field.placeholder="2, 4-6";wrap.append(label,field);area.append(wrap);}
 if(currentTool==="reorder"){const wrap=document.createElement("div");wrap.className="option-field";const label=document.createElement("label");label.htmlFor="page-order";label.textContent="New page order (example: 3, 1, 2)";const field=document.createElement("input");field.id="page-order";field.placeholder="3, 1, 2";wrap.append(label,field);area.append(wrap);}
}
function setTool(tool){
 currentTool=tool;const c=config[tool];selectedFiles.length=0;input.value="";
 tabs.forEach(t=>t.classList.toggle("active",t.dataset.tool===tool));
 document.querySelectorAll(".tool-link").forEach(t=>t.classList.toggle("active",t.dataset.tool===tool));
 const at=tabs.find(t=>t.dataset.tool===tool);if(at&&at.scrollIntoView)at.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"});
 document.getElementById("tool-title").textContent=c.title;document.getElementById("tool-description").textContent=c.desc;
 document.getElementById("tool-number").textContent="PDF TOOL "+String(tabs.findIndex(t=>t.dataset.tool===tool)+1).padStart(2,"0");
 document.getElementById("upload-title").textContent=c.multiple?"Choose files":"Choose a file";document.getElementById("file-hint").textContent=c.hint;
 document.getElementById("tool-icon").textContent=({"merge":"＋","split":"✂","rotate":"↻","compress":"⇩","to-images":"▧","from-images":"▣","page-numbers":"№","watermark":"◆","delete-pages":"✕","reorder":"↕","to-text":"T"})[tool];
 input.accept=c.accept;input.multiple=c.multiple;runButton.textContent=c.button;renderOptions();renderFiles();
}
function addFiles(list){
 let added=0,rejected=0;[...(list||[])].forEach(f=>{
  const ok=currentTool==="from-images"?(f.type==="image/png"||f.type==="image/jpeg"||/\.(png|jpe?g)$/i.test(f.name)):(f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf"));
  if(!ok){rejected++;return;}
  if(!selectedFiles.some(x=>x.name===f.name&&x.size===f.size&&x.lastModified===f.lastModified)){selectedFiles.push(f);added++;}
 });
 renderFiles();if(rejected)setStatus("Unsupported file type. Please choose "+(currentTool==="from-images"?"JPG or PNG images.":"PDF files."),"error");else if(!added&&list.length)setStatus("Those files are already selected.");
}
input.addEventListener("change",e=>{addFiles(e.target.files);input.value="";});
["dragenter","dragover"].forEach(n=>dropZone.addEventListener(n,e=>{e.preventDefault();dropZone.classList.add("dragging");}));
["dragleave","drop"].forEach(n=>dropZone.addEventListener(n,e=>{e.preventDefault();dropZone.classList.remove("dragging");}));
dropZone.addEventListener("drop",e=>addFiles(e.dataTransfer.files));
tabs.forEach(t=>t.addEventListener("click",()=>setTool(t.dataset.tool)));
const shortDesc={merge:"Combine several PDFs into one",split:"Extract pages into a new PDF",rotate:"Turn pages 90°, 180° or 270°",compress:"Make your PDF file smaller","to-images":"Save each page as a PNG image","from-images":"Turn JPG and PNG into a PDF","page-numbers":"Add numbers to every page",watermark:"Stamp your own text on pages","delete-pages":"Remove pages you don't need",reorder:"Arrange pages in a new order","to-text":"Extract text into a TXT file"};
const toolIcons={"merge":"＋","split":"✂","rotate":"↻","compress":"⇩","to-images":"▧","from-images":"▣","page-numbers":"№","watermark":"◆","delete-pages":"✕","reorder":"↕","to-text":"T"};
const toolGrid=document.getElementById("tool-grid");
tabs.forEach(t=>{const k=t.dataset.tool;const b=document.createElement("button");b.type="button";b.className="tool-link";b.dataset.tool=k;
 const i=document.createElement("span");i.className="tool-link-icon";i.textContent=toolIcons[k];
 const n=document.createElement("strong");n.textContent=t.textContent;
 const d=document.createElement("span");d.className="muted";d.textContent=shortDesc[k];
 b.append(i,n,d);b.addEventListener("click",()=>{setTool(k);document.getElementById("tool-card").scrollIntoView({behavior:"smooth",block:"start"});});toolGrid.append(b);});
clearButton.addEventListener("click",()=>{selectedFiles.length=0;renderFiles();});
async function readPdf(file){return PDFLib.PDFDocument.load(await file.arrayBuffer());}
async function saveDownload(bytes,name,type="application/pdf"){const blob=new Blob([bytes],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function parseRanges(value,total){
 const found=new Set();for(const raw of value.split(",")){const p=raw.trim();if(!p)continue;const m=p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw Error("Enter page ranges like 1-3, 5, 8-10.");
 const first=Number(m[1]),last=Number(m[2]||m[1]);if(first<1||last<first||last>total)throw Error("Page numbers must be between 1 and "+total+".");for(let n=first;n<=last;n++)found.add(n-1);}
 if(!found.size)throw Error("Enter at least one page number.");return [...found].sort((a,b)=>a-b);
}
async function mergePdfs(){const out=await PDFLib.PDFDocument.create();for(let i=0;i<selectedFiles.length;i++){setStatus("Adding PDF "+(i+1)+" of "+selectedFiles.length+"…");const src=await readPdf(selectedFiles[i]);(await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p));}await saveDownload(await out.save(),"pdf-master-merged.pdf");}
async function splitPdf(){const src=await readPdf(selectedFiles[0]);const indexes=parseRanges(document.getElementById("page-ranges").value,src.getPageCount());const out=await PDFLib.PDFDocument.create();(await out.copyPages(src,indexes)).forEach(p=>out.addPage(p));await saveDownload(await out.save(),"pdf-master-split.pdf");}
async function rotatePdf(){const pdf=await readPdf(selectedFiles[0]);const deg=Number(document.getElementById("rotation-angle").value);pdf.getPages().forEach(p=>p.setRotation(PDFLib.degrees((p.getRotation().angle+deg)%360)));await saveDownload(await pdf.save(),"pdf-master-rotated.pdf");}
async function renderPageMain(pdfjs,n,settings){
 const page=await pdfjs.getPage(n);let canvas=null;
 try{
  const viewport=page.getViewport({scale:settings.scale});
  canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw Error("Could not create an image canvas for page "+n+".");
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:ctx,viewport,background:"rgb(255,255,255)"}).promise;
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",settings.quality));
  if(!blob)throw Error("Could not compress page "+n+".");
  return {n,blob,width:viewport.width/settings.scale,height:viewport.height/settings.scale};
 }finally{if(canvas){canvas.width=1;canvas.height=1;}page.cleanup();}
}
const PDFJS_SRC="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",PDFJS_WORKER_SRC="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const compressWorkerSource=`
let pdf=null;
class OffFactory{create(w,h){const c=new OffscreenCanvas(Math.max(1,w),Math.max(1,h));return{canvas:c,context:c.getContext("2d")};}reset(cc,w,h){cc.canvas.width=w;cc.canvas.height=h;}destroy(cc){cc.canvas.width=0;cc.canvas.height=0;cc.canvas=null;cc.context=null;}}
self.onmessage=async e=>{const m=e.data;
 try{
  if(m.type==="init"){
   importScripts(m.pdfSrc);const lib=self.pdfjsLib;lib.GlobalWorkerOptions.workerSrc=m.workerSrc;
   const ownerDocument={fonts:self.fonts,createElement:n=>n==="canvas"?new OffscreenCanvas(1,1):null,documentElement:{getElementsByTagName:()=>[]}};
   pdf=await lib.getDocument({data:m.data,canvasFactory:new OffFactory(),ownerDocument}).promise;
   postMessage({type:"ready"});
  }else if(m.type==="page"){
   const page=await pdf.getPage(m.n);const vp=page.getViewport({scale:m.scale});
   const canvas=new OffscreenCanvas(Math.ceil(vp.width),Math.ceil(vp.height));const ctx=canvas.getContext("2d",{alpha:false});
   ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
   await page.render({canvasContext:ctx,viewport:vp,background:"rgb(255,255,255)"}).promise;
   const blob=await canvas.convertToBlob({type:"image/jpeg",quality:m.quality});const buf=await blob.arrayBuffer();page.cleanup();
   postMessage({type:"done",n:m.n,buf,width:vp.width/m.scale,height:vp.height/m.scale},[buf]);
  }
 }catch(err){postMessage({type:"error",n:m.n,message:String(err&&err.message||err)});}
};`;
function callWorker(w,msg,ms){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{w.pending=null;reject(Error("Worker timed out."));},ms);
  w.pending={resolve:d=>{clearTimeout(timer);resolve(d);},reject:e=>{clearTimeout(timer);reject(e);}};
  w.postMessage(msg);
 });
}
async function thumbData(blob){
 const bmp=await createImageBitmap(blob);const c=document.createElement("canvas");c.width=c.height=48;
 const x=c.getContext("2d",{willReadFrequently:true});x.fillStyle="#fff";x.fillRect(0,0,48,48);x.drawImage(bmp,0,0,48,48);if(bmp.close)bmp.close();
 return x.getImageData(0,0,48,48).data;
}
async function compressParallel(pdfjs,original,settings,total){
 const cores=Math.min(3,(navigator.hardwareConcurrency||2)-1);
 if(total<3||cores<2||typeof Worker==="undefined"||typeof OffscreenCanvas==="undefined"||typeof createImageBitmap==="undefined")return null;
 const count=Math.min(cores,total-1),workers=[];let url="";
 try{
  setStatus("Preparing faster compression…");
  url=URL.createObjectURL(new Blob([compressWorkerSource],{type:"text/javascript"}));
  const data=await original.arrayBuffer();
  for(let i=0;i<count;i++){
   const w=new Worker(url);w.pending=null;
   w.onmessage=e=>{const p=w.pending;w.pending=null;if(!p)return;e.data.type==="error"?p.reject(Error(e.data.message)):p.resolve(e.data);};
   w.onerror=e=>{const p=w.pending;w.pending=null;if(p)p.reject(Error(e.message||"Worker failed."));};
   workers.push(w);
  }
  await Promise.all(workers.map(w=>callWorker(w,{type:"init",pdfSrc:PDFJS_SRC,workerSrc:PDFJS_WORKER_SRC,data:data.slice(0)},30000)));
  // Safety check: page 1 rendered both ways must look the same, otherwise use the normal method.
  const first=await renderPageMain(pdfjs,1,settings);
  const probe=await callWorker(workers[0],{type:"page",n:1,scale:settings.scale,quality:settings.quality},60000);
  if(Math.abs(probe.width-first.width)>1||Math.abs(probe.height-first.height)>1)return null;
  const [t1,t2]=await Promise.all([thumbData(first.blob),thumbData(new Blob([probe.buf],{type:"image/jpeg"}))]);
  let diff=0;for(let i=0;i<t1.length;i++)diff+=Math.abs(t1[i]-t2[i]);
  if(diff/t1.length>10)return null;
  const results=new Array(total);results[0]=first;let next=2,done=1;
  setStatus("Compressing pages 1 of "+total+"…");
  await Promise.all(workers.map(async w=>{
   while(next<=total){
    const n=next++;
    const r=await callWorker(w,{type:"page",n,scale:settings.scale,quality:settings.quality},120000);
    results[n-1]={n,blob:new Blob([r.buf],{type:"image/jpeg"}),width:r.width,height:r.height};
    done++;setStatus("Compressing pages "+done+" of "+total+"…");
   }
  }));
  return results;
 }catch(err){
  console.warn("Fast compression unavailable, using standard method.",err);return null;
 }finally{
  workers.forEach(w=>w.terminate());if(url)URL.revokeObjectURL(url);
 }
}
async function optimizePdf(){
 if(!window.pdfjsLib)throw Error("The PDF rendering library did not load. Refresh the page and try again.");
 const original=selectedFiles[0];
 const level=document.getElementById("compression-level").value;
 const settings={small:{scale:1,quality:0.55},balanced:{scale:1.25,quality:0.70},clear:{scale:1.5,quality:0.82}}[level]||{scale:1.25,quality:0.70};
 const pdfjs=await pdfjsLib.getDocument({data:new Uint8Array(await original.arrayBuffer())}).promise;
 const out=await PDFLib.PDFDocument.create();
 const total=pdfjs.numPages;
 let rendered=await compressParallel(pdfjs,original,settings,total);
 if(!rendered){
  rendered=[];const batchSize=3;
  for(let first=1;first<=total;first+=batchSize){
   const last=Math.min(first+batchSize-1,total);
   setStatus("Compressing pages "+first+"–"+last+" of "+total+"…");
   const batch=await Promise.all(Array.from({length:last-first+1},(_,i)=>renderPageMain(pdfjs,first+i,settings)));
   rendered.push(...batch);
  }
 }
 setStatus("Building compressed PDF…");
 for(const item of rendered){
  const image=await out.embedJpg(await item.blob.arrayBuffer());
  const newPage=out.addPage([item.width,item.height]);
  newPage.drawImage(image,{x:0,y:0,width:item.width,height:item.height});
 }
 const compressed=await out.save({useObjectStreams:true});
 if(compressed.byteLength>=original.size){
  await saveDownload(await original.arrayBuffer(),original.name);
  return "Compression did not make the PDF smaller. Your original file ("+sizeText(original.size)+") was downloaded unchanged.";
 }
 const saved=original.size-compressed.byteLength;
 const percent=((saved/original.size)*100).toFixed(1);
 await saveDownload(compressed,"pdf-master-compressed.pdf");
 return "Compression complete: "+sizeText(original.size)+" reduced to "+sizeText(compressed.byteLength)+" (saved "+sizeText(saved)+", "+percent+"%). Pages are image-based, so text is not selectable or searchable.";
}
async function pdfToImages(){
 if(!window.pdfjsLib||!window.JSZip)throw Error("A conversion library did not load. Check your internet connection and refresh.");
 const doc=await pdfjsLib.getDocument({data:new Uint8Array(await selectedFiles[0].arrayBuffer())}).promise;const zip=new JSZip();const scale=Number(document.getElementById("image-scale").value);
 for(let n=1;n<=doc.numPages;n++){setStatus("Rendering page "+n+" of "+doc.numPages+"…");const page=await doc.getPage(n);const viewport=page.getViewport({scale});const canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw Error("Could not render page "+n);zip.file("page-"+String(n).padStart(3,"0")+".png",blob);canvas.width=canvas.height=1;}
 await saveDownload(await zip.generateAsync({type:"uint8array"}),"pdf-master-images.zip","application/zip");
}
async function imagesToPdf(){const out=await PDFLib.PDFDocument.create();for(let i=0;i<selectedFiles.length;i++){setStatus("Adding image "+(i+1)+" of "+selectedFiles.length+"…");const f=selectedFiles[i],buf=await f.arrayBuffer();const img=(f.type==="image/png"||/\.png$/i.test(f.name))?await out.embedPng(buf):await out.embedJpg(buf);const page=out.addPage([img.width,img.height]);page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});}await saveDownload(await out.save(),"pdf-master-from-images.pdf");}

async function addPageNumbers(){
 const pdf=await readPdf(selectedFiles[0]);const start=Number(document.getElementById("number-start").value);
 if(!Number.isInteger(start)||start<1)throw Error("Starting number must be a positive whole number.");
 const font=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
 pdf.getPages().forEach((page,index)=>{const text=String(start+index),size=11,w=font.widthOfTextAtSize(text,size);page.drawText(text,{x:(page.getWidth()-w)/2,y:18,size,font,color:PDFLib.rgb(0.25,0.25,0.25)});});
 await saveDownload(await pdf.save(),"pdf-master-numbered.pdf");
}
async function addWatermark(){
 const text=document.getElementById("watermark-text").value.trim();if(!text)throw Error("Enter the watermark text first.");
 const opacity=Number(document.getElementById("watermark-opacity").value);
 const pdf=await readPdf(selectedFiles[0]);const font=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
 pdf.getPages().forEach(page=>{const size=Math.min(48,Math.max(24,page.getWidth()/12));const width=font.widthOfTextAtSize(text,size);page.drawText(text,{x:(page.getWidth()-width)/2,y:page.getHeight()/2,size,font,color:PDFLib.rgb(0.45,0.45,0.45),opacity,rotate:PDFLib.degrees(45)});});
 await saveDownload(await pdf.save(),"pdf-master-watermarked.pdf");
}
async function deletePdfPages(){
 const pdf=await readPdf(selectedFiles[0]);const indexes=parseRanges(document.getElementById("delete-ranges").value,pdf.getPageCount());
 if(indexes.length>=pdf.getPageCount())throw Error("You cannot delete every page. Keep at least one page.");
 indexes.sort((a,b)=>b-a).forEach(i=>pdf.removePage(i));
 await saveDownload(await pdf.save(),"pdf-master-pages-deleted.pdf");
}
async function reorderPdfPages(){
 const src=await readPdf(selectedFiles[0]);const total=src.getPageCount();
 const raw=document.getElementById("page-order").value.trim();if(!raw)throw Error("Enter the new page order.");
 const order=raw.split(",").map(v=>Number(v.trim()));
 if(order.some(n=>!Number.isInteger(n)||n<1||n>total)||order.length!==total||new Set(order).size!==total)
  throw Error("Enter every page number from 1 to "+total+" exactly once, separated by commas.");
 const out=await PDFLib.PDFDocument.create();const copied=await out.copyPages(src,order.map(n=>n-1));copied.forEach(p=>out.addPage(p));
 await saveDownload(await out.save(),"pdf-master-reordered.pdf");
}
async function pdfToText(){
 if(!window.pdfjsLib)throw Error("The PDF text library did not load. Refresh and try again.");
 const doc=await pdfjsLib.getDocument({data:new Uint8Array(await selectedFiles[0].arrayBuffer())}).promise;
 const pages=[];
 for(let n=1;n<=doc.numPages;n++){setStatus("Extracting text from page "+n+" of "+doc.numPages+"…");const page=await doc.getPage(n);const content=await page.getTextContent();const line=content.items.map(item=>item.str||"").join(" ");pages.push("----- Page "+n+" -----\n"+line);page.cleanup();}
 const text=pages.join("\n\n");if(!text.replace(/[-\s]/g,""))throw Error("No selectable text was found. This may be a scanned PDF that needs OCR.");
 await saveDownload(text,"pdf-master-extracted-text.txt","text/plain;charset=utf-8");
}

runButton.addEventListener("click",async()=>{
 if(!window.PDFLib){setStatus("PDF library failed to load. Check internet and refresh.","error");return;}if(!selectedFiles.length)return;
 runButton.disabled=true;clearButton.disabled=true;setStatus("Processing your files…");
 try{
  let completionMessage="";
  if(currentTool==="merge")await mergePdfs();
  else if(currentTool==="split")await splitPdf();
  else if(currentTool==="rotate")await rotatePdf();
  else if(currentTool==="compress")completionMessage=await optimizePdf();
  else if(currentTool==="to-images")await pdfToImages();
  else if(currentTool==="page-numbers")await addPageNumbers();
  else if(currentTool==="watermark")await addWatermark();
  else if(currentTool==="delete-pages")await deletePdfPages();
  else if(currentTool==="reorder")await reorderPdfPages();
  else if(currentTool==="to-text")await pdfToText();
  else await imagesToPdf();
  setStatus(completionMessage||"Done! Your file has been prepared and downloaded.","success");
 }
 catch(err){console.error(err);setStatus(err.message||"Could not process this file. It may be damaged, encrypted or unsupported.","error");}
 finally{const enough=(currentTool==="merge"||currentTool==="from-images")?selectedFiles.length>=2:selectedFiles.length===1;runButton.disabled=!enough;clearButton.disabled=!selectedFiles.length;}
});
setTool("merge");