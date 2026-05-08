import { History, X, Trash2, RotateCcw, Clock, Building2, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function HistoryModal({ onClose }) {
  const { state, loadFromHistory, deleteHistory } = useApp();
  const { history } = state;

  const handleLoad = (id) => {
    if (window.confirm('Carregar este relatório? O progresso atual não salvo será perdido.')) {
      loadFromHistory(id);
      onClose();
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Remover este registro do histórico?')) {
      deleteHistory(id);
    }
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <History size={17} color="var(--cyan)" />
            Histórico de Relatórios
          </div>
          <button className="btn btn-ghost btn-icon hide-on-mobile" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--t3)' }}>
              <History size={36} style={{ opacity:.3, marginBottom:12 }} />
              <div style={{ fontSize:'.875rem' }}>Nenhum relatório no histórico ainda.</div>
              <div style={{ fontSize:'.78rem', marginTop:4 }}>
                Os relatórios são salvos automaticamente ao exportar.
              </div>
            </div>
          ) : history.map(entry => (
            <div
              key={entry.id}
              className="history-item"
              onClick={() => handleLoad(entry.id)}
              title="Clique para carregar"
            >
              <div style={{
                width:36, height:36, borderRadius:9,
                background:'var(--cyan-dim)', border:'1px solid var(--cyan-border)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>
                <FileText size={16} color="var(--cyan)" />
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:'.875rem', color:'var(--t1)', marginBottom:2,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {entry.companyName}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.72rem', color:'var(--t3)' }}>
                  <Clock size={10} />{fmt(entry.date)}
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:4, padding:'3px 9px',
                  background:'var(--glass-2)', border:'1px solid var(--cyan-border)',
                  borderRadius:20, fontSize:'.68rem', color:'var(--cyan)', fontWeight:600,
                }}>
                  <RotateCcw size={9} /> Carregar
                </div>
                <button
                  className="btn btn-danger btn-icon"
                  style={{ width:28, height:28 }}
                  onClick={e => handleDelete(e, entry.id)}
                  title="Excluir do histórico"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-foot hide-on-mobile">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
