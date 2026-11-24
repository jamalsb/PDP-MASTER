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
 compress:{title:"Compress PDF",desc:"Try lossless PDF structure optimization and keep the original if the result is not smaller.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Optimize PDF"},
 "to-images":{title:"PDF to Images",desc:"Convert each PDF page into a PNG image and download them in a ZIP file.",hint:"Select one PDF file",accept:"application/pdf,.pdf",multiple:false,button:"Convert to Images"},
 "from-images":{title:"Images to PDF",desc:"Combine JPG and PNG images into one PDF document.",hint:"Select one or more images",accept:"image/png,image/jpeg,.png,.jpg,.jpeg",multiple:true,button:"Create PDF"}
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
 if(currentTool==="compress"){const p=document.createElement("p");p.className="muted";p.textContent="This performs lossless PDF structure optimization. It does not downsample or recompress embedded images, so image-heavy PDFs may not get smaller. If the result is not smaller, the original file is downloaded instead.";area.append(p);}
}
function setTool(tool){
 currentTool=tool;const c=config[tool];selectedFiles.length=0;input.value="";
 tabs.forEach(t=>t.classList.toggle("active",t.dataset.tool===tool));
 document.getElementById("tool-title").textContent=c.title;document.getElementById("tool-description").textContent=c.desc;
 document.getElementById("tool-number").textContent="PDF TOOL "+String(tabs.findIndex(t=>t.dataset.tool===tool)+1).padStart(2,"0");
 document.getElementById("upload-title").textContent=c.multiple?"Choose files":"Choose a file";document.getElementById("file-hint").textContent=c.hint;
 document.getElementById("tool-icon").textContent=({"merge":"＋","split":"✂","rotate":"↻","compress":"⇩","to-images":"▧","from-images":"▣"})[tool];
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
async function optimizePdf(){
 const original=selectedFiles[0];
 const src=await readPdf(original);
 const out=await PDFLib.PDFDocument.create();
 (await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p));
 const optimized=await out.save({useObjectStreams:true});
 if(optimized.byteLength>=original.size){
  await saveDownload(await original.arrayBuffer(),original.name);
  return "No smaller result was found. Your original PDF ("+sizeText(original.size)+") was downloaded unchanged.";
 }
 const saved=original.size-optimized.byteLength;
 const percent=((saved/original.size)*100).toFixed(1);
 await saveDownload(optimized,"pdf-master-optimized.pdf");
 return "Optimization complete. File reduced from "+sizeText(original.size)+" to "+sizeText(optimized.byteLength)+" (saved "+sizeText(saved)+", "+percent+"%).";
}
async function pdfToImages(){
 if(!window.pdfjsLib||!window.JSZip)throw Error("A conversion library did not load. Check your internet connection and refresh.");
 const doc=await pdfjsLib.getDocument({data:new Uint8Array(await selectedFiles[0].arrayBuffer())}).promise;const zip=new JSZip();const scale=Number(document.getElementById("image-scale").value);
 for(let n=1;n<=doc.numPages;n++){setStatus("Rendering page "+n+" of "+doc.numPages+"…");const page=await doc.getPage(n);const viewport=page.getViewport({scale});const canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw Error("Could not render page "+n);zip.file("page-"+String(n).padStart(3,"0")+".png",blob);canvas.width=canvas.height=1;}
 await saveDownload(await zip.generateAsync({type:"uint8array"}),"pdf-master-images.zip","application/zip");
}
async function imagesToPdf(){const out=await PDFLib.PDFDocument.create();for(let i=0;i<selectedFiles.length;i++){setStatus("Adding image "+(i+1)+" of "+selectedFiles.length+"…");const f=selectedFiles[i],buf=await f.arrayBuffer();const img=(f.type==="image/png"||/\.png$/i.test(f.name))?await out.embedPng(buf):await out.embedJpg(buf);const page=out.addPage([img.width,img.height]);page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});}await saveDownload(await out.save(),"pdf-master-from-images.pdf");}
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
  else await imagesToPdf();
  setStatus(completionMessage||"Done! Your file has been prepared and downloaded.","success");
 }
 catch(err){console.error(err);setStatus(err.message||"Could not process this file. It may be damaged, encrypted or unsupported.","error");}
 finally{const enough=(currentTool==="merge"||currentTool==="from-images")?selectedFiles.length>=2:selectedFiles.length===1;runButton.disabled=!enough;clearButton.disabled=!selectedFiles.length;}
});
setTool("merge");