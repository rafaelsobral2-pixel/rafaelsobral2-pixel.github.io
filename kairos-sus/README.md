# Kairós SUS

**Plataforma cidadã para resolver tempo de espera nas UPAs da Zona Sul de São Paulo.**

Triagem conversacional pelo WhatsApp usando o Protocolo de Manchester, roteamento inteligente entre as 11 UPAs da região e painel preditivo para a gestão baseado na escala NEDOCS. Projeto da Global Solution FIAP 2026.2, desafio CitizenTech.

📄 [PDF da apresentação (20 slides)](./Kairos_Global_Solution_Rafael_Sobral_RM572127_FINAL.pdf) · 🎥 [Vídeo pitch no YouTube (3 min)](https://youtu.be/YqGMpCi4S3g)

---

## TL;DR

- **Problema real**: 2,7 milhões de habitantes na Zona Sul, só 11 UPAs e 40% dos casos de dengue da capital concentrados ali
- **Insight**: o gargalo não é só número de UPAs, é a falta de coordenação entre elas. Campo Limpo tem 5x mais gente por UPA do que a vizinha SACA
- **Solução**: conversa pelo WhatsApp → triagem Manchester → decisão baseada em tempo-alvo + lotação (NEDOCS) → paciente chega pré-cadastrado
- **Diferencial**: antecipa picos de dengue e calor em 2 a 3 semanas cruzando InfoDengue, INMET e histórico local
- **Resultado modelado na persona**: jornada que hoje leva 4h20 cai pra 1h45

---

## O problema

Quem já esperou numa fila de UPA conhece a cena: você chega com o filho com febre, senta ali 2 horas, e no fim descobre que a UPA do bairro vizinho estava quase vazia.

Isso acontece todo dia e tem números por trás. Alguns que embasaram o projeto:

| Indicador | Valor | Fonte |
|-----------|-------|-------|
| Habitantes da CRS Sul (5 STS) | 2,69 milhões | SEADE 2024 |
| UPAs na Zona Sul | 11 (26% do total da capital) | CNES/DataSUS |
| Casos de dengue concentrados aqui | 39,5% (de 13,9 mil) | Boletim municipal 2026 |
| Reclamações à ouvidoria em um trimestre | 1.521 | Rel. CRS Sul 3TRI/2025 |
| Manifestações que entram por canal digital | 6% | Ouvidoria SMS-SP |

A tabela por Supervisão Técnica deixa o desequilíbrio claro:

| STS | População | UPAs | Hab/UPA |
|-----|-----------|------|---------|
| Campo Limpo | 678 mil | 1 | **678 mil** |
| Capela do Socorro | 598 mil | 2 | 299 mil |
| M'Boi Mirim | 562 mil | 2 | 281 mil |
| Parelheiros | 166 mil | 1 | 166 mil |
| Santo Amaro/C. Ademar | 686 mil | 5 | 137 mil |

Campo Limpo carrega 5x a demanda de SACA, que é vizinha. É isso que o Kairós ataca.

---

## Pesquisa e descoberta

Antes de propor qualquer coisa, passei por três checagens:

1. **Já existe algo parecido?** Levantei o que o mercado brasileiro oferece: e-saúdeSP, VAR da Saúde (Santo André), Fila Saúde/iSUS, Meu SUS Digital. Nenhum faz triagem conversacional + roteamento inteligente + previsão de pico. A maioria só mostra a fila. Benchmark completo está no PDF (slide 19).

2. **Que dados eu tenho pra embasar?** Ao invés de inventar números, mapeei fontes públicas e desenhei a solução em torno do que a API ou o dataset entrega hoje:
   - **CNES/DataSUS**: cadastro das 11 UPAs com CNES, nome, coordenadas
   - **SEADE 2024**: população por STS
   - **InfoDengue (Fiocruz)**: casos por semana epidemiológica por STS
   - **INMET (Estação Mirante de Santana)**: temperatura horária, normal climatológica
   - **IBGE Censo 2022**: perfil demográfico por distrito administrativo
   - **Ouvidoria SMS-SP**: padrões de reclamação, baseline de volume

3. **O que o SUS já define como padrão?** Em vez de inventar critério clínico, adotei o que o próprio sistema usa:
   - **Protocolo de Manchester**: 5 cores (azul, verde, amarelo, laranja, vermelho) e tempos-alvo oficiais
   - **Escala NEDOCS**: validada para pronto-socorro brasileiro na Rev. Gaúcha de Enfermagem (2019)

Isso virou o alicerce do projeto. Se um avaliador contestar "e se o Manchester estiver errado?", a resposta é: o Manchester é o padrão do SUS, não uma escolha minha.

---

## Persona

Dona Rosa, 54, mãe e cuidadora. Mora no Grajaú (STS Capela do Socorro), diarista em Santo Amaro, vive com o neto Davi de 6 anos. Celular Android básico, só WhatsApp e ligação. Não tem carro, depende de ônibus ou Uber.

Ela representa o perfil mais comum da Zona Sul segundo o Censo IBGE 2022: **mulheres 45+ cuidadoras, com WhatsApp como principal canal digital** e deslocamento por transporte público ou aplicativo.

**O cenário**: Davi acorda com febre alta às 23h. A UPA do Grajaú é longe e a Dona Maria Antonieta está sempre cheia. Para onde ir?

### Jornada hoje, sem Kairós (4h20)

| Horário | O que acontece |
|---------|---------------|
| 23:00 | Uber até UPA D. Maria Antonieta (R$ 32, 25 min) |
| 23:30 | Fila cheia, 40 pessoas. Triagem amarela |
| 01:45 | Ainda aguardando, +40 min restantes |
| 03:20 | Atendimento feito. Volta pra casa |

### Jornada com Kairós (1h45)

| Horário | O que acontece |
|---------|---------------|
| 23:00 | Manda sintomas no WhatsApp: "Febre 39°C e manchas" |
| 23:03 | Triagem Manchester: amarelo. Sugere UPA Icaraí, 25 min de espera |
| 23:35 | Chega à UPA Icaraí já cadastrada, prioridade confirmada |
| 00:45 | Em casa com o neto. Receita digital no WhatsApp |

---

## Decisões de produto

Essa seção mostra o que considerei e por que escolhi um caminho e não outro.

### Por que WhatsApp e não app próprio

Pesquisei soluções similares e vi a mesma armadilha repetida: baixar app novo, criar conta, login, verificar email. Pra Dona Rosa, cada passo é fricção. 147 milhões de brasileiros já usam WhatsApp todo dia. Então a triagem acontece em canal que a pessoa já tem, já entende e já usa. **Custo zero de adoção.**

### Por que Manchester e não um sistema próprio

Ter um "bot inteligente que classifica sintomas" soa bonito até alguém perguntar: "classifica com base em quê?". A resposta certa não pode ser "treinei em dados do GitHub". O Manchester é o padrão oficial do SUS, documentado e auditável. Usar ele significa que **o Kairós fala a mesma língua clínica da UPA**.

### A regra de roteamento — por que a "opção C"

Considerei três opções:

- **A**: redirecionar sempre pela UPA mais próxima → ignora lotação, não resolve nada
- **B**: redirecionar sempre pela menor fila → pode mandar o paciente longe por 5 min de ganho
- **C** (escolhida): redireciona quando o tempo-alvo da cor estoura na UPA atual **e** a vizinha cabe no NEDOCS

A opção C junta critério clínico (tempo-alvo) com critério operacional (NEDOCS da vizinha) e ainda respeita a restrição humana (não mandar longe se o ganho for marginal).

### O que o Kairós nunca faz

Decisão explícita no desenho:

1. **Nunca sugere adiar.** O momento é sempre agora. Nenhuma tela diz "volte amanhã"
2. **Vermelho e laranja não comparam fila.** Aciona SAMU 192 e manda pra UPA mais próxima, ponto
3. **Dúvida clínica vai pra humano.** Enfermeiro recebe escalada em segundos
4. **Dados de saúde protegidos pela LGPD** com consentimento explícito

Um sistema de saúde que falha silenciosamente mata. O Kairós foi desenhado pra falhar barulhento.

### Persona idosa — quando o WhatsApp não é suficiente

A STS Santo Amaro/Cidade Ademar tem 23% da população com 60+ anos, a maior proporção da Zona Sul. Pra essa região o canal primário muda: SMS com linguagem simples + ligação opcional. O Kairós não é o mesmo em Parelheiros e em Santo Amaro, se adapta ao perfil demográfico.

---

## Solução, em três frentes

**1 · Para o cidadão** — Triagem conversacional pelo WhatsApp. Descreve sintomas em texto ou áudio, recebe classificação Manchester em 5 cores, destino sugerido com tempo e rota.

**2 · Roteamento** — Mapa de espera das 11 UPAs em tempo real. O sistema cruza tempo-alvo da cor, distância e NEDOCS. Vermelho/laranja ignora distância e vai pro 192.

**3 · Para a gestão** — Painel preditivo. Cada UPA recebe um "crachá operacional" com a escala NEDOCS e, mais importante, a **causa provável** da lotação: dengue subindo, onda de calor, déficit de equipe, surto respiratório.

A camada preditiva cruza InfoDengue, INMET e IBGE pra antecipar picos de 2 a 3 semanas. Isso é tempo pra reforçar equipe, soro e triagem **antes** do pico, não depois.

---

## Arquitetura (resumo)

Java Web com arquitetura em 6 camadas:

```
VIEW (JSP + Thymeleaf)
  └─ CONTROLLER (Servlets)
      └─ SERVICE (regras de negócio + integração APIs externas)
          └─ DAO (acesso a dados)
              └─ MODEL (entidades de domínio)
                  └─ DATABASE (Oracle 19c · ConexaoFactory singleton)
```

**Padrões de projeto aplicados**: MVC (toda a aplicação), DAO (Paciente, Atendimento, Unidade, Alerta), Singleton (ConexaoFactory), Strategy (notificação por WhatsApp/SMS/Push com interface comum).

**Modelagem UML**: 13 classes aplicando os 4 pilares de POO:
- **Herança**: `UPA`, `UBS`, `AMA` herdam de `Unidade` (abstrata)
- **Encapsulamento**: atributos `private` + getters validados; `Paciente.cpf` nunca exposto cru (LGPD)
- **Polimorfismo**: interface `Notificacao` implementada por 3 canais; o motor chama `enviar()` sem saber qual
- **Abstração**: `TriagemService.classificar()` esconde a árvore de decisão do Manchester

---

## Métricas propostas

Indicadores objetivos, mensuráveis trimestralmente:

| Métrica | Alvo |
|---------|------|
| Tempo médio sintoma → triagem | ↓ 40% |
| Aderência ao tempo-alvo Manchester | ↑ 85% |
| Reclamações de tempo de espera (baseline 1.521) | ↓ 50% |
| Dias de antecedência na previsão de pico | 14 dias |

---

## ODS da ONU contemplados

- **ODS 3 · Saúde e Bem-Estar** (principal, meta 3.8 acesso universal)
- **ODS 10 · Redução das Desigualdades** (meta 10.2 inclusão social)
- **ODS 9 · Indústria, Inovação e Infraestrutura** (meta 9.C acesso à TIC)
- **ODS 11 · Cidades e Comunidades Sustentáveis** (meta 11.B resiliência urbana)

---

## O que eu faria diferente

Honestidade antes de autoelogio:

1. **Validação com usuário real.** O projeto é acadêmico, não rodou com Dona Rosa de verdade. A jornada de 4h20 → 1h45 é estimativa derivada, não medição. Num próximo ciclo, piloto com 1 STS (Capela do Socorro, 2 UPAs) com entrevistas antes/depois seria o primeiro passo
2. **Integração real com o CNES.** Hoje o Kairós consulta o CNES como fonte de dados; o próximo degrau é escrever de volta (atualizar status em tempo real) e isso exige acordo com a Secretaria
3. **Teste da escala NEDOCS no contexto brasileiro.** A escala é validada no Brasil mas foi calibrada em contextos específicos. Antes de confiar nela pra decidir redirecionamento, calibrar nos dados reais das 11 UPAs da Zona Sul

---

## Materiais

- 📄 [PDF da apresentação (20 slides, 2,88 MB)](./Kairos_Global_Solution_Rafael_Sobral_RM572127_FINAL.pdf)
- 🎥 [Vídeo pitch no YouTube (3 min)](https://youtu.be/YqGMpCi4S3g)
- 📝 [Roteiro do pitch](./pitch_roteiro.md)

---

**Contato**: rafael.sobral@outlook.com · [LinkedIn](https://linkedin.com/in/rafaelsobral)
