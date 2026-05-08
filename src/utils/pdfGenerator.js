/* ================================================================
   Signum PDF Generator v4.0
   ─ White background / template-aware
   ─ Multiple technicians signatures
   ─ Custom fields in all sections
   ─ QR Code embedded (top-right corner)
   ─ Photos: 3-per-row, cyan border, caption + status
   ─ High-res template (scale 3.0)
   ─ Configurable user margins
   ================================================================ */

async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) {
    await new Promise(r => setTimeout(r, 200)); return
  }
  return new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src; s.onload = res; s.onerror = rej
    document.head.appendChild(s)
  })
}

async function pdfTemplateToImage(dataUrl) {
  try {
    if (!window.pdfjsLib) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    }
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0))
    const pdf   = await window.pdfjsLib.getDocument({ data: bytes }).promise
    const page  = await pdf.getPage(1)
    const vp    = page.getViewport({ scale: 3.0 })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width; canvas.height = vp.height
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
    await page.render({ canvasContext: ctx, viewport: vp }).promise
    return canvas.toDataURL('image/png')
  } catch(err) { console.warn('[Signum] PDF template failed:', err); return null }
}

async function docTemplateToImage(dataUrl) {
  try {
    if (!window.mammoth) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js')
    if (!window.html2canvas) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
    const base64=dataUrl.split(',')[1], binStr=atob(base64)
    const bytes=new Uint8Array(binStr.length)
    for(let i=0;i<binStr.length;i++) bytes[i]=binStr.charCodeAt(i)
    const result = await window.mammoth.convertToHtml({ arrayBuffer: bytes.buffer })
    const iframe = document.createElement('iframe')
    Object.assign(iframe.style,{position:'fixed',top:'-9999px',left:'-9999px',width:'794px',height:'1123px',border:'none',visibility:'hidden'})
    document.body.appendChild(iframe)
    await new Promise(res=>{iframe.onload=res;iframe.srcdoc=`<html><head><style>body{margin:0;padding:28px 36px;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;color:#111;background:#fff;width:722px;box-sizing:border-box;}img{max-width:100%;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:4px 8px;}</style></head><body>${result.value}</body></html>`})
    const canvas = await window.html2canvas(iframe.contentDocument.body,{scale:3,useCORS:true,width:794,height:1123,windowWidth:794,windowHeight:1123})
    document.body.removeChild(iframe)
    return canvas.toDataURL('image/png')
  } catch(err) { console.warn('[Signum] DOC template failed:', err); return null }
}

async function resolveTemplateBg(pdfTemplate) {
  if (!pdfTemplate) return null
  switch(pdfTemplate.type) {
    case 'pdf': return await pdfTemplateToImage(pdfTemplate.dataUrl)
    case 'doc': return await docTemplateToImage(pdfTemplate.dataUrl)
    default:    return pdfTemplate.dataUrl
  }
}

const STATUS_LABELS = {
  operacional:'Operacional', manutencao:'Em Manutenção', defeito:'Com Defeito',
  substituido:'Substituído', instalado:'Instalado', configurado:'Configurado', testado:'Testado',
}

// ── TXT Report ───────────────────────────────────────────────────────────────
export async function buildReportText(state) {
  const today = new Date().toLocaleDateString('pt-BR')
  const date  = state.serviceDate ? new Date(state.serviceDate+'T12:00:00').toLocaleDateString('pt-BR') : today
  const sep   = '='.repeat(50)
  let c = ''
  c += `=== RELATÓRIO DE MANUTENÇÃO PREVENTIVA ===\n\n`
  c += `Empresa: ${state.companyName||'—'}\n`
  c += `Data do Atendimento: ${date}\n`
  c += `Gerado em: ${today}\n`
  ;(state.technicians||[]).forEach((t,i)=>{ c+=`Técnico ${i+1}: ${t.name||'—'}\n` })
  c += `Responsável: ${state.clientName||'—'}\n\n`
  c += sep+'\n\n'
  c += `🔹 RESUMO\n   Este documento serve para realizar uma avaliação completa do ambiente\n   de TI, incluindo análise de máquinas, infraestrutura e procedimentos\n   de manutenção preventiva, garantindo o bom funcionamento dos sistemas.\n\n`

  const orderToUse = state.pdfOrder === 'custom' && (state.customSections||[]).length > 0
    ? state.sectionOrder
    : [
        'arrival',
        ...state.machines.map(m=>m.id),
        ...state.infrastructures.map(i=>i.id),
        'training',
        'observations',
        'closure',
        ...(state.customSections||[]).map(s=>s.id),
        'signatures'
      ]

  for (const id of orderToUse) {
    if (id === 'arrival') {
      const arrivalCFs = (state.customFields||[]).filter(f=>f.section==='arrival')
      if(arrivalCFs.length) {
        c+=`🔹 INFORMAÇÕES ADICIONAIS (CHEGADA)\n`
        arrivalCFs.filter(f=>f.showInPdf!==false).forEach(f=>{ const v=(state.customFieldValues||{})[f.id]; if(v!==undefined&&v!==''&&v!==false) c+=`   ${f.label}: ${v}\n` })
        c+='\n'
      }
    }
    else if (id.startsWith('m-')) {
      const m = state.machines.find(x => x.id === id)
      if (m) {
        const mi = state.machines.indexOf(m)
        if (mi === 0) c+=`🔹 MÁQUINAS VERIFICADAS\n\n`
        c+=`📋 MÁQUINA ${m.number||mi+1}\n`
        if(m.name)    c+=`   Nome: ${m.name}\n`
        if(m.os)      c+=`   Sistema Operacional: ${m.os}\n`
        if(m.storage) c+=`   Armazenamento: ${m.storage}\n`
        if(m.ram)     c+=`   Memória RAM: ${m.ram}\n`
        if(m.anydesk) c+=`   AnyDesk ID: ${m.anydesk}\n`
        if(m.windowsActivated!==null) c+=`   Windows Ativado: ${m.windowsActivated?'Sim':'Não'}\n`
        const procs=[]
        if(m.checkUpdates)  procs.push('Verificar Windows Update')
        if(m.checkPrograms) procs.push('Verificar programas instalados')
        if(m.installMilvus) procs.push('Instalar Milvus')
        if(m.updateBrowsers)procs.push('Atualizar Navegadores')
        if(m.installOffice) procs.push('Verificar/Instalar Pacote Office')
        if(m.installAdobe)  procs.push('Instalar Adobe Reader')
        if(m.installWinrar) procs.push('Instalar WinRAR')
        if(m.runAida)       procs.push('Executar AIDA')
        if(procs.length){ c+=`   Processos Realizados:\n`; procs.forEach(p=>{c+=`      ✅ ${p}\n`}) }
        if(m.observations) c+=`   Observações: ${m.observations}\n`
        ;(state.customFields||[]).filter(f=>f.section==='machine'&&f.showInPdf!==false).forEach(f=>{
          const v=(m.customFieldValues||{})[f.id]; if(v!==undefined&&v!==''&&v!==false) c+=`   ${f.label}: ${v}\n`
        })
        c+='\n'
      }
    }
    else if (id.startsWith('i-')) {
      const inf = state.infrastructures.find(x => x.id === id)
      if (inf) {
        const ii = state.infrastructures.indexOf(inf)
        if (ii === 0) c+=`🔹 INFRAESTRUTURA VERIFICADA\n\n`
        c+=`🏗️ ITEM ${inf.number||ii+1}\n`
        if(inf.description) c+=`   Descrição: ${inf.description}\n`
        if(inf.location)    c+=`   Localização: ${inf.location}\n`
        if(inf.observations)c+=`   Observações: ${inf.observations}\n`
        ;(state.customFields||[]).filter(f=>f.section==='infra'&&f.showInPdf!==false).forEach(f=>{
          const v=(inf.customFieldValues||{})[f.id]; if(v!==undefined&&v!==''&&v!==false) c+=`   ${f.label}: ${v}\n`
        })
        c+='\n'
      }
    }
    else if (id === 'training') {
      c+=`🔹 TREINAMENTO REALIZADO\n`
      c+=`   ${state.trainHelpdesk?'✅':'⬜'} Demonstrar como abrir chamado via Client Core Helpdesk\n`
      c+=`   ${state.trainMaintenance?'✅':'⬜'} Explicar procedimentos básicos de manutenção\n`
      c+=`   ${state.trainUpdates?'✅':'⬜'} Orientar sobre: Sempre manter o sistema atualizado\n\n`
    }
    else if (id === 'observations') {
      c+=`🔹 OBSERVAÇÕES TÉCNICAS\n`
      c+= state.observations ? `${state.observations}\n\n` : `   Nenhuma observação registrada.\n\n`
    }
    else if (id === 'closure') {
      c+=`🔹 ENCERRAMENTO DO ATENDIMENTO\n`
      const closureItems=[[state.writeReport,'Relatório escrito no Milvus'],[state.collectClientSig,'Assinatura do responsável coletada'],[state.collectTechSig,'Assinatura do técnico coletada'],[state.closeCall,'Chamado encerrado na frente do responsável'],[state.checkSatisfaction,'Satisfação do cliente verificada']]
      const doneClosure=closureItems.filter(([v])=>v)
      if(!doneClosure.length) c+=`   ⚠️ Nenhum procedimento de encerramento registrado\n\n`
      else { doneClosure.forEach(([,l])=>{c+=`   ✅ ${l}\n`}); c+='\n' }
    }
    else if (id.startsWith('cs-')) {
      const sec = (state.customSections||[]).find(s => s.id === id)
      if (sec && sec.showInPdf !== false) {
        const secFields = (sec.fields||[]).filter(f => f.showInPdf !== false)
        if (secFields.length) {
          c += `🔹 ${(sec.title||'SEÇÃO').toUpperCase()}\n`
          secFields.forEach(f => {
            const v = (sec.values||{})[f.id]
            if (v !== undefined && v !== '' && v !== false)
              c += `   ${f.label}: ${f.type==='checkbox'?(v?'Sim':'Não'):v}\n`
          })
          c += '\n'
        }
      }
    }
    else if (id === 'signatures') {
      c+=`🔹 ASSINATURAS\n`
      c+=`   Responsável: ${state.clientName||'—'}\n`
      ;(state.technicians||[]).forEach((t,i)=>{ c+=`   Técnico ${i+1}: ${t.name||'—'}\n` })
    }
  }

  c+='\n'+sep+'\nRelatório gerado automaticamente pelo Signum\n'
  return c
}

// ── Photo grid (3-per-row, cyan border) ──────────────────────────────────────
function drawPhotoGrid(doc, photos, x0, contentW, yStart, needFn, colors) {
  const {CYAN, BLACK, GRAY_MID} = colors
  const COLS=3, GAP=4, BORDER=0.6, CAP_H=9
  const imgW=(contentW - GAP*(COLS-1)) / COLS
  const imgH=imgW*0.72
  let y=yStart

  for(let i=0; i<photos.length; i+=COLS) {
    const row=photos.slice(i,i+COLS)
    needFn(imgH+CAP_H+GAP+2)
    row.forEach((ph, col)=>{
      const x=x0+col*(imgW+GAP)
      doc.setDrawColor(...CYAN); doc.setLineWidth(BORDER)
      doc.rect(x,y,imgW,imgH,'S')
      const ins=BORDER+0.3
      if(ph.dataUrl) {
        try { const ext=ph.dataUrl.startsWith('data:image/png')?'PNG':'JPEG'; doc.addImage(ph.dataUrl,ext,x+ins,y+ins,imgW-ins*2,imgH-ins*2) } catch {}
      } else { doc.setFillColor(240,240,240); doc.rect(x+ins,y+ins,imgW-ins*2,imgH-ins*2,'F') }
      const capY=y+imgH+3.5
      if(ph.caption) { doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(...BLACK); doc.text(doc.splitTextToSize(ph.caption,imgW-1)[0],x+0.5,capY) }
      if(ph.status)  { doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY_MID); doc.text(`Status: ${STATUS_LABELS[ph.status]||ph.status}`,x+0.5,capY+3.8) }
    })
    y+=imgH+CAP_H+GAP
  }
  return y
}

function hexToRgb(hex) {
  if (!hex) return [0, 180, 220]
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

async function colorizeSignature(dataUrl, color) {
  if (!dataUrl || !color) return dataUrl
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0)
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// ── Main PDF export ───────────────────────────────────────────────────────────
export async function exportPDF(state, qrDataUrl=null, primaryColor='#00d4ff') {
  const { jsPDF } = window.jspdf
  const company  = state.companyName||'Empresa'
  const dateStr  = new Date().toISOString().split('T')[0]
  const fileName = `Signum (${company}) - ${dateStr}.pdf`

  const mg=state.pdfMargins||{top:18,bottom:18,left:18,right:18}
  const MT=Math.max(mg.top,8), MB=Math.max(mg.bottom,8)
  const ML=Math.max(mg.left,8), MR=Math.max(mg.right,8)

  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'})
  const PW=doc.internal.pageSize.getWidth(), PH=doc.internal.pageSize.getHeight()
  const CW=PW-ML-MR
  let y=MT

  const bgDataUrl = await resolveTemplateBg(state.pdfTemplate)

  const drawBg=()=>{
    if(bgDataUrl) { try { const ext=bgDataUrl.startsWith('data:image/png')?'PNG':'JPEG'; doc.addImage(bgDataUrl,ext,0,0,PW,PH,undefined,'FAST') } catch {} }
    else { doc.setFillColor(255,255,255); doc.rect(0,0,PW,PH,'F') }
  }

  const newPage=()=>{ doc.addPage(); drawBg(); y=MT }
  const need=(h=10)=>{ if(y+h>PH-MB) newPage() }
  drawBg()

  // Colors
  const BLACK=[20,20,20], DARK=[40,40,40], GRAY=[80,80,80], GRAY_MID=[120,120,120]
  const CYAN = hexToRgb(primaryColor)
  const CYAN_TXT = CYAN.map(v => Math.max(0, v - 40)) // Slightly darker for text

  // ── QR Code top-right ──────────────────────────────────────────
  if(qrDataUrl) {
    try {
      const qrSize=22
      doc.addImage(qrDataUrl,'PNG',PW-MR-qrSize,MT,qrSize,qrSize)
      doc.setTextColor(...GRAY_MID); doc.setFontSize(5.5); doc.setFont('helvetica','normal')
      doc.text('Signum',PW-MR-qrSize+(qrSize/2),MT+qrSize+3,{align:'center'})
    } catch {}
  }

  // ── Title ──────────────────────────────────────────────────────
  need(20)
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...BLACK)
  const titleMaxW = qrDataUrl ? CW-28 : CW
  doc.text(`Relatório de Checklist - ${company}`, ML, y+6, {maxWidth:titleMaxW})
  y+=10
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...DARK)
  const svcDate = state.serviceDate ? new Date(state.serviceDate+'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
  doc.text(`Data do atendimento: ${svcDate}`, ML, y+4); y+=9
  ;(state.technicians||[]).forEach((t,i)=>{
    doc.text(`Técnico ${i+1}: ${t.name||'—'}`, ML, y+4); y+=5.5
  })
  y+=5

  // ── RESUMO ──────────────────────────────────────────────────────
  need(28)
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
  doc.text('RESUMO:', ML, y); y+=6
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
  const resumo='Este documento serve para realizar uma avaliação completa do ambiente de TI, incluindo análise de máquinas, infraestrutura e procedimentos de manutenção preventiva, garantindo o bom funcionamento dos sistemas.'
  const resumoLines=doc.splitTextToSize(resumo,CW-8)
  resumoLines.forEach(l=>{need(5);doc.text(l,ML+4,y);y+=5}); y+=5

  // ── Helper: render custom fields inline ──────────────────────────
  // Evaluate if a field is visible based on conditions (inline to avoid circular imports)
  const evalFieldVisible = (field, vals) => {
    const conds = field.conditions || []
    if (!conds.length) return true
    const mode  = field.conditionMode  || 'show'
    const logic = field.conditionLogic || 'and'
    const results = conds.map(cond => {
      const actual   = vals[cond.fieldId]
      const expected = cond.value
      switch (cond.operator) {
        case 'filled':       return actual !== undefined && actual !== null && actual !== '' && actual !== false
        case 'empty':        return actual === undefined || actual === null || actual === '' || actual === false
        case 'eq':           return String(actual??'') === String(expected??'')
        case 'neq':          return String(actual??'') !== String(expected??'')
        case 'contains':     return String(actual??'').toLowerCase().includes(String(expected??'').toLowerCase())
        case 'not_contains': return !String(actual??'').toLowerCase().includes(String(expected??'').toLowerCase())
        case 'gt':           return parseFloat(actual) > parseFloat(expected)
        case 'lt':           return parseFloat(actual) < parseFloat(expected)
        default: return true
      }
    })
    const allPass = logic === 'and' ? results.every(Boolean) : results.some(Boolean)
    return mode === 'show' ? allPass : !allPass
  }

  const renderCFs = (section, values) => {
    const cfs=(state.customFields||[]).filter(f=>f.section===section && (f.showInPdf!==false) && evalFieldVisible(f, values))
    cfs.forEach(f=>{
      const v=(values||{})[f.id]
      if(v===undefined||v===null||v===''||v===false) return
      need(6)
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
      const label=f.type==='checkbox'?(v?'✅ '+f.label:'⬜ '+f.label):`${f.label}: ${v}`
      const ls=doc.splitTextToSize(label,CW-12)
      ls.forEach(l=>{need(5);doc.text(l,ML+8,y);y+=4.8})
    })
  }

  const orderToUse = state.pdfOrder === 'custom' && (state.customSections||[]).length > 0
    ? state.sectionOrder
    : [
        'arrival',
        ...state.machines.map(m=>m.id),
        ...state.infrastructures.map(i=>i.id),
        'training',
        'observations',
        'closure',
        ...(state.customSections||[]).map(s=>s.id),
        'signatures'
      ]

  for (const id of orderToUse) {
    if (id === 'arrival') {
      const arrCFs=(state.customFields||[]).filter(f=>f.section==='arrival')
      if(arrCFs.length) {
        need(12); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
        doc.text('AO CHEGAR NO CLIENTE:', ML, y); y+=7
        renderCFs('arrival', state.customFieldValues)
        y+=3
      }
    }
    else if (id.startsWith('m-')) {
      const m = state.machines.find(x => x.id === id)
      if (m) {
        const mi = state.machines.indexOf(m)
        need(12); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
        doc.text(`MÁQUINA VERIFICADA ${mi+1}:`, ML, y); y+=7
        need(10)
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...DARK)
        doc.text(`Máquina ${m.number||mi+1}: ${m.name||'—'}`, ML+4, y); y+=5.5
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
        const fields=[
          m.os&&`Sistema: ${m.os}`,m.storage&&`Armazenamento: ${m.storage}`,
          m.ram&&`Memória RAM: ${m.ram}`,m.anydesk&&`AnyDesk: ${m.anydesk}`,
          m.windowsActivated!==null&&`Windows Ativado: ${m.windowsActivated?'Sim':'Não'}`,
        ].filter(Boolean)
        fields.forEach(f=>{need(5);doc.text(f,ML+8,y);y+=4.8})
        const procs=[]
        if(m.checkUpdates)  procs.push('Windows Update')
        if(m.checkPrograms) procs.push('Programas instalados')
        if(m.installMilvus) procs.push('Milvus')
        if(m.updateBrowsers)procs.push('Navegadores')
        if(m.installOffice) procs.push('Office')
        if(m.installAdobe)  procs.push('Adobe Reader')
        if(m.installWinrar) procs.push('WinRAR')
        if(m.runAida)       procs.push('AIDA')
        if(procs.length){ need(5); doc.text(`Processos: ${procs.join(', ')}`,ML+8,y);y+=4.8 }
        if(m.observations){ const ls=doc.splitTextToSize(`Obs: ${m.observations}`,CW-12); ls.forEach(l=>{need(5);doc.text(l,ML+8,y);y+=4.8}) }
        renderCFs('machine', m.customFieldValues)
        const photosWithData=m.photos.filter(p=>p.dataUrl)
        if(photosWithData.length){ y+=3;need(10); doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...GRAY); doc.text('Fotos da Máquina:',ML+4,y); y+=5; y=drawPhotoGrid(doc,photosWithData,ML+4,CW-8,y,need,{CYAN,BLACK,GRAY_MID}) }
        y+=5
      }
    }
    else if (id.startsWith('i-')) {
      const inf = state.infrastructures.find(x => x.id === id)
      if (inf) {
        const ii = state.infrastructures.indexOf(inf)
        need(12); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
        doc.text(`INFRAESTRUTURA ${ii+1}:`, ML, y); y+=7
        need(10)
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...DARK)
        doc.text(`• ${inf.description||`Item ${inf.number||ii+1}`}`, ML+4, y); y+=5.5
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
        if(inf.location){ need(5); doc.text(`Localização: ${inf.location}`,ML+8,y);y+=4.8 }
        if(inf.observations){ const ls=doc.splitTextToSize(`Obs: ${inf.observations}`,CW-12); ls.forEach(l=>{need(5);doc.text(l,ML+8,y);y+=4.8}) }
        renderCFs('infra', inf.customFieldValues)
        const photosWithData=inf.photos.filter(p=>p.dataUrl)
        if(photosWithData.length){ y+=3;need(10); doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...GRAY); doc.text('Fotos da Infraestrutura:',ML+4,y); y+=5; y=drawPhotoGrid(doc,photosWithData,ML+4,CW-8,y,need,{CYAN,BLACK,GRAY_MID}) }
        y+=5
      }
    }
    else if (id === 'training') {
      need(12); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
      doc.text('TREINAMENTO:', ML, y); y+=7
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5)
      ;[[state.trainHelpdesk,'Demonstrar como abrir chamado via Client Core Helpdesk'],
        [state.trainMaintenance,'Explicar procedimentos básicos de manutenção'],
        [state.trainUpdates,'Orientar sobre: Sempre manter o sistema atualizado'],
      ].forEach(([done,label])=>{ need(5); doc.setTextColor(done?0:140,done?140:140,done?0:140); doc.text(`${done?'✅':'⬜'} ${label}`,ML+4,y); doc.setTextColor(...DARK); y+=5.2 })
      renderCFs('training', state.customFieldValues)
      y+=4
    }
    else if (id === 'observations') {
      if(state.observations) {
        need(12); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
        doc.text('OBSERVAÇÕES TÉCNICAS:', ML, y); y+=6
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
        const ls=doc.splitTextToSize(state.observations,CW-8)
        ls.forEach(l=>{need(5);doc.text(l,ML+4,y);y+=4.8}); y+=5
      }
    }
    else if (id === 'closure') {
      const clsCFs=(state.customFields||[]).filter(f=>f.section==='closure')
      if(clsCFs.length) {
        need(12); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
        doc.text('ENCERRAMENTO:', ML, y); y+=7
        renderCFs('closure', state.customFieldValues); y+=3
      }
    }
    else if (id.startsWith('cs-')) {
      const sec = (state.customSections||[]).find(s => s.id === id)
      if (sec && sec.showInPdf !== false) {
        const secFields = (sec.fields||[]).filter(f => f.showInPdf !== false)
        if (secFields.length) {
          need(12)
          doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
          doc.text(`${sec.title}`.trim().toUpperCase(), ML, y); y+=7
          secFields.forEach(f => {
            const v = (sec.values||{})[f.id]
            if (v===undefined||v===null||v===''||v===false) return
            need(6)
            doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
            const display = f.type==='checkbox' ? (v?'✅ '+f.label:'⬜ '+f.label) : `${f.label}: ${v}`
            const ls = doc.splitTextToSize(display, CW-8)
            ls.forEach(l=>{ need(5); doc.text(l, ML+4, y); y+=4.8 })
          })
          y+=4
        }
      }
    }
    else if (id === 'signatures') {
      need(55)
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...BLACK)
      doc.text('ASSINATURAS:', ML, y); y+=8

      const allSigs=[
        {name:state.clientName, sig:state.clientSignature, label:'Responsável'},
        ...(state.technicians||[]).map((t,i)=>({name:t.name, sig:t.signature, label:`Técnico ${i+1}`})),
      ]
      const COLS_SIG = Math.min(allSigs.length, 3)
      const sigW=(CW-(COLS_SIG-1)*8)/COLS_SIG
      const sigH=28

      for(let row=0; row<Math.ceil(allSigs.length/COLS_SIG); row++) {
        const rowSigs=allSigs.slice(row*COLS_SIG,(row+1)*COLS_SIG)
        need(sigH+12)
        const sigY=y
        for (let col = 0; col < rowSigs.length; col++) {
          const {name,sig,label} = rowSigs[col]
          const x=ML+col*(sigW+8)
          doc.setDrawColor(...CYAN); doc.setLineWidth(0.3); doc.rect(x,sigY,sigW,sigH,'S')
          if(sig){
            try {
              const coloredSig = await colorizeSignature(sig, primaryColor)
              doc.addImage(coloredSig,'PNG',x+2,sigY+2,sigW-4,sigH-4)
            } catch(e) {
              try{ doc.addImage(sig,'PNG',x+2,sigY+2,sigW-4,sigH-4) } catch{}
            }
          }
          doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...DARK)
          doc.text(`${label}: ${name||'—'}`,x,sigY+sigH+5)
        }
        y=sigY+sigH+12
      }
    }
  }

  // ── Footer ──────────────────────────────────────────────────────
  const total=doc.internal.getNumberOfPages()
  const today=new Date().toLocaleDateString('pt-BR')
  for(let i=1;i<=total;i++) {
    doc.setPage(i)
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.25)
    doc.line(ML,PH-MB-2,ML+CW,PH-MB-2)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(150,150,150)
    doc.text(`Gerado em ${today} - Sistema de Checklist Preventiva (Signum)`,PW/2,PH-MB+2,{align:'center'})
  }

  doc.save(fileName)
}

// ── TXT export ────────────────────────────────────────────────────────────────
export function exportTXT(state) {
  buildReportText(state).then(text => {
    const company=state.companyName||'Empresa', date=new Date().toISOString().split('T')[0]
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=Object.assign(document.createElement('a'),{href:url,download:`relatorio_${company.toLowerCase().replace(/\s+/g,'_')}_${date}.txt`})
    a.click(); URL.revokeObjectURL(url)
  })
}

// ── JSON export ───────────────────────────────────────────────────────────────
export function exportJSON(state) {
  const company=state.companyName||'Empresa', date=new Date().toISOString().split('T')[0]
  const data={
    version:'4.0', exportedAt:new Date().toISOString(),
    company:state.companyName, technicians:(state.technicians||[]).map(t=>({...t,signature:null})),
    client:state.clientName, serviceDate:state.serviceDate,
    arrival:{openMilvus:state.openMilvus,startService:state.startService},
    training:{helpdesk:state.trainHelpdesk,maintenance:state.trainMaintenance,updates:state.trainUpdates},
    machines:state.machines.map(m=>({...m,photos:m.photos.map(p=>({...p,dataUrl:null}))})),
    infrastructures:state.infrastructures.map(i=>({...i,photos:i.photos.map(p=>({...p,dataUrl:null}))})),
    observations:state.observations, customFields:state.customFields, customFieldValues:state.customFieldValues,
    closure:{writeReport:state.writeReport,collectClientSig:state.collectClientSig,collectTechSig:state.collectTechSig,closeCall:state.closeCall,checkSatisfaction:state.checkSatisfaction},
    pdfMargins:state.pdfMargins,
  }
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const a=Object.assign(document.createElement('a'),{href:url,download:`Signum (${company}) - ${date}.json`})
  a.click(); URL.revokeObjectURL(url)
}
