const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Configuração do pool PostgreSQL
const pool = new Pool({
  user: "seu_usuario",
  host: "localhost",
  database: "escola",
  password: "sua_senha",
  port: 5432,
});

// Função para resetar estado em memória e também no BD (usada nos testes)
async function resetData() {
  await pool.query("DELETE FROM matriculas");
  await pool.query("DELETE FROM alunos");
  await pool.query("DELETE FROM cursos");
}

// Validações
function validarDadosCurso(nome, descricao) {
  if (!nome || !descricao) {
    return "Nome do curso e descrição são obrigatórios.";
  }
  return null;
}

function validarDadosAluno(nome, email) {
  if (!nome || !email) {
    return "Nome e email são obrigatórios.";
  }
  return null;
}

// ROTAS DE CURSOS

app.get("/cursos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cursos ORDER BY id");
    res.json({ message: "Lista de cursos cadastrados.", cursos: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar cursos", details: err.message });
  }
});

app.get("/cursos/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cursos WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Curso não encontrado." });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar curso", details: err.message });
  }
});

app.post("/cursos", async (req, res) => {
  const { nome, descricao } = req.body;
  const erro = validarDadosCurso(nome, descricao);
  if (erro) return res.status(400).json({ message: erro });

  try {
    const dup = await pool.query("SELECT id FROM cursos WHERE LOWER(nome) = LOWER($1)", [nome]);
    if (dup.rows.length > 0) return res.status(409).json({ message: "Já existe um curso com este nome." });

    const result = await pool.query(
      "INSERT INTO cursos (nome, descricao) VALUES ($1, $2) RETURNING *",
      [nome, descricao]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao inserir curso", details: err.message });
  }
});

app.put("/cursos/:id", async (req, res) => {
  const { nome, descricao } = req.body;
  const erro = validarDadosCurso(nome, descricao);
  if (erro) return res.status(400).json({ message: erro });

  try {
    const result = await pool.query(
      "UPDATE cursos SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *",
      [nome, descricao, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Curso não encontrado." });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar curso", details: err.message });
  }
});

app.delete("/cursos/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM cursos WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Curso não encontrado." });
    res.json({ message: "Curso excluído com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir curso", details: err.message });
  }
});

// ROTAS DE ALUNOS

app.get("/alunos", async (req, res) => {
  try {
    const alunos = await pool.query("SELECT * FROM alunos ORDER BY id");
    const matriculas = await pool.query(`
      SELECT m.aluno_id, c.nome as nome_curso
      FROM matriculas m
      JOIN cursos c ON m.curso_id = c.id
    `);

    const alunosComCursos = alunos.rows.map((aluno) => {
      const cursosAluno = matriculas.rows
        .filter((m) => m.aluno_id === aluno.id)
        .map((m) => m.nome_curso);

      return {
        ...aluno,
        cursos: cursosAluno.length ? cursosAluno : "Aluno não matriculado em nenhum curso",
      };
    });

    res.json({ message: "Lista de alunos cadastrados.", alunos: alunosComCursos });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar alunos", details: err.message });
  }
});

app.post("/alunos", async (req, res) => {
  const { nome, email } = req.body;
  const erro = validarDadosAluno(nome, email);
  if (erro) return res.status(400).json({ message: erro });

  try {
    const dup = await pool.query("SELECT id FROM alunos WHERE LOWER(email) = LOWER($1)", [email]);
    if (dup.rows.length > 0) return res.status(409).json({ message: "Já existe um aluno com este email." });

    const result = await pool.query(
      "INSERT INTO alunos (nome, email) VALUES ($1, $2) RETURNING *",
      [nome, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao inserir aluno", details: err.message });
  }
});

app.put("/alunos/:id", async (req, res) => {
  const { nome, email } = req.body;
  const erro = validarDadosAluno(nome, email);
  if (erro) return res.status(400).json({ message: erro });

  try {
    const result = await pool.query(
      "UPDATE alunos SET nome = $1, email = $2 WHERE id = $3 RETURNING *",
      [nome, email, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Aluno não encontrado." });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar aluno", details: err.message });
  }
});

app.delete("/alunos/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM alunos WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Aluno não encontrado." });
    res.json({ message: "Aluno excluído com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir aluno", details: err.message });
  }
});

// MATRÍCULAS

app.post("/alunos/:id/matricular", async (req, res) => {
  const alunoId = parseInt(req.params.id);
  const { cursoId } = req.body;

  try {
    const aluno = await pool.query("SELECT id FROM alunos WHERE id = $1", [alunoId]);
    if (aluno.rows.length === 0) return res.status(404).json({ message: "Aluno não encontrado." });

    const curso = await pool.query("SELECT id FROM cursos WHERE id = $1", [cursoId]);
    if (curso.rows.length === 0) return res.status(404).json({ message: "Curso não encontrado." });

    const exist = await pool.query(
      "SELECT * FROM matriculas WHERE aluno_id = $1 AND curso_id = $2",
      [alunoId, cursoId]
    );
    if (exist.rows.length > 0) return res.status(400).json({ message: "Aluno já está matriculado neste curso." });

    await pool.query("INSERT INTO matriculas (aluno_id, curso_id) VALUES ($1, $2)", [alunoId, cursoId]);
    res.json({ message: "Aluno matriculado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao matricular aluno", details: err.message });
  }
});

app.delete("/alunos/:id/remover-matricula", async (req, res) => {
  const alunoId = parseInt(req.params.id);
  const { cursoId } = req.body;

  try {
    const deleted = await pool.query(
      "DELETE FROM matriculas WHERE aluno_id = $1 AND curso_id = $2 RETURNING *",
      [alunoId, cursoId]
    );
    if (deleted.rows.length === 0) return res.status(400).json({ message: "Matrícula não encontrada." });
    res.json({ message: "Matrícula removida com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover matrícula", details: err.message });
  }
});

// Exporta app e função de reset para testes
module.exports = { app, resetData };
