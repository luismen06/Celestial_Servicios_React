import React, { useEffect, useState } from 'react';
import { configService } from '../api/configService';
import { inventarioService } from '../api/inventarioService';
import { produccionService } from '../api/produccionService';
import { Scroll, Plus, Trash2, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

const RecetasPage = () => {
    const [modelos, setModelos] = useState([]);
    const [materiales, setMateriales] = useState([]);
    
    const [selectedModelo, setSelectedModelo] = useState(null);
    const [ingredientes, setIngredientes] = useState([]);
    
    // Formulario Ingrediente
    const [idMateria, setIdMateria] = useState('');
    const [cantidad, setCantidad] = useState('');

    useEffect(() => {
        cargarMaestros();
    }, []);

    const cargarMaestros = async () => {
        const config = await configService.obtenerTodo();
        const inv = await inventarioService.obtenerTodo();
        setModelos(config.modelos);
        setMateriales(inv);
    };

    const handleSelectModelo = async (id) => {
        setSelectedModelo(id);
        cargarReceta(id);
    };

    const cargarReceta = async (id) => {
        try {
            const data = await produccionService.obtenerReceta(id);
            setIngredientes(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAgregar = async (e) => {
        e.preventDefault();
        if(!selectedModelo) return Swal.fire('Error', 'Selecciona un modelo primero', 'warning');

        try {
            await produccionService.agregarIngrediente({
                id_modelo: selectedModelo,
                id_materia: idMateria,
                cantidad: cantidad
            });
            setIdMateria('');
            setCantidad('');
            cargarReceta(selectedModelo);
            Swal.fire('Agregado', 'Ingrediente guardado', 'success');
        } catch (error) {
            Swal.fire('Error', 'No se pudo agregar el ingrediente', 'error');
        }
    };

    const handleEliminar = async (id) => {
        try {
            await produccionService.eliminarIngrediente(id);
            cargarReceta(selectedModelo);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-6">
                <Scroll className="text-blue-600" size={32} />
                Gestión de Recetas
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. LISTA DE MODELOS */}
                <div className="bg-white p-4 rounded-xl shadow border border-slate-100 h-fit">
                    <h3 className="font-semibold text-slate-700 mb-4">Selecciona un Modelo</h3>
                    <ul className="space-y-2">
                        {modelos.map(m => (
                            <li 
                                key={m.id_modelo}
                                onClick={() => handleSelectModelo(m.id_modelo)}
                                className={`p-3 rounded cursor-pointer flex justify-between items-center transition-colors ${selectedModelo === m.id_modelo ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                {m.nombre}
                                {selectedModelo === m.id_modelo && <ArrowRight size={16} />}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 2. EDITOR DE RECETA */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow border border-slate-100">
                    {selectedModelo ? (
                        <>
                            <h3 className="font-semibold text-slate-700 mb-4 border-b pb-2">
                                Ingredientes para: <span className="text-blue-600">{modelos.find(m => m.id_modelo === selectedModelo)?.nombre}</span>
                            </h3>

                            {/* Formulario Agregar */}
                            <form onSubmit={handleAgregar} className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Materia Prima</label>
                                    <select 
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={idMateria}
                                        onChange={e => setIdMateria(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {materiales.map(mat => (
                                            <option key={mat.id_materia} value={mat.id_materia}>
                                                {mat.nombre} ({mat.unidad_base})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Cantidad</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0.00"
                                        value={cantidad}
                                        onChange={e => setCantidad(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded shadow transition-colors">
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </form>

                            {/* Lista de Ingredientes */}
                            {ingredientes.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">Este modelo aún no tiene receta definida.</p>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3 text-slate-600 text-sm">Ingrediente</th>
                                            <th className="p-3 text-slate-600 text-sm">Cantidad</th>
                                            <th className="p-3 text-slate-600 text-sm text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {ingredientes.map(ing => (
                                            <tr key={ing.id_receta} className="hover:bg-slate-50">
                                                <td className="p-3 text-slate-700">{ing.materia}</td>
                                                <td className="p-3 font-mono text-slate-600">{ing.cantidad_estimada} {ing.unidad_base}</td>
                                                <td className="p-3 text-right">
                                                    <button 
                                                        onClick={() => handleEliminar(ing.id_receta)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 min-h-[200px]">
                            <Scroll size={48} className="mb-2 opacity-20" />
                            <p>Selecciona un modelo de la izquierda para ver su receta.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecetasPage;