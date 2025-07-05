CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    peso DECIMAL(5,2) NOT NULL CHECK (peso > 0 AND peso <= 1000),
    talla DECIMAL(3,2) NOT NULL CHECK (talla > 0 AND talla <= 3),
    diagnostico TEXT NOT NULL CHECK (LENGTH(diagnostico) >= 5),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT pacientes_nombre_check CHECK (LENGTH(nombre) >= 2),
    CONSTRAINT pacientes_apellido_check CHECK (LENGTH(apellido) >= 2)
);
