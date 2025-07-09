const { Pool } = require('pg');

const pool = new Pool({
  user: 'seu_usuario',
  host: 'localhost',
  database: 'seu_banco',
  password: 'sua_senha',
  port: 5432,
});

// Função genérica para query
async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

// Cursos
async function listarCursos() {
  const res = await query('SELECT * FROM cursos ORDER BY id');
  return res.rows;
}

async function buscarCursoPorId(id) {
  const res = await query('SELECT * FROM cursos WHERE id = $1', [id]);
  return res.rows[0];
}

async function criarCurso(nome, cargaHoraria) {
  const res = await query(
    'INSERT INTO cursos (nome, carga_horaria) VALUES ($1, $2) RETURNING *',
    [nome, cargaHoraria]
  );
  return res.rows[0];
}

async function atualizarCurso(id, nome, cargaHoraria) {
  const res = await query(
    'UPDATE cursos SET nome = $1, carga_horaria = $2 WHERE id = $3 RETURNING *',
    [nome, cargaHoraria, id]
  );
  return res.rows[0];
}

async function removerCurso(id) {
  await query('DELETE FROM cursos WHERE id = $1', [id]);
}

// Alunos
async function listarAlunos() {
  const res = await query('SELECT * FROM alunos ORDER BY id');
  return res.rows;
}

async function buscarAlunoPorId(id) {
  const res = await query('SELECT * FROM alunos WHERE id = $1', [id]);
  return res.rows[0];
}

async function buscarAlunoPorEmail(email) {
  const res = await query('SELECT * FROM alunos WHERE email = $1', [email]);
  return res.rows[0];
}

async function criarAluno(nome, email) {
  const res = await query(
    'INSERT INTO alunos (nome, email) VALUES ($1, $2) RETURNING *',
    [nome, email]
  );
  return res.rows[0];
}

async function atualizarAluno(id, nome, email) {
  const res = await query(
    'UPDATE alunos SET nome = $1, email = $2 WHERE id = $3 RETURNING *',
    [nome, email, id]
  );
  return res.rows[0];
}

async function removerAluno(id) {
  await query('DELETE FROM alunos WHERE id = $1', [id]);
}

// Matrículas
async function matricularAluno(alunoId, cursoId) {
  await query(
    'INSERT INTO matriculas (aluno_id, curso_id) VALUES ($1, $2)',
    [alunoId, cursoId]
  );
}

async function removerMatricula(alunoId, cursoId) {
  await query(
    'DELETE FROM matriculas WHERE aluno_id = $1 AND curso_id = $2',
    [alunoId, cursoId]
  );
}

async function verificarMatricula(alunoId, cursoId) {
  const res = await query(
    'SELECT * FROM matriculas WHERE aluno_id = $1 AND curso_id = $2',
    [alunoId, cursoId]
  );
  return res.rows.length > 0;
}

module.exports = {
  listarCursos,
  buscarCursoPorId,
  criarCurso,
  atualizarCurso,
  removerCurso,
  listarAlunos,
  buscarAlunoPorId,
  buscarAlunoPorEmail,
  criarAluno,
  atualizarAluno,
  removerAluno,
  matricularAluno,
  removerMatricula,
  verificarMatricula,
  query, // exporta a query caso precise usar direto
};
