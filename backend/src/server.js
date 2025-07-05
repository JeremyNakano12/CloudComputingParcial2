const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || 'pacientes_db',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
});

// Esquema de validación para pacientes
const pacienteSchema = Joi.object({
  nombre: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El nombre es requerido',
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede tener más de 50 caracteres'
  }),
  apellido: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'El apellido es requerido',
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede tener más de 50 caracteres'
  }),
  peso: Joi.number().positive().max(500).required().messages({
    'number.positive': 'El peso debe ser un número positivo',
    'number.max': 'El peso no puede ser mayor a 500 kg',
    'any.required': 'El peso es requerido'
  }),
  talla: Joi.number().positive().max(3).required().messages({
    'number.positive': 'La talla debe ser un número positivo',
    'number.max': 'La talla no puede ser mayor a 3 metros',
    'any.required': 'La talla es requerida'
  }),
  diagnostico: Joi.string().min(4).max(500).required().messages({
    'string.empty': 'El diagnóstico es requerido',
    'string.min': 'El diagnóstico debe tener al menos 3 caracteres',
    'string.max': 'El diagnóstico no puede tener más de 500 caracteres'
  })
});

// Función para verificar la conexión a la base de datos
async function verificarConexionDB() {
  try {
    const client = await pool.connect();
    console.log('Se conectó correctamente a Postgres');
    client.release();
  } catch (err) {
    console.error('No se pudo conectar a Postgres:', err.message);
    process.exit(1);
  }
}

// Rutas de la API

// Ruta para crear un nuevo paciente
app.post('/api/pacientes', async (req, res) => {
  try {
    // Validar los datos de entrada
    const { error, value } = pacienteSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { nombre, apellido, peso, talla, diagnostico } = value;

    // Insertar el paciente en la base de datos
    const query = `
      INSERT INTO pacientes (nombre, apellido, peso, talla, diagnostico, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [nombre, apellido, peso, talla, diagnostico]);
    const nuevoPaciente = result.rows[0];

    console.log('Paciente registrado:', nuevoPaciente.id);

    res.status(201).json({
      success: true,
      message: 'Paciente registrado correctamente',
      data: nuevoPaciente
    });

  } catch (err) {
    console.error('Error al registrar paciente:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener todos los pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    const query = 'SELECT * FROM pacientes ORDER BY fecha_registro DESC';
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('No se pudieron obtener los pacientes:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener un paciente específico
app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID debe ser un número entero'
      });
    }

    const query = 'SELECT * FROM pacientes WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('No se pudo obtener el paciente:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID debe ser un número entero'
      });
    }

    // Verificar si el paciente existe antes de eliminarlo
    const checkQuery = 'SELECT * FROM pacientes WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const pacienteAEliminar = checkResult.rows[0];

    // Eliminar el paciente
    const deleteQuery = 'DELETE FROM pacientes WHERE id = $1 RETURNING *';
    const deleteResult = await pool.query(deleteQuery, [id]);

    console.log(`Paciente eliminado: ${pacienteAEliminar.nombre} ${pacienteAEliminar.apellido} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Paciente eliminado exitosamente',
      data: deleteResult.rows[0]
    });

  } catch (err) {
    console.error('Error al eliminar al paciente:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.use((err, req, res, next) => {
  console.error('Error desconocido:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

async function iniciarServidor() {
  await verificarConexionDB();
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Backend corriendo en puerto ${port}`);
    console.log(`API: http://localhost:${port}/api`);
  });
}

iniciarServidor().catch(err => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await pool.end();
  process.exit(0);
});