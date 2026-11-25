REQUISITOS — Sistema Manicure Vilma
Documento: docs/REQUISITOS.md
Versão de referência: 1.0 — consolidação do levantamento de 15/11/2026
Situação: requisitos levantados e consolidados; sujeitos à validação cruzada com REGRAS_NEGOCIO.md, SEGURANCA.md, ARQUITETURA.md, BANCO_DE_DADOS.md e API.md antes de programar.
Finalidade: orientar o desenvolvimento, os testes e os critérios de aceite. Este documento não autoriza iniciar a implementação.

1. Visão geral
Desenvolver uma plataforma de gestão para a profissional Manicure Vilma, composta por um site público, um painel administrativo de acesso exclusivo da proprietária, uma API de backend e banco de dados relacional. O público poderá consultar serviços e solicitar horários. A profissional decidirá se aceita cada solicitação, administrará a agenda, clientes e finanças e receberá alertas no WhatsApp.

Objetivos: reduzir conflitos de agenda; organizar solicitações e atendimentos; permitir aprovação manual; oferecer acompanhamento privado do pedido; registrar recebimentos e despesas; fornecer relatórios; automatizar comunicações pelo WhatsApp em etapa final.
1.1 Partes do projeto já definidas
Parte	Papel	Tecnologia aprovada
frontend/	Site público; seleção de serviço, data e horário; solicitação e acompanhamento	HTML, SCSS, JavaScript e GSAP
paineladm/	Área administrativa privada	React, Vite, JavaScript, SCSS Modules
backend/	API, autenticação, validação de horários e regras de negócio	Python + Flask
Banco de dados	Fonte única de dados de clientes, agenda, financeiro e histórico	PostgreSQL, preferência atual, a confirmar em BANCO_DE_DADOS.md
docs/	Documentação normativa do projeto	Markdown


Decisão de processo: finalizar e alinhar os documentos antes de iniciar a implementação. A integração oficial do WhatsApp será desenvolvida por último, após a construção e os testes dos módulos centrais. O produto desejado, porém, inclui o WhatsApp; a etapa final não está cancelada.
2. Perfis e permissões
- Visitante/cliente: pode visualizar serviços e horários, enviar solicitação e consultar/cancelar a própria solicitação ou agendamento mediante link privado válido. Não acessa o painel administrativo.
- Administradora (Vilma): única pessoa autorizada a entrar no painel; pode administrar solicitações, agenda, serviços, clientes, finanças, configurações e histórico.
- Serviço automático: executa lembretes, envio e recebimento de eventos do WhatsApp sob regras do backend; não equivale a uma conta administrativa aberta ao público.
Não haverá cadastro público de usuários administrativos, outros funcionários ou múltiplas profissionais na primeira versão.
3. Escopo funcional — requisitos funcionais (RF)
Prioridades: P0 = obrigatório para o núcleo; P1-WA = obrigatório no produto final, implementado na última fase por depender da Meta. Todos os itens abaixo fazem parte do escopo aprovado, salvo quando explicitamente indicados como futuros.
3.1 Site público e solicitações
ID	Prioridade	Requisito
RF-001	P0	Apresentar os serviços disponíveis para agendamento.
RF-002	P0	Exibir horários disponíveis somente após a escolha de um serviço, levando em conta sua duração.
RF-003	P0	Solicitar nome, telefone/WhatsApp, serviço, data e horário no formulário.
RF-004	P0	Impedir o envio de solicitações para horários passados ou com antecedência inferior a 24 horas.
RF-005	P0	Considerar horário de funcionamento, pausas, dias bloqueados e agendamentos confirmados ao oferecer horários.
RF-006	P0	Registrar novas solicitações como pendentes, sem bloquear a agenda oficial.
RF-007	P0	Permitir mais de uma solicitação pendente para o mesmo horário, informando que já há outras solicitações, sem garantir a reserva.
RF-008	P0	Apresentar confirmação de recebimento da solicitação, deixando claro que não é confirmação do atendimento.
RF-009	P0	Fornecer um link privado e não previsível para a cliente consultar o status e os dados básicos do pedido.
RF-010	P0	Permitir que a cliente solicite/cumpra o cancelamento pelo link privado conforme a antecedência definida; perto do horário, orientar contato com a profissional.
RF-011	P0	O WhatsApp de contato do salão poderá encaminhar a cliente ao link do formulário/agendamento; conversas comuns no WhatsApp não criarão agendamentos automaticamente.


3.2 Autenticação e acesso administrativo
ID	Prioridade	Requisito
RF-012	P0	Disponibilizar login por e-mail e senha.
RF-013	P0	Disponibilizar Entrar com Google, usando autenticação oficial e validada pelo backend.
RF-014	P0	Oferecer Esqueceu sua senha?, com redefinição por link enviado ao e-mail da conta local, token temporário e uso único.
RF-015	P0	Autorizar exclusivamente a conta administrativa previamente cadastrada; não criar administradoras automaticamente a partir do login Google.
RF-016	P0	Vincular os dois métodos de login à mesma identidade administrativa autorizada.
RF-017	P0	Permitir encerrar sessão; bloquear acesso às operações e aos dados administrativos quando não houver sessão válida.


3.3 Solicitações, agenda e atendimento
ID	Prioridade	Requisito
RF-018	P0	Mostrar no painel uma fila de novas solicitações e sua situação atual.
RF-019	P0	Permitir confirmar ou recusar solicitações, com histórico da decisão; ao confirmar uma solicitação, recusar automaticamente todas as outras solicitações pendentes com horários sobrepostos, registrando as recusas no histórico.
RF-020	P0	Exigir que a administradora tenha feito contato prévio com a cliente antes de confirmar; apresentar confirmação final explícita da ação.
RF-021	P0	Ao confirmar, validar novamente no backend a disponibilidade; impedir sobreposição de atendimentos considerando início e duração.
RF-022	P0	Permitir apenas um atendimento por vez, pois há uma única profissional.
RF-023	P0	Disponibilizar visualização de agenda por dia e navegação entre datas, com horários e atendimentos.
RF-024	P0	Permitir cadastrar manualmente atendimentos combinados por telefone, WhatsApp ou presencialmente, com as mesmas validações.
RF-025	P0	Permitir definir horários semanais de trabalho, pausas e dias/intervalos bloqueados.
RF-026	P0	Registrar e apresentar estados distintos: pendente, confirmado, concluído, cancelado, recusado e não compareceu.
RF-027	P0	Marcar automaticamente o atendimento como concluído após seu horário previsto de término, desde que permaneça confirmado; permitir à administradora corrigir o status para não compareceu, com registro no histórico. A conclusão automática não comprova presença nem registra pagamento.
RF-028	P0	Reagendar mediante cancelamento do agendamento antigo e criação de novo, preservando o histórico.
RF-029	P0	Registrar data, horário, serviço e preço do momento da solicitação/agendamento, para que alterações futuras da tabela não modifiquem o valor histórico.
RF-030	P0	Após aprovação, refletir o atendimento na agenda e no histórico mensal, independentemente do canal de aprovação.


3.4 Clientes e serviços
ID	Prioridade	Requisito
RF-031	P0	Cadastrar automaticamente uma cliente quando houver sua primeira solicitação; identificar possíveis cadastros existentes pelo telefone normalizado.
RF-032	P0	Manter para a cliente: nome, telefone e histórico de atendimentos.
RF-033	P0	Permitir à administradora consultar a lista de clientes e seu histórico.
RF-034	P0	Permitir cadastrar, editar e desativar serviços com nome, preço e duração.
RF-035	P0	Permitir somente um serviço por agendamento.
RF-036	P0	Utilizar o preço e a duração configurados no momento da solicitação; não alterar atendimentos históricos ao editar um serviço.


3.5 Financeiro e relatórios
ID	Prioridade	Requisito
RF-037	P0	Não cobrar pagamentos no site e não integrar gateway de pagamento. O recebimento é realizado diretamente pela profissional.
RF-038	P0	Mostrar, para cada atendimento, situação financeira Pago ou Pendente, independente do status do atendimento.
RF-039	P0	Permitir que a administradora registre manualmente o pagamento antes ou após o atendimento, incluindo valor, data efetiva e forma de recebimento: Pix, dinheiro, crédito ou débito.
RF-040	P0	Ao registrar um pagamento como recebido, gerar uma única entrada financeira correspondente; evitar duplicidade mesmo com cliques/requisições repetidas.
RF-041	P0	Permitir corrigir um lançamento feito por engano, preservando histórico de alteração e ajustando os totais sem apagamento indevido.
RF-042	P0	Permitir registrar reembolso/devolução mediante decisão manual da administradora, vinculando-o ao recebimento/atendimento original.
RF-043	P0	Permitir cadastrar despesas com descrição, valor, categoria e data.
RF-044	P0	Apresentar receitas, despesas, saldo/lucro operacional exibido conforme definições do documento de regras, e histórico mensal.
RF-045	P0	Apresentar relatórios de atendimentos, serviços mais vendidos e clientes frequentes.
RF-046	P0	Não implementar pagamentos parciais: o registro do atendimento terá somente Pago/Pendente; não haverá controle de parcelas ou saldos devedores parciais.


3.6 Painel e experiência da usuária
ID	Prioridade	Requisito
RF-047	P0	Após o login, abrir Dashboard com resumo do dia, próximas clientes e solicitações.
RF-048	P0	Disponibilizar seções: Dashboard, Solicitações, Agenda, Clientes, Financeiro, Serviços e Configurações.
RF-049	P0	Oferecer modo claro e modo escuro, com controle de alternância.
RF-050	P0	Funcionar adequadamente em computador e celular, sem priorizar um em detrimento do outro.
RF-051	P0	Mostrar notificações de novas solicitações dentro do painel administrativo.


3.7 WhatsApp e notificações — desenvolver por último
ID	Prioridade	Requisito
RF-052	P1-WA	Integrar a WhatsApp Cloud API oficial, sem exigir chatbot com inteligência artificial.
RF-053	P1-WA	Utilizar um número remetente dedicado à API (ainda não adquirido) para comunicações automáticas.
RF-054	P1-WA	Enviar alertas de solicitações ao WhatsApp Business atual da profissional; usar o WhatsApp pessoal existente para ela conversar com as clientes antes de aprovar.
RF-055	P1-WA	Incluir no alerta à administradora nome, telefone, serviço, data e horário, com opções Confirmar e Recusar quando tecnicamente habilitadas pelo canal.
RF-056	P1-WA	Ao pressionar Confirmar no WhatsApp, solicitar uma segunda confirmação. O Flask deve identificar a administradora, revalidar o horário e só então confirmar no banco.
RF-057	P1-WA	Após confirmação da administradora, enviar à cliente uma mensagem automática com serviço, data e horário confirmados.
RF-058	P1-WA	Enviar à cliente, pelo WhatsApp, aviso automático quando o pedido for recusado ou o atendimento cancelado, conforme situação e consentimento.
RF-059	P1-WA	Agendar um lembrete 24 horas antes do atendimento confirmado; caso a confirmação ocorra com menos de 24 horas restantes, enviar o lembrete após a confirmação, sem duplicá-lo.
RF-060	P1-WA	Incluir no lembrete a identificação do serviço, data e horário e a possibilidade de solicitar cancelamento.
RF-061	P1-WA	Aceitar cancelamento automático pela cliente apenas com antecedência mínima de 24 horas; com menos de 24 horas, orientar contato com a profissional, sem cancelar automaticamente.
RF-062	P1-WA	Notificar a administradora quando uma cliente cancelar e manter o painel sincronizado com a mesma fonte de dados.
RF-063	P1-WA	Registrar tentativas de envio, resultado/erro e impedir mensagens de confirmação/lembrete duplicadas por reprocessamento de eventos.
RF-064	P1-WA	Solicitar consentimento adequado no formulário para comunicações por WhatsApp e observar regras, janelas e modelos de mensagens aprovados pela Meta.


Notas de processo do WhatsApp: o backend é único; haverá dois fluxos de automação (administradora e clientes), não dois backends ou dois bancos. As ações devem funcionar também pelo painel, enquanto a integração da Meta ainda estiver pendente. O sistema não pode exigir que a profissional execute uma ação de segurança apenas com base em um número de telefone exibido no texto da mensagem.
4. Requisitos não funcionais (RNF)
ID	Categoria	Requisito
RNF-001	Segurança	Todas as operações administrativas precisam de autenticação e autorização no Flask, não apenas de ProtectedRoute no React.
RNF-002	Segurança	Armazenar senhas apenas como hash com algoritmo próprio para senhas; nunca em texto puro ou reversível.
RNF-003	Segurança	Usar sessões com cookies HttpOnly, Secure em produção, política SameSite adequada e proteção CSRF nas requisições relevantes.
RNF-004	Segurança	Verificar corretamente os tokens do login Google e vincular o identificador da conta à única administradora autorizada.
RNF-005	Segurança	Tokens de redefinição de senha devem ter validade limitada, uso único, armazenamento protegido e resposta que não revele se um e-mail existe.
RNF-006	Segurança	Limitar tentativas abusivas de login, recuperação de senha, criação de solicitações e acesso por links; validar dados no servidor.
RNF-007	Segurança	Links privados de consulta não devem ser sequenciais/previsíveis, não devem expor dados de outras clientes e precisam permitir expiração/revogação adequada.
RNF-008	Segurança	Validar origem/autenticidade dos webhooks e identidade da administradora nas respostas do WhatsApp; ações interativas devem ser idempotentes.
RNF-009	Integridade	Confirmação de horários e registro de recebimento devem usar operações atômicas/controles de concorrência no banco.
RNF-010	Integridade	Preservar histórico de mudanças de status, reagendamento, pagamentos, reembolsos e correções administrativas.
RNF-011	Disponibilidade	O agendador de lembretes deve executar no servidor, sem depender de o navegador/painel estar aberto.
RNF-012	Fuso horário	Interpretar e exibir agendamentos no fuso America/Sao_Paulo, tratando datas e horários de forma consistente entre navegador, backend e banco.
RNF-013	UX	Interfaces responsivas, legíveis, acessíveis por teclado, com estados de carregamento, erro, sucesso e confirmação de ações críticas.
RNF-014	Privacidade	Coletar somente dados necessários; limitar acesso a informações de clientes e prever política de retenção/exclusão conforme legislação aplicável (LGPD).
RNF-015	Operação	Manter credenciais e segredos fora do código versionado; registrar erros sem expor dados pessoais ou tokens.
RNF-016	Confiabilidade	Prever backup e procedimento de restauração do banco, além de monitorar falhas de envios e tarefas programadas.
RNF-017	Organização	Preservar frontend/, paineladm/, backend/ e docs/; evitar serviços, dependências ou camadas extras sem necessidade demonstrada.
RNF-018	Custos	Priorizar hospedagem e serviços de baixo custo, registrando separadamente eventuais cobranças de mensagens WhatsApp, domínio, e-mails e infraestrutura.


5. Regras de negócio resumidas — a detalhar em REGRAS_NEGOCIO.md
Estas regras são decisões já aprovadas. O próximo documento detalhará transições de estado, exceções e cenários concorrentes sem mudar o escopo aprovado.
- RN-001: nova solicitação não equivale a reserva; apenas atendimento confirmado ocupa o horário.
- RN-002: o período ocupado é determinado pelo início e duração do serviço; duas confirmações não podem se sobrepor para a única profissional.
- RN-003: solicitações do público devem ter antecedência de pelo menos 24 horas.
- RN-004: a profissional deve conversar com a cliente antes de confirmar; no WhatsApp, a confirmação ocorre em duas etapas.
- RN-005: cliente pode cancelar automaticamente com 24 horas ou mais de antecedência; com menos tempo, deve contatar a profissional.
- RN-006: um agendamento possui um serviço. Alterar o preço do catálogo não altera o valor histórico já registrado.
- RN-007: reagendar significa cancelar o registro anterior e criar novo, mantendo rastreabilidade.
- RN-008: status de atendimento e status de pagamento são independentes.
- RN-009: receita é registrada ao efetivar recebimento manual, não ao aprovar o agendamento; o mesmo recebimento não pode gerar duas entradas.
- RN-010: pagamentos parciais e cobrança online estão fora do escopo.
- RN-011: desistência antecipada e falta sem aviso são eventos diferentes; falta é marcada pela profissional.
- RN-012: não enviar lembrete de atendimento cancelado, recusado, concluído ou já ocorrido; somente uma execução válida por lembrete programado.
- RN-013: o botão de cancelar do WhatsApp e o link privado devem aplicar a mesma política de cancelamento.
- RN-014: canais de aprovação (painel/WhatsApp) devem executar a mesma operação de negócio no Flask, com checagem de permissão e disponibilidade no momento da gravação.
6. Fluxos de alto nível
6.1 Solicitação → confirmação → atendimento
1. Cliente escolhe serviço e visualiza os horários disponíveis; seleciona horário com 24h ou mais de antecedência.
2. Informa nome e telefone, aceita os termos pertinentes e envia o formulário.
3. Backend valida dados e registra solicitação pendente, devolvendo confirmação de recebimento e link privado.
4. Solicitação aparece no painel; quando a integração estiver habilitada, também chega ao WhatsApp Business da profissional.
5. Profissional conversa com a cliente pelo WhatsApp pessoal e aprova pelo painel ou, futuramente, pelo alerta com dupla confirmação.
6. Backend verifica novamente possíveis conflitos e confirma somente se o intervalo estiver livre.
7. Cliente recebe confirmação automática pelo WhatsApp na fase de integração; antes disso, a profissional fará comunicação manual.
8. Um lembrete é disparado 24h antes (ou imediatamente após confirmação tardia, respeitando as regras).
9. Profissional registra atendimento concluído ou não comparecimento e o pagamento recebido, quando ocorrer.
6.2 Financeiro
1. Atendimento nasce financeiramente Pendente, mesmo que confirmado na agenda.
2. Sua mãe recebe o pagamento diretamente (Pix, dinheiro, crédito ou débito) e registra manualmente o recebimento, antes ou depois do atendimento.
3. Backend grava pagamento e uma única entrada com a data efetiva de recebimento.
4. O dashboard atualiza total de entradas, despesas e saldo; correções e devoluções são registradas com histórico.
5. Sem pagamentos parciais, carrinho, checkout, links de cobrança ou integração com maquininhas.
6.3 Cancelamento
1. Cliente acessa o link privado ou o botão de cancelamento no WhatsApp.
2. Backend verifica identidade da solicitação/ação, estado atual e antecedência.
3. Com 24h ou mais: registra cancelamento, libera o horário e informa a profissional.
4. Com menos de 24h: não cancela automaticamente; orienta contato direto com a profissional.
5. Se já existir pagamento recebido, não apagar a receita; devolução é ação manual e auditável.
7. Critérios de aceitação e cenários mínimos de teste
ID	Cenário	Resultado esperado
CA-001	Duas clientes solicitam o mesmo horário	Ambas pendentes; o horário é apresentado como tendo solicitações existentes.
CA-002	Admin confirma a primeira e tenta confirmar a segunda em horário sobreposto	Segunda confirmação é rejeitada pela API, sem duplicidade no banco.
CA-003	Serviço de 90 min iniciado às 14h; outro pedido às 15h	Não permitir os dois confirmados simultaneamente.
CA-004	Cliente solicita para menos de 24h	Backend impede o envio, mesmo se interface falhar.
CA-005	Admin altera preço de um serviço já agendado	Agendamentos anteriores mantêm valor histórico; novas solicitações usam preço vigente.
CA-006	Admin registra pagamento e clica novamente	Um único recebimento/lançamento financeiro é criado.
CA-007	Admin corrige pagamento incorreto	Totais ajustados; mudança auditável.
CA-008	Cliente paga antecipadamente e cancela	Receita original preservada; eventual reembolso precisa de registro separado.
CA-009	Cliente cancela 25h antes	Cancelamento automático permitido, horário liberado.
CA-010	Cliente tenta cancelar 23h antes	Cancelamento automático negado; orientar contato.
CA-011	Visitante tenta abrir rota privada do painel ou chamar API administrativa	Acesso negado sem sessão autorizada.
CA-012	Conta Google não autorizada tenta autenticar	Não ganha acesso nem cria admin automaticamente.
CA-013	Link de recuperação expirado ou já utilizado	Não permite trocar a senha.
CA-014	Webhook do WhatsApp é repetido	Nenhum atendimento, recebimento ou lembrete duplicado.
CA-015	Profissional confirma pelo WhatsApp, mas horário acaba de ficar indisponível	Backend recusa confirmação e retorna aviso apropriado.
CA-016	Atendimento foi cancelado depois de agendar lembrete	Lembrete não é enviado.
CA-017	Profissional confirma horário que ocorrerá em menos de 24h	Um lembrete é enviado após confirmação (quando integração ativa), sem duplicação.
CA-018	Admin acessa pelo celular e computador	Agenda e dashboard permanecem funcionais e adaptados ao tamanho de tela.
CA-019	Nova solicitação chega enquanto integração WhatsApp ainda não está pronta	Solicitação continua acessível e operável pelo painel.
CA-020	Cliente tenta ver agendamento alheio sem link válido	Dados não são expostos.


8. Planejamento de implementação e dependências
A ordem abaixo é a sequência de implementação, não uma alteração do escopo do produto final.
Fase	Conteúdo	Condição de conclusão
0. Documentação	Alinhar REQUISITOS.md, REGRAS_NEGOCIO.md, SEGURANCA.md, ARQUITETURA.md, BANCO_DE_DADOS.md, API.md e checklist	Documentos coerentes, decisões pendentes registradas
1. Base segura	Banco, autenticação local/Google, recuperação de senha, sessão e APIs protegidas	Login autorizado e recuperação testados
2. Operação principal	Serviços, clientes, solicitações, disponibilidade, agenda, validação concorrente, dashboard e notificações internas	Fluxo completo operável sem WhatsApp API
3. Financeiro	Recebimentos, despesas, reembolsos, histórico, relatórios	Entradas íntegras e relatórios testados
4. Integração WhatsApp — última	Número dedicado, Meta/Cloud API, modelos aprovados, webhooks, alertas, botões, confirmação e lembretes	Automações aprovadas, observáveis e testadas


Dependências externas a validar: aquisição e habilitação de terceiro número; requisitos da conta Meta Business, limites e aprovação de templates; custos de mensagens; provedor de e-mail com autenticação de domínio para redefinição de senha; serviço de hospedagem capaz de executar a API e tarefas agendadas; backup; domínio e DNS. Nenhum preço, provedor ou prazo de aprovação da Meta está garantido neste documento.

Decisão operacional: até a fase 4, a profissional deve poder receber, aprovar, recusar e consultar solicitações pelo painel e conversar manualmente com as clientes. A ausência temporária da integração WhatsApp não pode bloquear o núcleo do sistema.
9. Fora do escopo e melhorias futuras
Não implementar na primeira versão: pagamentos online/gateways; pagamentos parciais; cadastro público do painel; múltiplas administradoras/profissionais; criação automática de solicitações por chatbot de WhatsApp; atendimento por IA generativa/Google AI Studio; estoque de produtos; chatbot com respostas livres; alteração automática de horário por cliente; autenticação de dois fatores (poderá ser adicionada depois).

Podem ser avaliados futuramente: autenticação em duas etapas; chatbot de IA, se houver benefício real; recursos avançados de relatórios e gráficos, escolhendo biblioteca somente quando necessário; expansão para múltiplos profissionais.
10. Pontos que os próximos documentos devem detalhar — sem inventar decisões
Estes pontos não impedem registrar o escopo, mas deverão ser resolvidos antes de codificar as respectivas regras:
1. REGRAS_NEGOCIO.md: transições permitidas entre estados (incluindo recusa, cancelamento, conclusão, falta), efeitos de cancelamento após pagamento, cálculo dos indicadores de serviços mais vendidos/clientes frequentes, arredondamento de horários e tratamento de mudança de jornada.
2. BANCO_DE_DADOS.md: modelo relacional, integridade contra sobreposição, relacionamento cliente/solicitação/agendamento, preços históricos, registros financeiros e trilha de auditoria.
3. SEGURANCA.md: política de sessão, CSRF, OAuth/OIDC, vinculação dos dois logins à mesma conta, recuperação de senha, proteção de links privados e verificação de webhook.
4. API.md: contratos, erros, idempotência, endpoints de agendamento, operações financeiras e recebimento de eventos.
5. ARQUITETURA.md: hospedagem econômica, configuração dos domínios, processamento confiável de lembretes, observabilidade e responsabilidades dos três aplicativos.
6. Experiência/consentimento: texto de consentimento para WhatsApp, período de retenção de dados e prazo de validade dos links privados serão formalizados sem presumir opções não aprovadas.
11. Instruções de uso para assistentes de programação
- Este documento registra o que o produto deve entregar. Não adicione telas, serviços, tabelas ou ferramentas apenas porque parecem interessantes.
- Antes de implementar, consultar os demais documentos em docs/ e verificar coerência com os requisitos identificados por RF, RNF, RN e CA.
- Se houver conflito entre documentos ou um requisito não tiver regra suficientemente definida, sinalizar a pendência em vez de inventar a decisão.
- Priorizar a integridade de agendamento e financeiro, a autenticação de uma única administradora e a privacidade das clientes.
- Não iniciar a integração do WhatsApp até a fase final expressamente autorizada; não bloquear as funções básicas por causa dela.
- Não codificar com base apenas neste arquivo: primeiro finalizar e revisar os documentos restantes.