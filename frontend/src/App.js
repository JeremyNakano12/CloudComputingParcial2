import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    peso: '',
    talla: '',
    diagnostico: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({});
  const [pacientes, setPacientes] = useState([]);
  const [showPacientes, setShowPacientes] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
    }

    const peso = parseFloat(formData.peso);
    if (!formData.peso) {
      newErrors.peso = 'El peso es requerido';
    } else if (isNaN(peso) || peso <= 0) {
      newErrors.peso = 'El peso debe ser un número positivo';
    } else if (peso > 500) {
      newErrors.peso = 'El peso no puede ser mayor a 500 kg';
    }

    const talla = parseFloat(formData.talla);
    if (!formData.talla) {
      newErrors.talla = 'La talla es requerida';
    } else if (isNaN(talla) || talla <= 0) {
      newErrors.talla = 'La talla debe ser un número positivo';
    } else if (talla > 3) {
      newErrors.talla = 'La talla no puede ser mayor a 3 metros';
    }

    if (!formData.diagnostico.trim()) {
      newErrors.diagnostico = 'El diagnóstico es requerido';
    } else if (formData.diagnostico.trim().length < 5) {
      newErrors.diagnostico = 'El diagnóstico debe tener al menos 5 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({
        text: 'Por favor corrige los errores en el formulario',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const dataToSend = {
        ...formData,
        peso: parseFloat(formData.peso),
        talla: parseFloat(formData.talla)
      };

      const response = await axios.post(`${API_URL}/api/pacientes`, dataToSend);

      if (response.data.success) {
        setMessage({
          text: 'Paciente registrado',
          type: 'success'
        });

        // Limpiar formulario
        setFormData({
          nombre: '',
          apellido: '',
          peso: '',
          talla: '',
          diagnostico: ''
        });

        // Actualizar lista si está visible
        if (showPacientes) {
          await loadPacientes();
        }
      }
    } catch (error) {
      console.error('Error al enviar datos:', error);
      
      if (error.response && error.response.data) {
        const { message: errorMessage, errors: fieldErrors } = error.response.data;
        
        if (fieldErrors && Array.isArray(fieldErrors)) {
          setMessage({
            text: `Error: ${fieldErrors.join(', ')}`,
            type: 'error'
          });
        } else {
          setMessage({
            text: `Error: ${errorMessage || 'Error al registrar paciente'}`,
            type: 'error'
          });
        }
      } else {
        setMessage({
          text: 'Error de conexión. Verifica que el servidor esté funcionando.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPacientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pacientes`);
      if (response.data.success) {
        setPacientes(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      setMessage({
        text: 'Error al cargar la lista de pacientes',
        type: 'error'
      });
    }
  };

const deletePaciente = async (id, nombre, apellido) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar al paciente "${nombre} ${apellido}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.delete(`${API_URL}/api/pacientes/${id}`);

      if (response.data.success) {
        setMessage({
          text: `Paciente "${nombre} ${apellido}" eliminado`,
          type: 'success'
        });

        // Actualizar la lista de pacientes
        await loadPacientes();
      }
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      
      if (error.response && error.response.data) {
        setMessage({
          text: `Error: ${error.response.data.message || 'Error al eliminar paciente'}`,
          type: 'error'
        });
      } else {
        setMessage({
          text: 'Error de conexión.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePacientes = async () => {
    if (!showPacientes) {
      await loadPacientes();
    }
    setShowPacientes(!showPacientes);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Pacientes</h1>
          <p>Registro de pacientes para la clase de cloud computing</p>
        </header>

        <div className="main-content">
          <div className="form-section">
            <h2>Registrar Nuevo Paciente</h2>
            
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="patient-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={errors.nombre ? 'error' : ''}
                    placeholder="Ingresa el nombre"
                  />
                  {errors.nombre && <span className="error-text">{errors.nombre}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="apellido">Apellido *</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className={errors.apellido ? 'error' : ''}
                    placeholder="Ingresa el apellido"
                  />
                  {errors.apellido && <span className="error-text">{errors.apellido}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="peso">Peso (kg) *</label>
                  <input
                    type="number"
                    id="peso"
                    name="peso"
                    value={formData.peso}
                    onChange={handleInputChange}
                    className={errors.peso ? 'error' : ''}
                    placeholder="Elige tu peso"
                    step="0.1"
                  />
                  {errors.peso && <span className="error-text">{errors.peso}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="talla">Talla (m) *</label>
                  <input
                    type="number"
                    id="talla"
                    name="talla"
                    value={formData.talla}
                    onChange={handleInputChange}
                    className={errors.talla ? 'error' : ''}
                    placeholder="Elige tu talla"
                    step="0.01"
                  />
                  {errors.talla && <span className="error-text">{errors.talla}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="diagnostico">Diagnóstico *</label>
                <textarea
                  id="diagnostico"
                  name="diagnostico"
                  value={formData.diagnostico}
                  onChange={handleInputChange}
                  className={errors.diagnostico ? 'error' : ''}
                  placeholder="Describe el diagnóstico..."
                  rows="4"
                />
                {errors.diagnostico && <span className="error-text">{errors.diagnostico}</span>}
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? '⏳ Guardando...' : '💾 Registrar Paciente'}
              </button>
            </form>
          </div>

          <div className="actions-section">
            <button 
              onClick={togglePacientes}
              className="toggle-btn"
            >
              {showPacientes ? 'Ocultar Pacientes' : 'Ver Pacientes'}
            </button>

            {showPacientes && (
              <div className="patients-list">
                <h3>Pacientes Registrados ({pacientes.length})</h3>
                {pacientes.length === 0 ? (
                  <p className="no-patients">No hay pacientes registrados</p>
                ) : (
                  <div className="patients-grid">
                    {pacientes.map(paciente => (
                      <div key={paciente.id} className="patient-card">
                        <div className="patient-header">
                          <h4>{paciente.nombre} {paciente.apellido}</h4>
                          <span className="patient-id">ID: {paciente.id}</span>
                          <button 
                              className="delete-btn"
                              onClick={() => deletePaciente(paciente.id, paciente.nombre, paciente.apellido)}
                              disabled={loading}
                              title="Eliminar paciente"
                            >
                              Eliminar
                            </button>
                        </div>
                        <div className="patient-details">
                          <p><strong>Peso:</strong> {paciente.peso} kg</p>
                          <p><strong>Talla:</strong> {paciente.talla} m</p>
                          <p><strong>IMC:</strong> {(paciente.peso / Math.pow(paciente.talla, 2)).toFixed(2)}</p>
                          <p><strong>Diagnóstico:</strong> {paciente.diagnostico}</p>
                          <p><strong>Fecha:</strong> {new Date(paciente.fecha_registro).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;