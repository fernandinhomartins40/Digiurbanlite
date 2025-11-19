import { Router } from 'express';
import culturaService from '../services/cultura/cultura.service';

const router = Router();

// ============================================================================
// CULTURA (MS-25 a MS-32) - ROTAS
// ============================================================================

// ===== MS-25: ESPAÇOS CULTURAIS =====

router.post('/espacos', async (req, res) => {
  try {
    const espaco = await culturaService.createEspacoCultural(req.body);
    res.status(201).json(espaco);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/espacos', async (req, res) => {
  try {
    const { tipo } = req.query;
    const espacos = await culturaService.listEspacosCulturais(tipo as string);
    res.json(espacos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/espacos/:id', async (req, res) => {
  try {
    const espaco = await culturaService.findEspacoCulturalById(req.params.id);
    res.json(espaco);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/espacos/:id', async (req, res) => {
  try {
    const espaco = await culturaService.updateEspacoCultural(req.params.id, req.body);
    res.json(espaco);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/espacos/:id', async (req, res) => {
  try {
    await culturaService.deleteEspacoCultural(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-26: RESERVAS DE ESPAÇOS =====

router.post('/reservas', async (req, res) => {
  try {
    const reserva = await culturaService.createReservaEspaco(req.body);
    res.status(201).json(reserva);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/reservas', async (req, res) => {
  try {
    const { espacoId, citizenId, status } = req.query;
    const reservas = await culturaService.listReservas(
      espacoId as string,
      citizenId as string,
      status as string
    );
    res.json(reservas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/reservas/:id', async (req, res) => {
  try {
    const reserva = await culturaService.updateReserva(req.params.id, req.body);
    res.json(reserva);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/reservas/:id/aprovar', async (req, res) => {
  try {
    const reserva = await culturaService.aprovarReserva(req.params.id);
    res.json(reserva);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/reservas/:id/rejeitar', async (req, res) => {
  try {
    const { motivo } = req.body;
    const reserva = await culturaService.rejeitarReserva(req.params.id, motivo);
    res.json(reserva);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-27: ARTISTAS =====

router.post('/artistas', async (req, res) => {
  try {
    const artista = await culturaService.createArtista(req.body);
    res.status(201).json(artista);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/artistas', async (req, res) => {
  try {
    const { categoria } = req.query;
    const artistas = await culturaService.listArtistas(categoria as string);
    res.json(artistas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/artistas/:id', async (req, res) => {
  try {
    const artista = await culturaService.findArtistaById(req.params.id);
    res.json(artista);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/artistas/:id', async (req, res) => {
  try {
    const artista = await culturaService.updateArtista(req.params.id, req.body);
    res.json(artista);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/artistas/:id', async (req, res) => {
  try {
    await culturaService.deleteArtista(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-28: EVENTOS CULTURAIS =====

router.post('/eventos', async (req, res) => {
  try {
    const evento = await culturaService.createEventoCultural(req.body);
    res.status(201).json(evento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/eventos', async (req, res) => {
  try {
    const { categoria, status } = req.query;
    const eventos = await culturaService.listEventosCulturais(
      categoria as string,
      status as string
    );
    res.json(eventos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/eventos/:id', async (req, res) => {
  try {
    const evento = await culturaService.findEventoCulturalById(req.params.id);
    res.json(evento);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/eventos/:id', async (req, res) => {
  try {
    const evento = await culturaService.updateEventoCultural(req.params.id, req.body);
    res.json(evento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/eventos/:id/cancelar', async (req, res) => {
  try {
    const evento = await culturaService.cancelarEvento(req.params.id);
    res.json(evento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/agenda-mensal/:ano/:mes', async (req, res) => {
  try {
    const agenda = await culturaService.getAgendaMensal(
      parseInt(req.params.ano),
      parseInt(req.params.mes)
    );
    res.json(agenda);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-29: EDITAIS CULTURAIS =====

router.post('/editais', async (req, res) => {
  try {
    const edital = await culturaService.createEditalCultural(req.body);
    res.status(201).json(edital);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/editais', async (req, res) => {
  try {
    const { status } = req.query;
    const editais = await culturaService.listEditaisCulturais(status as string);
    res.json(editais);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/editais/:id', async (req, res) => {
  try {
    const edital = await culturaService.findEditalCulturalById(req.params.id);
    res.json(edital);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/editais/:id', async (req, res) => {
  try {
    const edital = await culturaService.updateEditalCultural(req.params.id, req.body);
    res.json(edital);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/editais/:id/publicar', async (req, res) => {
  try {
    const edital = await culturaService.publicarEdital(req.params.id);
    res.json(edital);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/editais/:id/encerrar', async (req, res) => {
  try {
    const edital = await culturaService.encerrarEdital(req.params.id);
    res.json(edital);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-30: BIBLIOTECA =====

router.post('/biblioteca/livros', async (req, res) => {
  try {
    const livro = await culturaService.createLivroBiblioteca(req.body);
    res.status(201).json(livro);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/biblioteca/livros', async (req, res) => {
  try {
    const { categoria, disponivel } = req.query;
    const livros = await culturaService.listLivrosBiblioteca(
      categoria as string,
      disponivel === 'true'
    );
    res.json(livros);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/biblioteca/livros/:id', async (req, res) => {
  try {
    const livro = await culturaService.findLivroBibliotecaById(req.params.id);
    res.json(livro);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/biblioteca/livros/:id', async (req, res) => {
  try {
    const livro = await culturaService.updateLivroBiblioteca(req.params.id, req.body);
    res.json(livro);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-31: EMPRÉSTIMOS =====

router.post('/biblioteca/emprestimos', async (req, res) => {
  try {
    const emprestimo = await culturaService.createEmprestimo(req.body);
    res.status(201).json(emprestimo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/biblioteca/emprestimos', async (req, res) => {
  try {
    const { citizenId, status } = req.query;
    const emprestimos = await culturaService.listEmprestimos(
      citizenId as string,
      status as string
    );
    res.json(emprestimos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/biblioteca/emprestimos/:id/devolver', async (req, res) => {
  try {
    const emprestimo = await culturaService.devolverLivro(req.params.id);
    res.json(emprestimo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/biblioteca/emprestimos/:id/renovar', async (req, res) => {
  try {
    const { novaDataPrevista } = req.body;
    const emprestimo = await culturaService.renovarEmprestimo(
      req.params.id,
      new Date(novaDataPrevista)
    );
    res.json(emprestimo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-32: PATRIMÔNIO CULTURAL =====

router.post('/patrimonio', async (req, res) => {
  try {
    const patrimonio = await culturaService.createPatrimonioCultural(req.body);
    res.status(201).json(patrimonio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/patrimonio', async (req, res) => {
  try {
    const { tipo, status } = req.query;
    const patrimonios = await culturaService.listPatrimoniosCulturais(
      tipo as string,
      status as string
    );
    res.json(patrimonios);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/patrimonio/:id', async (req, res) => {
  try {
    const patrimonio = await culturaService.findPatrimonioCulturalById(req.params.id);
    res.json(patrimonio);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/patrimonio/:id', async (req, res) => {
  try {
    const patrimonio = await culturaService.updatePatrimonioCultural(req.params.id, req.body);
    res.json(patrimonio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/patrimonio/:id/visita', async (req, res) => {
  try {
    const patrimonio = await culturaService.registrarVisita(req.params.id);
    res.json(patrimonio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ESTATÍSTICAS =====

router.get('/estatisticas', async (req, res) => {
  try {
    const stats = await culturaService.getEstatisticasCultura();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
