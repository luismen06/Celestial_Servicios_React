import React, { useEffect, useState } from 'react';
import { produccionService } from '../api/produccionService';
import { configService } from '../api/configService';
import { inventarioService } from '../api/inventarioService';
import { Hammer, Play, ArrowRight, Clock, Plus, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

const ProduccionPage = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Maestros
    const [modelos, setModelos] = useState([]);
    const [trabajadores, setTrabajadores] = useState([]);
    const [etapas, setEtapas] = useState([]);
    const [inventario, setInventario] = useState([]);

    // Estados Modales
    const [showModalIniciar, setShowModalIniciar] = useState(false);
    const [newOrden, setNewOrden] = useState({ id_modelo: '', id_trabajador: '' });

    const [ordenAvanzar, setOrdenAvanzar] = useState(null);
    const [idTrabajadorNext, setIdTrabajadorNext] = useState('');
    
    // Materiales Extra
    const [materialExtraSel, setMaterialExtraSel] = useState('');
    const [cantidadExtra, setCantidadExtra] = useState('');
    const [listaMaterialesExtra, setListaMaterialesExtra] = useState([]);

    useEffect(() => {
        cargarTablero();
        cargarMaestros();
    }, []);

    const cargarTablero = async () => {
        try {
            const data = await produccionService.obtenerProduccion();
            setOrdenes(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const cargarMaestros = async () => {
        const config = await configService.obtenerTodo();
        const etapasData = await produccionService.obtenerEtapas();
        const invData = await inventarioService.obtenerTodo();
        setModelos(config.modelos);
        setTrabajadores(config.trabajadores.filter(t => t.activo));
        setEtapas(etapasData);
        setInventario(invData);
    };

    // --- CÁLCULO DE ESTADO DERIVADO (SOLUCIÓN DEL BUG) ---
    // Buscamos el material en tiempo real. Si materialExtraSel cambia, esto se recalcula al instante.
    // Usamos '==' para que no importen las diferencias entre string/numero
    const materialActivo = inventario.find(m => m.id_materia == materialExtraSel);

    // --- ACCIONES ---
    const handleMaterialChange = (e) => {
        setMaterialExtraSel(e.target.value);
        setCantidadExtra(''); // Limpiamos cantidad al cambiar material para evitar confusiones
    };

    const agregarMaterialExtra = () => {
        if (!materialExtraSel || !cantidadExtra) return;
        
        // Usamos la variable calculada arriba
        if (!materialActivo) return;

        const nuevoItem = {
            id_materia: parseInt(materialExtraSel),
            nombre: materialActivo.nombre,
            unidad: materialActivo.unidad_base,
            cantidad: parseFloat(cantidadExtra)
        };
        setListaMaterialesExtra([...listaMaterialesExtra, nuevoItem]);
        setMaterialExtraSel('');
        setCantidadExtra('');
    };

    const quitarMaterialExtra = (index) => {
        const copia = [...listaMaterialesExtra];
        copia.splice(index, 1);
        setListaMaterialesExtra(copia);
    };

    const handleIniciar = async (e) => {
        e.preventDefault();
        try {
            await produccionService.iniciarProduccion(newOrden);
            Swal.fire({ icon: 'success', title: 'Orden Iniciada', timer: 1500, showConfirmButton: false });
            setShowModalIniciar(false);
            setNewOrden({ id_modelo: '', id_trabajador: '' });
            cargarTablero();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al iniciar', 'error');
        }
    };

    // --- LÓGICA AUTOMÁTICA DEL SIGUIENTE PASO ---
    const getNextStepInfo = () => {
        if (!ordenAvanzar) return null;
        const currentEtapaIndex = etapas.findIndex(e => e.nombre === ordenAvanzar.etapa);
        
        if (currentEtapaIndex === -1 || currentEtapaIndex === etapas.length - 1) {
            return { id: 'TERMINADO', nombre: 'FINALIZAR PRODUCCIÓN' };
        }
        
        const nextEtapa = etapas[currentEtapaIndex + 1];
        return { id: nextEtapa.id_etapa, nombre: nextEtapa.nombre };
    };

    const nextStep = getNextStepInfo();

    const handleAvanzar = async (e) => {
        e.preventDefault();
        try {
            await produccionService.avanzarEtapa({
                id_cofre: ordenAvanzar.id_cofre,
                id_etapa_nueva: nextStep.id, 
                id_trabajador: idTrabajadorNext
            });
            Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
            setOrdenAvanzar(null);
            cargarTablero();
        } catch (error) {
            Swal.fire('Error', 'No se pudo avanzar', 'error');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#f8fafc]">
            {/* ENCABEZADO */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Hammer className="text-[#3b82f6]" size={32} />
                    Tablero de Producción
                </h1>
                <button onClick={() => setShowModalIniciar(true)} className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-md shadow-blue-500/30 transition-all">
                    <Play size={18} fill="currentColor" /> Iniciar Nueva Orden
                </button>
            </div>

            {/* KANBAN CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ordenes.filter(o => o.estado !== 'Terminado').map(orden => (
                    <div key={orden.id_cofre} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden hover:shadow-lg transition-all group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3b82f6]"></div>
                        
                        <div className="flex justify-between items-start mb-3 pl-3">
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-extrabold px-2 py-1 rounded">#{orden.id_cofre}</span>
                            <span className="bg-blue-50 text-[#2563eb] text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">EN PROCESO</span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2 pl-3">{orden.modelo}</h3>
                        
                        <div className="pl-3 mb-6">
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" /> Etapa: <span className="text-slate-700 font-semibold">{orden.etapa}</span>
                            </p>
                        </div>
                        
                        <div className="border-t border-slate-100 pt-4 flex justify-between items-center pl-3">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Resp: <span className="text-slate-700 normal-case">{orden.trabajador}</span></p>
                                <span className="bg-[#f0fdf4] text-[#16a34a] px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                    ${orden.costo_total?.toLocaleString('es-CO')}
                                </span>
                            </div>
                            <button 
                                onClick={() => { 
                                    setOrdenAvanzar(orden); 
                                    setIdTrabajadorNext(''); 
                                    setListaMaterialesExtra([]); 
                                    setMaterialExtraSel('');
                                }} 
                                className="bg-[#1e293b] text-white p-3 rounded-lg hover:bg-black transition-colors shadow-lg"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL AVANZAR --- */}
            {ordenAvanzar && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden">
                        
                        <div className="flex justify-between items-center p-6 pb-0">
                            <h3 className="text-xl font-bold text-slate-700">Reporte de Avance</h3>
                            <button onClick={() => setOrdenAvanzar(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 pt-4">
                            <div className="bg-[#eff6ff] rounded-lg p-4 mb-6 border border-blue-100">
                                <p className="text-[#1e40af] font-bold">Cofre ID: #{ordenAvanzar.id_cofre}</p>
                                <p className="text-[#3b82f6] text-sm italic mt-1">Etapa Actual: {ordenAvanzar.etapa}</p>
                            </div>

                            <div className="border-t border-dashed border-slate-200 my-4"></div>

                            {/* 1. Materiales Usados */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-600 mb-3">1. Materiales Usados</h4>
                                <div className="flex gap-3 mb-2">
                                    <select 
                                        className="flex-1 p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                                        value={materialExtraSel}
                                        onChange={handleMaterialChange} // <--- CAMBIO AQUÍ
                                    >
                                        <option value="">Seleccionar material...</option>
                                        {inventario.map(m => (
                                            <option key={m.id_materia} value={m.id_materia}>{m.nombre} ({m.unidad_base})</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        className="w-24 p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                        placeholder="Cant."
                                        value={cantidadExtra}
                                        onChange={(e) => setCantidadExtra(e.target.value)}
                                    />
                                    <button onClick={agregarMaterialExtra} className="bg-[#94a3b8] hover:bg-slate-600 text-white px-4 rounded-lg font-bold text-xl">+</button>
                                </div>

                                {/* Stock Disponible (Renderizado Directo) */}
                                {materialActivo && (
                                    <p className="text-sm font-bold text-[#22c55e] mb-4 pl-1 animate-pulse">
                                        Disponible: {materialActivo.cantidad_total_base} {materialActivo.unidad_base}
                                    </p>
                                )}

                                <div className="bg-[#f8fafc] border border-slate-100 rounded-lg p-4 min-h-[60px] flex flex-col justify-center">
                                    {listaMaterialesExtra.length === 0 ? (
                                        <p className="text-center text-slate-400 text-sm">No se han agregado materiales extra.</p>
                                    ) : (
                                        <ul className="space-y-2 w-full">
                                            {listaMaterialesExtra.map((item, idx) => (
                                                <li key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm text-xs">
                                                    <span className="font-bold text-slate-700">{item.nombre}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-slate-500">{item.cantidad} {item.unidad}</span>
                                                        <button onClick={() => quitarMaterialExtra(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* 2. Responsable y Destino */}
                            <form onSubmit={handleAvanzar}>
                                <div className="mb-5">
                                    <h4 className="text-sm font-bold text-slate-600 mb-2">2. Responsable y Destino</h4>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Trabajador Responsable:</label>
                                    <select 
                                        className="w-full p-3 border border-red-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-red-500 bg-white"
                                        value={idTrabajadorNext}
                                        onChange={e => setIdTrabajadorNext(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione trabajador...</option>
                                        {trabajadores.map(t => <option key={t.id_trabajador} value={t.id_trabajador}>{t.nombre}</option>)}
                                    </select>
                                </div>

                                <div className="mb-8">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Siguiente Paso (Automático):</label>
                                    <div className="w-full bg-[#ecfdf5] border border-green-200 text-[#166534] font-bold py-4 px-4 rounded-lg text-center shadow-sm">
                                        {nextStep ? (
                                            nextStep.id === 'TERMINADO' ? '🏁 FINALIZAR PRODUCCIÓN' : `Avanzar a: ${nextStep.nombre}`
                                        ) : 'Cargando...'}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-[#4fd1c5] hover:bg-teal-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-teal-200 transition-all text-lg">
                                    Guardar y Avanzar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {showModalIniciar && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-[400px]">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Iniciar Nueva Orden</h3>
                        <form onSubmit={handleIniciar} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Modelo</label>
                                <select className="w-full p-3 border rounded-lg bg-white" value={newOrden.id_modelo} onChange={e => setNewOrden({...newOrden, id_modelo: e.target.value})} required>
                                    <option value="">Seleccionar...</option>
                                    {modelos.map(m => <option key={m.id_modelo} value={m.id_modelo}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Trabajador</label>
                                <select className="w-full p-3 border rounded-lg bg-white" value={newOrden.id_trabajador} onChange={e => setNewOrden({...newOrden, id_trabajador: e.target.value})} required>
                                    <option value="">Seleccionar...</option>
                                    {trabajadores.map(t => <option key={t.id_trabajador} value={t.id_trabajador}>{t.nombre}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModalIniciar(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-[#2563eb] text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Iniciar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProduccionPage;