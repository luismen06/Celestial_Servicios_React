import React, { useEffect, useState } from 'react';
import { inventarioService } from '../api/inventarioService';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

const InventarioPage = () => {
    const [materiales, setMateriales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarForm, setMostrarForm] = useState(false);

    // Formulario
    const [nuevoMaterial, setNuevoMaterial] = useState({
        nombre: '', unidad_base: 'gr', presentacion_compra: '', contenido_por_presentacion: 0, nivel_minimo_base: 0
    });

    useEffect(() => { cargarInventario(); }, []);

    const cargarInventario = async () => {
        try {
            const data = await inventarioService.obtenerTodo();
            setMateriales(data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await inventarioService.crearMateria(nuevoMaterial);
            Swal.fire({ icon: 'success', title: 'Creado', timer: 1500, showConfirmButton: false });
            setMostrarForm(false);
            setNuevoMaterial({ nombre: '', unidad_base: 'gr', presentacion_compra: '', contenido_por_presentacion: 0, nivel_minimo_base: 0 });
            cargarInventario();
        } catch (error) { Swal.fire('Error', 'No se pudo crear', 'error'); }
    };

    const filtrados = materiales.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto bg-[#f8fafc] min-h-screen">
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-blue-600" size={28} /> Inventario de Materia Prima
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona el stock base para la producción de cofres.</p>
                </div>
                <button 
                    onClick={() => setMostrarForm(!mostrarForm)}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all text-sm"
                >
                    <Plus size={18} /> Nuevo material
                </button>
            </div>

            {/* FORMULARIO FLOTANTE (Opcional visualización) */}
            {mostrarForm && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 mb-6 animate-fade-in-down">
                    <h3 className="font-bold text-slate-700 mb-4">Nuevo Registro</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Nombre Material" className="p-2 border rounded" required value={nuevoMaterial.nombre} onChange={e=>setNuevoMaterial({...nuevoMaterial, nombre: e.target.value})} />
                        <select className="p-2 border rounded" value={nuevoMaterial.unidad_base} onChange={e=>setNuevoMaterial({...nuevoMaterial, unidad_base: e.target.value})}>
                            <option value="gr">Gramos</option><option value="ml">Mililitros</option><option value="und">Unidades</option>
                        </select>
                        <input type="text" placeholder="Presentación (Ej: Galón)" className="p-2 border rounded" value={nuevoMaterial.presentacion_compra} onChange={e=>setNuevoMaterial({...nuevoMaterial, presentacion_compra: e.target.value})} />
                        <input type="number" placeholder="Contenido (Ej: 3785)" className="p-2 border rounded" value={nuevoMaterial.contenido_por_presentacion} onChange={e=>setNuevoMaterial({...nuevoMaterial, contenido_por_presentacion: e.target.value})} />
                        <input type="number" placeholder="Alerta Mínimo" className="p-2 border rounded" value={nuevoMaterial.nivel_minimo_base} onChange={e=>setNuevoMaterial({...nuevoMaterial, nivel_minimo_base: e.target.value})} />
                        <button type="submit" className="bg-green-600 text-white font-bold rounded">Guardar</button>
                    </form>
                </div>
            )}

            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-white p-1 rounded-lg border border-slate-200 mb-6 shadow-sm flex items-center">
                <Search className="text-slate-400 ml-3" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar material..." 
                    className="w-full p-3 outline-none text-slate-600 bg-transparent"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* TABLA LIMPIA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f8fafc] border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">IDENTIFICACIÓN</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Presentación</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Base de stock</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? <tr><td colSpan="5" className="p-6 text-center">Cargando...</td></tr> : filtrados.map((m) => {
                            const stock = parseFloat(m.cantidad_total_base);
                            const min = parseFloat(m.nivel_minimo_base);
                            const esBajo = stock <= min;

                            return (
                                <tr key={m.id_materia} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-400 font-mono text-sm"># {m.id_materia}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{m.nombre}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {m.presentacion_compra} <span className="text-slate-400 text-xs">({m.contenido_por_presentacion} {m.unidad_base})</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                                        {stock.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{m.unidad_base}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {esBajo ? (
                                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border border-red-100">
                                                <AlertTriangle size={10} /> Bajo Stock
                                            </span>
                                        ) : (
                                            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border border-green-100">
                                                De Acuerdo
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventarioPage;