import { useState } from 'react'
import {
  MonitorSmartphone, Camera, History, FilePlus,
  Share2, Sun, Moon, FileText, Plus, X,
  CheckSquare, Save, LayoutTemplate, Palette
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { useThemeCtx } from '../../context/ThemeContext.jsx'

export default function BottomNav({
  activeTab, onAddMachine, onAddInfra, onHistory, onNew, onShare, onGenerate, onTemplate, onPalette
}) {
  const { state }              = useApp()
  const { progress, v }        = useValidation()
  const { isDark, toggleTheme }= useThemeCtx()
  const [addOpen, setAddOpen]  = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { saveStatus } = state

  // FAB "+ Adicionar" popup sheet
  const AddSheet = () => (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setAddOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn .18s var(--ease)',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 'calc(63px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0,
        zIndex: 1005, width: '100%',
        background: 'var(--dropdown-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--dropdown-border)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -10px 40px rgba(0,0,0,.35)',
        overflow: 'hidden',
        paddingBottom: 8,
        animation: 'slideFromBottom .45s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {[
          { icon: <MonitorSmartphone size={18} color="var(--cyan)"/>, label: 'Adicionar Máquina', action: onAddMachine },
          { icon: <Camera size={18} color="var(--cyan)"/>, label: 'Adicionar Infraestrutura', action: onAddInfra },
        ].map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={() => { action(); setAddOpen(false) }}
            style={{
              width: '100%', padding: '16px 20px',
              background: 'transparent', border: 'none',
              borderBottom: '1px solid var(--glass-border)',
              color: 'var(--t1)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              fontSize: '.95rem', fontFamily: 'var(--font)', fontWeight: 500,
              transition: 'background .13s',
              textAlign: 'left',
            }}
            onTouchStart={e => e.currentTarget.style.background = 'var(--glass-3)'}
            onTouchEnd={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'var(--glass-3)', border: '1px solid var(--cyan-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </div>
            {label}
          </button>
        ))}
      </div>
    </>
  )

  // Theme/Color selection sheet
  const ThemeSheet = () => (
    <>
      <div
        onClick={() => setThemeMenuOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1020,
          background: 'rgba(0,0,0,.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn .18s var(--ease)',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))', left: 14, right: 14,
        zIndex: 1025,
        background: 'var(--dropdown-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--dropdown-border)',
        borderRadius: '18px',
        boxShadow: '0 -10px 40px rgba(0,0,0,.35)',
        overflow: 'hidden',
        padding: '6px 0',
        animation: 'slideUp .3s var(--spring)',
      }}>
        <button
          onClick={() => { toggleTheme(); setThemeMenuOpen(false) }}
          style={{
            width: '100%', padding: '16px 20px',
            background: 'transparent', border: 'none',
            color: 'var(--t1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14,
            fontSize: '.92rem', fontFamily: 'var(--font)', fontWeight: 600,
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--glass-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isDark ? <Sun size={17} color="var(--amber)"/> : <Moon size={17} color="var(--cyan)"/>}
          </div>
          Tema {isDark ? 'Claro' : 'Escuro'}
        </button>
        <button
          onClick={() => { onPalette(); setThemeMenuOpen(false) }}
          style={{
            width: '100%', padding: '16px 20px',
            background: 'transparent', border: 'none',
            color: 'var(--t1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14,
            fontSize: '.92rem', fontFamily: 'var(--font)', fontWeight: 600,
            borderTop: '1px solid var(--glass-border)'
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--glass-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={17} color="var(--cyan)"/>
          </div>
          Customizar Cor
        </button>
      </div>
    </>
  )

  return (
    <>
      {addOpen && <AddSheet/>}
      {themeMenuOpen && <ThemeSheet/>}

      {/* Bottom bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 1010,
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid var(--header-border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,.25)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Progress bar at the very top of nav */}
        <div style={{ height: 2, background: 'var(--glass-border)', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--cyan), var(--cyan-glow))',
            transition: 'width .4s var(--ease)',
          }}/>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          height: 60, alignItems: 'stretch',
        }}>

          {/* History */}
          <NavBtn active={activeTab === 'history'} icon={<History size={19}/>} label="Histórico" onClick={onHistory}/>

          {/* Template */}
          <NavBtn active={activeTab === 'template'} icon={<LayoutTemplate size={19}/>} label="Modelos" onClick={onTemplate}/>

          {/* Share */}
          <NavBtn active={activeTab === 'share'} icon={<Share2 size={19}/>} label="Partilhar" onClick={onShare}/>

          {/* FAB — Add (centre, elevated) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: '4' }}>
            <button
              onClick={() => setAddOpen(v => !v)}
              style={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: addOpen
                  ? 'var(--red)'
                  : 'linear-gradient(135deg, var(--cyan-glow), var(--cyan-dim))',
                border: `1.5px solid ${addOpen ? 'var(--red)' : 'var(--cyan-border-strong)'}`,
                boxShadow: addOpen
                  ? '0 4px 18px rgba(255,77,109,.4)'
                  : '0 4px 18px var(--cyan-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                transition: 'all .22s var(--spring)',
                transform: addOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              }}
            >
              <Plus size={22} color="#fff"/>
            </button>
          </div>

          <NavBtn
            icon={isDark ? <Moon size={19}/> : <Sun size={19} color="var(--amber)"/>}
            label="Estilo"
            onClick={() => setThemeMenuOpen(true)}
            accent={!isDark || themeMenuOpen}
            active={themeMenuOpen}
          />

          {/* New report */}
          <NavBtn icon={<FilePlus size={19}/>} label="Novo" onClick={onNew}/>

          {/* Generate — rightmost, always visible, shows pending count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={onGenerate}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2,
                padding: '6px 4px', width: '100%', height: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: !v.hardMissing?.length
                  ? 'linear-gradient(135deg, var(--cyan-glow), var(--cyan-dim))'
                  : 'var(--glass-1)',
                border: `1.5px solid ${!v.hardMissing?.length ? 'var(--cyan-border-strong)' : 'var(--glass-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s var(--ease)',
                boxShadow: !v.hardMissing?.length ? '0 2px 12px var(--cyan-glow)' : 'none',
              }}>
                <FileText size={16} color={!v.hardMissing?.length ? 'var(--cyan)' : 'var(--t3)'}/>
              </div>
              {v.hardMissing?.length > 0 && (
                <div style={{
                  position: 'absolute', top: 4, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--red)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '.6rem', fontWeight: 800, color: '#fff',
                }}>
                  {(v.hardMissing?.length||0) > 9 ? '9+' : (v.hardMissing?.length||0)}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Save status chip (only shows briefly) */}
        {(saveStatus === 'saving' || saveStatus === 'saved') && (
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%) translateY(-8px)',
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 20,
            background: 'var(--glass-2)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(12px)',
            fontSize: '.72rem', fontWeight: 600,
            animation: 'fadeIn .2s var(--ease)',
            whiteSpace: 'nowrap',
          }}>
            {saveStatus === 'saving'
              ? <><div style={{width:6,height:6,borderRadius:'50%',background:'var(--cyan)',animation:'pulse 1s infinite'}}/><span style={{color:'var(--cyan)'}}>Salvando…</span></>
              : <><Save size={11} color="var(--green)"/><span style={{color:'var(--green)'}}>Salvo</span></>
            }
          </div>
        )}
      </nav>
    </>
  )
}

// ── Reusable nav button ────────────────────────────────────────────────────────
function NavBtn({ icon, label, onClick, accent, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 2,
        padding: '6px 4px', background: 'transparent', border: 'none',
        cursor: 'pointer', color: active ? 'var(--cyan)' : accent ? 'var(--amber)' : 'var(--t2)',
        textShadow: active ? '0 0 8px var(--cyan-glow)' : 'none',
        transition: 'color .15s, text-shadow .15s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => {
        if (!active) e.currentTarget.style.color = 'var(--cyan)';
      }}
      onTouchEnd={e => {
        if (!active) e.currentTarget.style.color = accent ? 'var(--amber)' : 'var(--t2)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: active ? 'drop-shadow(0 0 6px var(--cyan-glow))' : 'none', transition: 'filter .15s' }}>
        {icon}
      </div>
    </button>
  )
}
