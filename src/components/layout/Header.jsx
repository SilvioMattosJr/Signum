import { useState } from 'react'
import {
  CheckSquare, MonitorSmartphone, Camera, Save,
  History, Plus, FilePlus, Sun, Moon, Share2, Layout, Palette,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { useAutoSave } from '../../hooks/useAutoSave.js'
import { useThemeCtx } from '../../context/ThemeContext.jsx'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'

// Desktop / tablet-landscape top header
export default function Header({ onAddMachine, onAddInfra, onHistory, onNew, onShare, onTemplate, onPalette }) {
  useAutoSave()
  const { state }               = useApp()
  const { progress }            = useValidation()
  const { isDark, toggleTheme } = useThemeCtx()
  const { useBottomNav }        = useBreakpoint()
  const [menuOpen, setMenuOpen] = useState(false)
  const { saveStatus } = state

  // On mobile/tablet-portrait the bottom nav takes over —
  // we still render a minimal header (logo + progress only)
  if (useBottomNav) {
    return (
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--header-bg)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow: 'var(--header-shadow)',
      }}>
        <div style={{
          padding: '0 16px', height: 52,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28,
              background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)',
              borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckSquare size={13} color="var(--cyan)"/>
            </div>
            <span style={{
              fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.85rem',
              color: 'var(--cyan)', letterSpacing: '.1em',
            }}>
              SIGNUM
            </span>
          </div>

          {/* Progress fills the rest */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.6rem', color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Progresso
              </span>
              <span style={{ fontSize: '.6rem', color: 'var(--cyan)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                {progress}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }}/>
            </div>
          </div>

          {/* Save chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.7rem', flexShrink: 0 }}>
            {saveStatus === 'saving' && (
              <><div className="save-dot" style={{ background:'var(--cyan)',width:5,height:5,borderRadius:'50%' }}/><span style={{color:'var(--cyan)'}}>Salvando</span></>
            )}
            {saveStatus === 'saved' && (
              <><Save size={10} color="var(--green)"/><span style={{color:'var(--green)'}}>Salvo</span></>
            )}
          </div>
        </div>
      </header>
    )
  }

  // ── Full desktop header ────────────────────────────────────────
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(22px) saturate(180%)',
      WebkitBackdropFilter: 'blur(22px) saturate(180%)',
      borderBottom: '1px solid var(--header-border)',
      boxShadow: 'var(--header-shadow)',
      transition: 'background var(--t-slow) var(--ease), border-color var(--t-base) var(--ease)',
    }}>
      <div style={{
        maxWidth: 960, margin: '0 auto', padding: '0 16px',
        height: 58, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, background: 'var(--cyan-dim)',
            border: '1px solid var(--cyan-border)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckSquare size={15} color="var(--cyan)"/>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.9rem', color: 'var(--cyan)', letterSpacing: '.1em' }}>
            SIGNUM
          </span>
        </div>

        {/* Progress */}
        <div style={{ flex: 1, maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '.67rem', color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Progresso</span>
            <span style={{ fontSize: '.67rem', color: 'var(--cyan)', fontFamily: 'var(--mono)', fontWeight: 700 }}>{progress}%</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }}/></div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', minWidth: 52 }}>
            {saveStatus==='saving'&&<><div className="save-dot" style={{background:'var(--cyan)',width:6,height:6,borderRadius:'50%'}}/><span style={{color:'var(--cyan)'}}>Salvando</span></>}
            {saveStatus==='saved' &&<><Save size={11} color="var(--green)"/><span style={{color:'var(--green)'}}>Salvo</span></>}
            {saveStatus==='error' &&<span style={{color:'var(--red)',fontSize:'.65rem'}}>Erro ao salvar</span>}
          </div>

          <button className="btn btn-icon btn-ghost" onClick={onHistory} title="Histórico"><History size={15}/></button>
          <button className="btn btn-icon btn-ghost" onClick={onNew}     title="Novo relatório"><FilePlus size={15}/></button>
          <button className="btn btn-icon btn-ghost" onClick={onShare}    title="Compartilhar / Importar"><Share2 size={15}/></button>
          <button className="btn btn-icon btn-ghost" onClick={onTemplate} title="Modelos de formulário"><Layout size={15}/></button>

          <button className="btn btn-icon btn-ghost" onClick={onPalette} title="Customizar cor"><Palette size={15}/></button>

          {/* Theme toggle */}
          <button className="btn-theme" onClick={toggleTheme} title={isDark?'Tema claro':'Tema escuro'} aria-label="Alternar tema">
            <span className="icon-dark"><Moon size={15}/></span>
            <span className="icon-light"><Sun size={15} color="var(--amber)"/></span>
          </button>

          {/* Add menu */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setMenuOpen(v => !v)} style={{ gap: 5 }}>
              <Plus size={13}/> Adicionar
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 149 }} onClick={() => setMenuOpen(false)}/>
                <div style={{
                  position: 'absolute', top: 'calc(100% + 7px)', right: 0, zIndex: 150,
                  background: 'var(--dropdown-bg)',
                  backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
                  border: '1px solid var(--dropdown-border)',
                  borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.25)',
                  overflow: 'hidden', minWidth: 200,
                  animation: 'slideUp .2s var(--spring)',
                }}>
                  {[
                    { icon: <MonitorSmartphone size={15} color="var(--cyan)"/>, label: 'Adicionar Máquina',      action: onAddMachine },
                    { icon: <Camera           size={15} color="var(--cyan)"/>, label: 'Adicionar Infraestrutura', action: onAddInfra   },
                  ].map(({ icon, label, action }) => (
                    <button key={label} onClick={() => { action(); setMenuOpen(false) }}
                      style={{
                        width:'100%', padding:'11px 15px',
                        background:'transparent', border:'none',
                        color:'var(--t1)', cursor:'pointer',
                        display:'flex', alignItems:'center', gap:9,
                        fontSize:'.855rem', fontFamily:'var(--font)',
                        borderBottom:'1px solid var(--glass-border)',
                        transition:'background .13s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--dropdown-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
