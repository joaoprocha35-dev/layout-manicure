REGRAS DE NEGÓCIO — Sistema Manicure Vilma
Documento: docs/REGRAS_NEGOCIO.md
Versão: 1.0 — 15/11/2026
Status: proposta consolidada para revisão; não autoriza implementação.
Fontes de decisão: levantamento de requisitos com o responsável pelo projeto, incluindo as dez respostas finais de 15/11/2026; cotejado com REQUISITOS.md v1.0 disponível nesta conversa.
Escopo: regras da operação; contratos de API, desenho de tabelas, segurança detalhada e infraestrutura serão especificados nos respectivos documentos, sem criar requisitos novos neste arquivo.

1. Objetivo e princípios
O sistema permite que clientes solicitem horários no site público, mas apenas a profissional Vilma confirme atendimentos. Uma confirmação precisa respeitar a disponibilidade real de uma única profissional e a duração do serviço. O mesmo backend Flask é a autoridade para operações realizadas pelo painel ou, na última fase do projeto, por mensagens interativas do WhatsApp. O PostgreSQL registra os estados e históricos.

Princípios não negociáveis:
1. Solicitação não é reserva. Status PENDENTE não ocupa horário; CONFIRMADO ocupa.
2. Somente uma profissional. Agendamentos confirmados não podem ter períodos sobrepostos.
3. Uma cliente, um serviço por solicitação, com preço e duração históricos preservados.
4. O backend decide. Interface e WhatsApp não podem aprovar, cancelar ou registrar recebimentos sem validação no servidor.
5. Atendimento e pagamento têm estados independentes. Confirmar ou concluir não equivale a receber.
6. Toda alteração relevante deixa histórico. Não apagar informações para mascarar correções.
7. WhatsApp é última fase. Os fluxos administrativos funcionarão pelo painel antes da aprovação/integração Meta.
1.1 Vocabulário
Termo	Significado
Cliente	Pessoa identificada no cadastro, inicialmente por nome e telefone normalizado.
Solicitação	Pedido de data, início e serviço; nasce PENDENTE.
Agendamento confirmado	Solicitação aprovada e registrada na agenda; ocupa intervalo de tempo.
Atendimento	Execução do serviço agendado, com resultado CONCLUIDO ou NAO_COMPARECEU, entre outros estados.
Link público	Página comum de solicitação, por exemplo /agendar, que a proprietária pode compartilhar.
Link privado	URL única associada a uma solicitação específica, para visualizar seu status e solicitar cancelamento. Não concede acesso administrativo.
Entrada financeira	Registro de dinheiro efetivamente recebido, lançado manualmente pela profissional.
Histórico	Registro de eventos e mudanças com data, origem, responsável e estado anterior/novo, quando aplicável.


2. Clientes e identidade
RN-001 — Cadastro automático e identificação
- Ao receber solicitação pública válida, normalizar o telefone informado e procurar um cadastro existente.
- Se já existir cliente com esse telefone, associar a solicitação à cliente existente; caso contrário, cadastrar com nome e telefone.
- O cadastro ocorre mesmo que a solicitação ainda esteja pendente ou seja recusada depois.
- Variações de formatação do mesmo telefone não devem criar duas clientes. O backend deve tratar concorrência para evitar duplicatas.
- O histórico do cliente reúne solicitações e atendimentos, inclusive cancelamentos, recusas e faltas; não deve ser limitado somente a serviços realizados.
- Não há cadastro público de usuárias do painel. A cliente não cria senha para consultar seu pedido.
RN-002 — Múltiplas solicitações da mesma cliente
- Uma mesma cliente pode ter várias solicitações, desde que para datas e horários diferentes.
- Uma solicitação corresponde a um serviço, uma data e um horário de início.
- Caso a mesma cliente tente cadastrar solicitações duplicadas para o mesmo serviço, data e horário, o sistema deve orientar a consultar a solicitação já existente, em vez de criar duplicatas. Regra operacional proposta para evitar envios repetidos; validar na revisão final se for necessário permitir pedidos idênticos.
3. Serviços, jornada e disponibilidade
RN-003 — Cadastro de serviços
- A administradora cadastra, edita e desativa serviços informando nome, preço e duração.
- Apenas serviços ativos podem ser selecionados em novas solicitações públicas.
- Desativar serviço não cancela, reprecifica ou invalida solicitações/agendamentos já registrados.
- A versão do preço e da duração aplicáveis à solicitação deve permanecer associada ao pedido, mesmo quando o catálogo for atualizado posteriormente.
RN-004 — Jornada da profissional
- Vilma atende uma cliente por vez.
- A disponibilidade considera horários semanais configurados, pausas e intervalos/dias bloqueados.
- A duração completa do serviço deve caber no período de trabalho e não invadir pausas, bloqueios nem agendamentos confirmados.
- Mudanças posteriores na jornada não modificam silenciosamente agendamentos já confirmados; conflitos decorrentes dessas mudanças devem ser destacados para resolução administrativa.
RN-005 — Períodos que se sobrepõem
- O intervalo ocupado é [início, início + duração): inclui o instante inicial e exclui o instante final.
- Dois atendimentos confirmados conflitam quando inicio_A < fim_B e inicio_B < fim_A.
- Exemplo: serviço confirmado das 14h às 15h30 impede outro das 15h às 16h, mas permite atendimento iniciando às 15h30, se a jornada permitir.
- A confirmação exige nova validação de disponibilidade em operação atômica, resistente a acessos simultâneos; não basta confiar no calendário exibido anteriormente.
RN-006 — Exibição de horários para clientes
- A cliente escolhe primeiro o serviço; só então vê horários candidatos compatíveis com sua duração.
- Intervalos com solicitação pendente continuam podendo ser solicitados, mas devem indicar que já existem outras solicitações para aquele período.
- Intervalos ocupados por agendamentos confirmados não podem aparecer como disponíveis para nova confirmação.
- A interface deve explicar que o pedido enviado aguarda aprovação, mesmo se o horário parecia livre.
RN-007 — Antecedência mínima
- Solicitações feitas pelo site público somente são aceitas se o início estiver a pelo menos 24 horas do instante de envio, inclusive no limite exato de 24 horas.
- Solicitações no passado, fora da jornada ou incompatíveis com a duração são rejeitadas.
- O backend verifica a regra novamente ao gravar o pedido; não depende apenas do JavaScript do navegador.
- Cadastro manual pela administradora: pode ser confirmado diretamente, inclusive para atendimento no mesmo dia, desde que horário/duração/jornada sejam válidos. Essa exceção é administrativa, pois a restrição de 24 horas foi definida para solicitações das clientes.
4. Solicitações, confirmação e concorrência
RN-008 — Criação e duração da pendência
- Nova solicitação válida nasce com status PENDENTE e não reserva o intervalo.
- O pedido permanece pendente até decisão da administradora: aprovação ou recusa; não existe expiração automática de 24 horas.
- Se o horário solicitado passar sem decisão, não é permitido confirmar retroativamente um atendimento. O registro permanece auditável e deve ser sinalizado como pendência vencida para decisão da profissional, sem alterar o estado automaticamente.
- A cliente recebe confirmação do recebimento da solicitação, nunca promessa de atendimento.
RN-009 — Confirmação pela administradora
- Contato prévio é obrigatório: antes de aprovar, Vilma deve conversar com a cliente e confirmar os dados/horário.
- No painel, a ação de confirmação deve exigir uma etapa explícita de revisão; no WhatsApp, dois passos, com uma segunda confirmação.
- No momento da gravação, o backend autentica a administradora, confere o status PENDENTE, verifica se serviço/horário continuam válidos e impede qualquer sobreposição.
- Somente depois do sucesso a solicitação passa a CONFIRMADO, ocupa a agenda e aparece no histórico mensal.
- Se ocorrer falha de validação ou corrida por horário, a operação não deve salvar confirmação parcial; a administradora recebe mensagem clara do motivo.
RN-010 — Recusa automática de solicitações concorrentes
- Nova decisão aprovada: quando uma solicitação é confirmada, todas as outras solicitações ainda pendentes cujos intervalos se sobreponham ao intervalo confirmado devem ser automaticamente recusadas.
- Essa regra vale para a mesma hora e para sobreposições parciais, considerando a duração de cada serviço, independentemente de serem clientes diferentes.
- Solicitações em horários não conflitantes permanecem pendentes.
- Cada recusa automática registra motivo CONFLITO_COM_HORARIO_CONFIRMADO e vínculo com a confirmação que a motivou.
- A confirmação principal e a atualização das solicitações concorrentes precisam ser coordenadas de forma consistente, evitando que duas aprovações paralelas acabem confirmadas.
- Na fase WhatsApp, as clientes afetadas são avisadas automaticamente usando os modelos de mensagem permitidos; antes da integração, o painel identifica quem precisa ser avisada manualmente.
RN-011 — Recusa manual
- Apenas a administradora pode recusar uma solicitação pendente manualmente.
- A recusa preserva o histórico e não ocupa horário.
- A cliente poderá escolher outro horário criando uma nova solicitação; a recusada não será reativada/editada para representar outro atendimento.
RN-012 — Cadastro administrativo direto
- A administradora pode cadastrar cliente e atendimento combinado pessoalmente, por telefone ou WhatsApp.
- Nesse fluxo é permitido confirmar imediatamente, sem passar pela fila pública de solicitações.
- Mesmo assim são obrigatórios serviço, data, horário, duração, cliente e validação de disponibilidade/conflito.
- A mesma operação de validação deve ser usada independentemente da origem do agendamento.
5. Estados do atendimento e transições
RN-013 — Estados oficiais
Estado	Significado	Ocupa horário?
PENDENTE	Solicitação ainda não aprovada	Não
CONFIRMADO	Atendimento aceito e reservado	Sim, até ser finalizado/cancelado
RECUSADO	Solicitação não aceita	Não
CANCELADO	Solicitação/agendamento retirado	Não
CONCLUIDO	Atendimento encerrado como realizado	Histórico; não cria nova reserva futura
NAO_COMPARECEU	Cliente faltou, decisão registrada por Vilma	Histórico; não cria nova reserva futura


RN-014 — Mudanças de estado permitidas
Origem	Destino	Quem/como	Condição
PENDENTE	CONFIRMADO	Administradora, painel/WhatsApp	Contato prévio + segunda validação + horário livre
PENDENTE	RECUSADO	Administradora ou recusa automática por conflito	Justificativa/origem registradas
PENDENTE	CANCELADO	Cliente com link válido ou administradora	Pedido ainda não aceito; sem reserva a liberar
CONFIRMADO	CANCELADO	Cliente dentro do prazo ou administradora	Respeitar regra de cancelamento e registrar origem
CONFIRMADO	CONCLUIDO	Automação de encerramento programado	Chegou o término previsto sem cancelamento/falta registrados
CONFIRMADO ou CONCLUIDO	NAO_COMPARECEU	Administradora	Registro explícito da falta, com histórico de correção se houve conclusão automática


- RECUSADO, CANCELADO e NAO_COMPARECEU não retornam diretamente a PENDENTE ou CONFIRMADO: para reagendar, criar novo registro.
- Mudanças fora da tabela devem ser rejeitadas; retentativas idênticas não criam eventos duplicados.
- Em especial, concluir automaticamente não prova comparecimento. A administradora pode corrigir para NAO_COMPARECEU quando identificar uma falta; a correção deve ser auditada.
RN-015 — Conclusão automática (última decisão da proprietária)
- Mudança em relação ao REQUISITOS.md v1.0: o atendimento deverá passar automaticamente de CONFIRMADO para CONCLUIDO após o horário previsto de término, caso não tenha sido cancelado ou marcado como falta.
- A automação deve executar no backend/serviço de tarefas, mesmo com o painel fechado, e revalidar status e horário ao processar.
- O sistema não deve marcar PAGO automaticamente ao concluir, nem inferir que a cliente efetivamente compareceu.
- A administradora ainda terá a opção de corrigir uma conclusão automática caso identifique não comparecimento; a correção fica no histórico.
- Pendência de harmonização documental: REQUISITOS.md RF-027 ainda descreve conclusão manual. Atualizar o requisito somente quando houver autorização para editar aquele arquivo, sem modificar agora o arquivo existente.
6. Cancelamentos, reagendamento e links
RN-016 — Cancelamento pela cliente
- Com 24 horas ou mais de antecedência do horário marcado, a cliente pode cancelar automaticamente sua solicitação/agendamento pelo link privado ou, na última fase, pelo botão do WhatsApp.
- Com menos de 24 horas, o sistema não cancela automaticamente um atendimento confirmado; informa que é necessário falar com Vilma.
- Cancelamento de solicitação ainda pendente não exige liberar reserva e pode ser feito pelo link enquanto a solicitação estiver vigente.
- Cancelamento deve registrar data, origem e situação anterior; no caso de atendimento confirmado, liberar o horário.
- Eventos duplicados ou repetidos de cancelamento não produzem mudanças adicionais.
RN-017 — Cancelamento pela administradora
- Vilma pode cancelar agendamento confirmado ou solicitação pendente com registro de origem e motivo.
- Se o atendimento já estiver CONCLUIDO/`NAO_COMPARECEU`, não apagar o passado: qualquer ajuste excepcional deverá ser registrado como correção administrativa auditável, a detalhar no documento de API/segurança.
- Na última fase, cancelamentos administrativos geram aviso automático à cliente no WhatsApp; antes disso, o painel destaca a necessidade de contato manual.
RN-018 — Reagendamento
- Reagendar significa cancelar a solicitação/agendamento anterior e criar outro com nova data/hora, preservando ligação entre registros no histórico.
- O novo agendamento deve passar por validação completa de disponibilidade.
- Se o anterior tiver pagamento associado, não transferir ou apagar receita automaticamente; a profissional precisa tomar e registrar a decisão financeira adequada.
RN-019 — Link exclusivo por solicitação
- Cada solicitação, inclusive de cliente já cadastrada, gera um novo link privado com identificador aleatório e não previsível; o código não pode ser o ID sequencial simples.
- O link é associado a uma solicitação, e não a toda a conta ou histórico da cliente.
- Na página privada a pessoa vê somente dados mínimos daquela solicitação (serviço, data, horário, status e ações permitidas). Não vê dados da agenda geral, informações de terceiros ou área administrativa.
- O painel, na lista/histórico de solicitações, mostra o nome da cliente, dados do pedido e opção de copiar/compartilhar o link pelo WhatsApp.
- Acesso por posse do link não equivale a prova forte de identidade. O sistema deve prever revogação do link e proteção contra tentativa de adivinhação/abuso; segredos não devem aparecer em logs públicos.
- Se o link for revogado, não permite mais consulta/cancelamento; uma substituição segura deverá poder ser gerada pela administradora.
- As regras de cancelamento são idênticas independentemente de a ação partir do site ou do WhatsApp.
7. Financeiro
RN-020 — Pagamentos independentes de atendimento
- Todo novo agendamento nasce com situação financeira PENDENTE, mesmo depois de confirmado.
- A administradora registra manualmente pagamentos já recebidos antes ou depois do atendimento, indicando data do recebimento, valor e meio: Pix, dinheiro, crédito ou débito.
- Não haverá cobrança pelo site, gateway de pagamento, cobrança por chatbot nem pagamentos parciais.
- O botão PAGO apenas registra um recebimento real confirmado pela profissional; a aprovação do atendimento, a conclusão automática e o clique em lembrete não geram receita.
RN-021 — Receita única e integridade
- Ao marcar PAGO, criar uma única entrada financeira associada ao agendamento/recebimento, com valor e data efetivamente recebidos.
- Cliques repetidos, requisições concorrentes e reprocessamento de eventos não podem criar duas entradas para o mesmo recebimento.
- O sistema deve registrar a autoria/data do lançamento e manter a associação entre atendimento e entrada financeira.
RN-022 — Correções de pagamento
- Se a profissional marcar PAGO por engano, poderá corrigir a informação sem excluir o histórico.
- Os totais do financeiro devem refletir a correção; a operação deve registrar motivo, estado anterior, novo estado e data.
- Não confundir corrigir um erro com registrar uma devolução efetivamente realizada.
RN-023 — Cancelamento, falta e reembolso
- Cancelar, recusar, concluir ou marcar NAO_COMPARECEU não apaga automaticamente dinheiro já recebido.
- Se a cliente pagou e cancelou ou não compareceu, Vilma decide se realizará reembolso e o registra manualmente.
- O reembolso deve estar associado à entrada original e aparecer corretamente nos totais, sem apagar a entrada histórica.
- Um atendimento pode estar CANCELADO ou NAO_COMPARECEU e ter um recebimento registrado; são dimensões diferentes.
RN-024 — Despesas e indicadores
- Despesas são cadastradas pela profissional com descrição, valor, categoria e data.
- Resumo mensal: entradas efetivas menos despesas e devoluções efetivas constitui o saldo operacional exibido; evitar apresentar esse cálculo como lucro contábil líquido se não houver outros custos/impostos modelados.
- Serviços mais vendidos: classificação por quantidade de atendimentos concluídos no período, sem contar cancelados, recusados e faltas.
- Clientes frequentes: classificação por quantidade de atendimentos concluídos no período.
- Valores financeiros consideram a data do recebimento/despesa/reembolso, enquanto indicadores operacionais consideram a data do atendimento; a interface deve rotular os períodos claramente.
- Critérios operacionais sugeridos para consistência: os indicadores usam atendimentos concluídos, não meras solicitações; confirmar essa definição na revisão final dos relatórios, se desejar outra métrica.
8. Notificações e WhatsApp — última fase
RN-025 — Operação sem integração Meta
- Solicitações e decisões devem aparecer e funcionar no painel independentemente do WhatsApp.
- Até a integração Meta estar pronta, Vilma entra em contato manualmente com as clientes. Não prometer notificações automáticas enquanto a integração não estiver ativa.
RN-026 — Integração única, fluxos distintos
- Um backend Flask atende dois fluxos via WhatsApp Cloud API: alertar a administradora e informar a cliente.
- Configuração desejada: um terceiro número dedicado à API, ainda a providenciar; o WhatsApp Business atual de Vilma recebe alertas; o WhatsApp pessoal é usado para conversar com as clientes antes da decisão.
- Os alertas devem incluir nome, telefone, serviço, data e horário; quando tecnicamente habilitado, oferecer botões Confirmar e Recusar.
- A confirmação iniciada por botão exige segunda confirmação e passagem pela mesma verificação de autorização, estado e disponibilidade do painel.
- O número remetente API e o destinatário de alertas precisam ser configurados e validados; disponibilidade, custos e modelos de mensagem dependem das regras da Meta.
RN-027 — Mensagens da cliente
- Após confirmação, enviar mensagem automática com serviço, data e horário.
- Após recusa/cancelamento, enviar aviso apropriado com orientação para novo pedido/contato, conforme o caso.
- Enviar um lembrete 24 horas antes do agendamento confirmado; se a confirmação ocorrer quando faltarem menos de 24 horas, enviar o lembrete após a confirmação, sem duplicação.
- Não enviar lembrete de atendimento cancelado, recusado, finalizado, registrado como falta ou com horário passado.
- O lembrete poderá oferecer ação de cancelamento, aplicando a mesma política da RN-016.
- Para mensagens iniciadas pela empresa, utilizar apenas fluxos/modelos aprovados e consentimento necessário; registrar tentativas, sucesso/falha e identificadores de entrega para reduzir duplicações.
- Dependência externa: se alguma categoria/modelo ou botão não for aprovado pela Meta, o sistema deverá manter o fluxo manual/painel, sem simular envio bem-sucedido.
9. Autenticação, autoridade e privacidade (regras de negócio)
RN-028 — Uma única conta administrativa
- Somente Vilma pode administrar dados e horários.
- A tela de login oferecerá e-mail/senha e Google, vinculados à mesma conta autorizada, sem registro público de administradores.
- Recuperação de senha local por e-mail usa link de uso único e validade limitada; não afeta a senha da conta Google.
- Sessão/CSRF, armazenamento de senhas, autorização em cada rota, vinculação segura do login Google, proteção de links e assinatura dos webhooks serão definidos detalhadamente em SEGURANCA.md.
- O sistema não deve revelar dados de outras clientes nem permitir que um número de telefone enviado no formulário conceda acesso administrativo.
RN-029 — Origem das ações e histórico
- Registrar para eventos importantes: qual solicitação/agendamento foi afetado, estado anterior e novo, data/hora e origem (PAINEL, WHATSAPP, CLIENTE_LINK, AUTOMACAO).
- Identificar a administradora nas ações administrativas e guardar motivo quando houver recusa, cancelamento especial, correção financeira ou correção de falta.
- Processamentos repetidos de callbacks, tarefas ou chamadas de rede devem ser idempotentes.
- Horários da operação devem ser interpretados para o salão em America/Sao_Paulo.
10. Cenários de validação (critérios de aceite)
ID	Cenário	Resultado esperado
CN-001	Primeira solicitação com telefone ainda não cadastrado	Cliente criada e solicitação PENDENTE, sem ocupar a agenda.
CN-002	Nova solicitação com o mesmo telefone normalizado	Reutiliza cliente, acrescenta novo registro ao histórico.
CN-003	Duas clientes solicitam períodos iguais	Ambas ficam pendentes; interface avisa que há disputa.
CN-004	Administradora confirma uma delas após contato prévio	Confirma uma; recusa automaticamente todas as pendentes sobrepostas, com histórico.
CN-005	Serviços de 90 e 60 minutos com sobreposição parcial	Apenas um pode ficar confirmado, mesmo com aprovações simultâneas.
CN-006	Solicitação enviada exatamente 24 horas antes	Permitida, se horário e serviço estiverem disponíveis.
CN-007	Solicitação enviada 23h59 antes	Rejeitada pelo backend.
CN-008	Solicitação pendente permanece sem resposta após 24h	Não expira automaticamente; fica sinalizada se o horário passar.
CN-009	Serviço é desativado	Não aparece para novas solicitações; pedidos antigos permanecem válidos.
CN-010	Administradora cadastra atendimento para hoje	Pode confirmar diretamente se não houver conflito.
CN-011	Término previsto chega e atendimento ainda está confirmado	Backend marca CONCLUIDO automaticamente, sem marcar PAGO.
CN-012	Cliente faltou mas já foi concluída automaticamente	Administradora corrige para NAO_COMPARECEU, preservando mudança anterior.
CN-013	Cliente cancela 25 horas antes	Cancela e libera horário, com registro de origem.
CN-014	Cliente tenta cancelar 23 horas antes	Não cancela automaticamente; orienta contato com Vilma.
CN-015	Reagendamento	Registro antigo cancelado; novo registro validado; histórico preservado.
CN-016	Link privado de outra solicitação é desconhecido	Não há acesso por IDs sequenciais ou listagem de terceiros.
CN-017	Link privado é revogado	Consulta/cancelamento pelo link antigo negados.
CN-018	Agendamento é confirmado sem pagamento	Agenda ocupada; financeiro permanece PENDENTE.
CN-019	Pagamento é registrado duas vezes	Existe uma entrada financeira válida, sem duplicação.
CN-020	Pagamento antecipado + cancelamento/falta	Receita permanece; reembolso depende de decisão e lançamento manuais.
CN-021	Cliques duplicados de Confirmar pelo WhatsApp	Não há confirmações ou avisos de sucesso duplicados.
CN-022	Confirmação feita a menos de 24h do horário, fase WhatsApp ativa	Confirmação e um lembrete pós-confirmação são enviados conforme modelos aprovados.
CN-023	Integração Meta ainda indisponível	Agenda, aprovações, recusas, clientes e financeiro funcionam pelo painel.
CN-024	Google autentica usuário não autorizado	Acesso administrativo negado.


11. Consistência com REQUISITOS.md e decisões pendentes
11.1 Alterações deliberadas em relação ao requisito anterior
1. Conclusão automática: a decisão final do responsável substitui a regra de conclusão manual descrita em RF-027. Este documento registra a regra aprovada; REQUISITOS.md não foi alterado e precisará de harmonização posterior e autorizada.
2. Recusa automática por conflito: a resposta final determina recusar automaticamente as demais solicitações pendentes com períodos conflitantes. Amplia o comportamento de RF-019, RF-021 e CA-002; adicionar teste explícito quando REQUISITOS.md for revisado.
3. Link por solicitação: cada nova solicitação gera código privado próprio, inclusive para cliente antiga; exibir botão de compartilhar no painel. Detalha RF-009 e RF-018.
4. Duas formas de login: mantidas as decisões mais recentes de RF-012 a RF-016, inclusive redefinição por e-mail para a senha local e login Google separado porém vinculado à mesma administradora.
11.2 Pontos a detalhar nos próximos documentos — sem decidir unilateralmente
- Horários e durações: unidade de grade (p.ex. 15 ou 30 minutos), regras de arredondamento e duração mínima configurável.
- Link privado: prazo de validade, revogação/reemissão, eventual confirmação adicional para cancelamento e minimização de dados exibidos.
- Contatos WhatsApp: consentimento, modelos aprovados, estado de mensagens, custos reais, autorização de botões e conexão dos três números.
- Finanças: política para registrar valores excepcionalmente diferentes do preço do serviço, reembolsos parciais versus regra de não aceitar pagamentos parciais e categorias de despesa.
- Automação de conclusão: frequência da tarefa, tratamento de falhas/reexecução e modo de a profissional corrigir uma conclusão automática indevida; a conclusão não é prova de presença.
- Histórico e retenção: tempo de manutenção dos registros, política de privacidade e direitos das clientes.
Esses detalhes não são autorização para a IA inventar políticas. Quando uma decisão depender da proprietária, solicitar validação antes de implementá-la.
12. Orientações para o Claude e próximos documentos
- Este arquivo determina comportamentos e restrições; não especifica a implementação concreta de tabelas, endpoints ou componentes.
- Respeitar a ordem de trabalho: documentação primeiro; integração WhatsApp por último.
- Não editar REQUISITOS.md nem criar código com base neste documento sem autorização.
- Se as regras deste arquivo e o REQUISITOS.md divergirem, destacar a divergência para correção documental antes de codificar. Não escolher silenciosamente uma versão.
- O backend Flask será a única autoridade sobre confirmação, cancelamento, estado e financeiro, independentemente do canal.