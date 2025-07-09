const request = require("supertest");
const { app, resetData } = require("./app");
const os = require("os");

// Função para determinar o número de workers, substituindo os.availableParallelism()
function getMaxWorkers() {
  if (typeof os.availableParallelism === 'function') {
    return os.availableParallelism(); // Para Node.js >= v19.4.0
  } else {
    return Math.max(1, os.cpus().length - 1); // Para versões anteriores ao v19.4.0
  }
}

beforeEach(async () => {
  await resetData();
});

describe("Testes de Cursos", () => {
  test("Deve criar um curso com sucesso", async () => {
    const res = await request(app).post("/cursos").send({
      nome: "Algoritmos",
      descricao: "Curso básico de algoritmos"
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.nome).toBe("Algoritmos");
  });

  test("Não deve criar curso com dados inválidos", async () => {
    const res = await request(app).post("/cursos").send({
      nome: "",
      descricao: ""
    });
    expect(res.statusCode).toBe(400);
  });

  test("Não deve criar curso duplicado", async () => {
    await request(app).post("/cursos").send({
      nome: "Algoritmos",
      descricao: "Curso básico"
    });
    const res = await request(app).post("/cursos").send({
      nome: "Algoritmos",
      descricao: "Outro texto"
    });
    expect(res.statusCode).toBe(409);
  });

  test("Deve listar todos os cursos", async () => {
    await request(app).post("/cursos").send({ nome: "Sistemas Distribuídos", descricao: "Curso sobre sistemas distribuídos" });
    const res = await request(app).get("/cursos");
    expect(res.body.cursos.length).toBeGreaterThan(0);
  });

  test("Deve retornar curso por ID", async () => {
    await request(app).post("/cursos").send({ nome: "Cibersegurança", descricao: "Curso de cibersegurança" });
    const res = await request(app).get("/cursos/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe("Cibersegurança");
  });

  test("Deve retornar erro ao buscar curso inexistente", async () => {
    const res = await request(app).get("/cursos/999");
    expect(res.statusCode).toBe(404);
  });

  test("Deve atualizar curso existente", async () => {
    await request(app).post("/cursos").send({ nome: "Gestão de TI", descricao: "Curso sobre gestão de TI" });
    const res = await request(app).put("/cursos/1").send({ nome: "Gestão de TI Avançada", descricao: "Curso avançado de TI" });
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe("Gestão de TI Avançada");
  });

  test("Deve excluir curso existente", async () => {
    await request(app).post("/cursos").send({ nome: "Frameworks", descricao: "Curso sobre frameworks" });
    const res = await request(app).delete("/cursos/1");
    expect(res.statusCode).toBe(200);
  });
});

describe("Testes de Alunos", () => {
  test("Deve criar aluno com sucesso", async () => {
    const res = await request(app).post("/alunos").send({
      nome: "João",
      email: "joao@email.com"
    });
    expect(res.statusCode).toBe(201);
  });

  test("Não deve criar aluno com dados inválidos", async () => {
    const res = await request(app).post("/alunos").send({
      nome: "",
      email: ""
    });
    expect(res.statusCode).toBe(400);
  });

  test("Não deve permitir e-mail duplicado", async () => {
    await request(app).post("/alunos").send({
      nome: "João",
      email: "joao@email.com"
    });
    const res = await request(app).post("/alunos").send({
      nome: "Outro",
      email: "joao@email.com"
    });
    expect(res.statusCode).toBe(409);
  });

  test("Deve listar alunos", async () => {
    await request(app).post("/alunos").send({ nome: "João", email: "joao@email.com" });
    const res = await request(app).get("/alunos");
    expect(res.body.alunos.length).toBeGreaterThan(0);
  });

  test("Deve atualizar aluno", async () => {
    await request(app).post("/alunos").send({ nome: "João", email: "joao@email.com" });
    const res = await request(app).put("/alunos/1").send({ nome: "João Atualizado", email: "joao@email.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe("João Atualizado");
  });

  test("Deve excluir aluno", async () => {
    await request(app).post("/alunos").send({ nome: "João", email: "joao@email.com" });
    const res = await request(app).delete("/alunos/1");
    expect(res.statusCode).toBe(200);
  });
});

describe("Testes de Matrícula", () => {
  test("Deve matricular aluno em curso", async () => {
    await request(app).post("/alunos").send({ nome: "Maria", email: "maria@email.com" });
    await request(app).post("/cursos").send({ nome: "Inglês", descricao: "Curso de inglês básico" });

    const resMatricula = await request(app).post("/alunos/1/matricular").send({ cursoId: 1 });
    expect(resMatricula.statusCode).toBe(200);

    const resAluno = await request(app).get("/alunos/1");
    expect(resAluno.statusCode).toBe(200);
    expect(resAluno.body.cursos).toContain("Inglês");
  });

  test("Não deve matricular em curso inexistente", async () => {
    await request(app).post("/alunos").send({ nome: "Maria", email: "maria@email.com" });
    const res = await request(app).post("/alunos/1/matricular").send({ cursoId: 999 });
    expect(res.statusCode).toBe(404);
  });

  test("Não deve matricular aluno inexistente", async () => {
    const res = await request(app).post("/alunos/999/matricular").send({ cursoId: 1 });
    expect(res.statusCode).toBe(404);
  });

  test("Não deve matricular aluno já matriculado", async () => {
    await request(app).post("/alunos").send({ nome: "Lucas", email: "lucas@email.com" });
    await request(app).post("/cursos").send({ nome: "Desenvolvimento de Serviços e APIs", descricao: "Curso sobre serviços e APIs" });
    await request(app).post("/alunos/1/matricular").send({ cursoId: 1 });

    const res = await request(app).post("/alunos/1/matricular").send({ cursoId: 1 });
    expect(res.statusCode).toBe(400);
  });
});

describe("Testes de Remoção de Matrícula", () => {
  test("Deve remover matrícula com sucesso", async () => {
    await request(app).post("/alunos").send({ nome: "Ana", email: "ana@email.com" });
    await request(app).post("/cursos").send({ nome: "Programação", descricao: "Curso de programação" });
    await request(app).post("/alunos/1/matricular").send({ cursoId: 1 });

    const res = await request(app).delete("/alunos/1/remover-matricula").send({ cursoId: 1 });
    expect(res.statusCode).toBe(200);

    const resAluno = await request(app).get("/alunos/1");
    expect(resAluno.statusCode).toBe(200);
    expect(resAluno.body.cursos).not.toContain("Programação");
  });

  test("Não deve remover matrícula inexistente", async () => {
    await request(app).post("/alunos").send({ nome: "Ana", email: "ana@email.com" });
    await request(app).post("/cursos").send({ nome: "Programção Avançada", descricao: "Curso avançado de programação" });

    const res = await request(app).delete("/alunos/1/remover-matricula").send({ cursoId: 1 });
    expect(res.statusCode).toBe(400);
  });
});
