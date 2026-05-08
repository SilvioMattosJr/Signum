import { HexColorPicker } from 'react-colorful'
import { X, RotateCcw, Check, Hash, Type } from 'lucide-react'
import { useThemeCtx } from '../../context/ThemeContext.jsx'
import { useState, useEffect } from 'react'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const h = Math.max(0, Math.min(255, n)).toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

export default function ColorPickerModal({ onClose }) {
  const { primaryColor, updatePrimaryColor, resetPrimaryColor } = useThemeCtx()
  const [rgb, setRgb] = useState(hexToRgb(primaryColor))
  const [hexInput, setHexInput] = useState(primaryColor)

  useEffect(() => {
    setRgb(hexToRgb(primaryColor))
    setHexInput(primaryColor)
  }, [primaryColor])

  const handleHexChange = (val) => {
    setHexInput(val)
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      updatePrimaryColor(val.toLowerCase())
    }
  }

  const handleRgbChange = (channel, val) => {
    const num = parseInt(val) || 0;
    const newRgb = { ...rgb, [channel]: num };
    setRgb(newRgb);
    updatePrimaryColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 340, 
          padding: '24px',
          gap: '20px',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Customizar Cor</h2>
          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="custom-picker" style={{ width: '100%' }}>
          <HexColorPicker 
            color={primaryColor} 
            onChange={updatePrimaryColor} 
            style={{ width: '100%', height: '180px' }}
          />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* HEX Input */}
          <div className="form-group">
            <label className="label" style={{ fontSize: '.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Hash size={10} /> HEXADECIMAL
            </label>
            <input 
              className="input" 
              value={hexInput} 
              onChange={e => handleHexChange(e.target.value)}
              placeholder="#000000"
              style={{ fontFamily: 'var(--mono)', fontSize: '.85rem' }}
            />
          </div>

          {/* RGB Inputs */}
          <div className="form-group">
            <label className="label" style={{ fontSize: '.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Type size={10} /> RGB (RED, GREEN, BLUE)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['r', 'g', 'b'].map(c => (
                <input 
                  key={c}
                  type="number"
                  className="input"
                  value={rgb[c]}
                  onChange={e => handleRgbChange(c, e.target.value)}
                  min="0"
                  max="255"
                  style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '.85rem', padding: '8px 4px' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          width: '100%',
          padding: '12px',
          background: 'var(--glass-1)',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: primaryColor,
            border: '2px solid var(--glass-border)',
            boxShadow: '0 0 20px ' + primaryColor + '55',
            flexShrink: 0
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '.85rem', fontWeight: 700, color: 'var(--t1)' }}>
              {primaryColor.toUpperCase()}
            </span>
            <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>
              A ferramenta se adapta ao seu estilo
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button 
            className="btn btn-secondary" 
            onClick={resetPrimaryColor}
            style={{ flex: 1, gap: 6 }}
          >
            <RotateCcw size={14} /> Padrão
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onClose}
            style={{ flex: 1, gap: 6 }}
          >
            <Check size={14} /> Aplicar
          </button>
        </div>
      </div>

      <style>{`
        .custom-picker .react-colorful {
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .custom-picker .react-colorful__saturation {
          border-bottom: none;
          border-radius: 12px 12px 0 0;
        }
        .custom-picker .react-colorful__hue {
          height: 14px;
          border-radius: 0 0 12px 12px;
        }
        .custom-picker .react-colorful__pointer {
          width: 22px;
          height: 22px;
          border-width: 3px;
        }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}</style>
    </div>
  )
}
