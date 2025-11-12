-- ==========================================
-- DIAGNÓSTICO COMPLETO - SERVIÇOS E DEPARTAMENTOS
-- Sistema Digiurban - Após Expansão
-- ==========================================

-- 1. TOTAL DE DEPARTAMENTOS (deve ser 13)
SELECT
    '🏢 TOTAL DE DEPARTAMENTOS' as info,
    COUNT(*) as total,
    '(esperado: 13)' as expectativa
FROM departments;

-- 2. LISTA DE DEPARTAMENTOS COM CÓDIGO
SELECT
    '📋 DEPARTAMENTOS CADASTRADOS' as info,
    name as departamento,
    code as codigo,
    CASE WHEN isActive = 1 THEN 'Ativo' ELSE 'Inativo' END as status
FROM departments
ORDER BY name;

-- 3. TOTAL DE SERVIÇOS (deve ser 154)
SELECT
    '📊 TOTAL DE SERVIÇOS' as info,
    COUNT(*) as total,
    '(esperado: 154)' as expectativa
FROM services;

-- 4. SERVIÇOS POR DEPARTAMENTO
SELECT
    '📈 SERVIÇOS POR DEPARTAMENTO' as info,
    d.name as departamento,
    d.code as codigo,
    COUNT(s.id) as total_servicos,
    CASE d.code
        WHEN 'ADM' THEN '(esperado: 10)'
        WHEN 'SAUDE' THEN '(esperado: 20)'
        WHEN 'EDUCACAO' THEN '(esperado: 14)'
        WHEN 'SERVICOS_PUBLICOS' THEN '(esperado: 18)'
        WHEN 'ASSISTENCIA_SOCIAL' THEN '(esperado: 12)'
        WHEN 'CULTURA' THEN '(esperado: 10)'
        WHEN 'ESPORTE_LAZER' THEN '(esperado: 8)'
        WHEN 'MEIO_AMBIENTE' THEN '(esperado: 14)'
        WHEN 'OBRAS_INFRAESTRUTURA' THEN '(esperado: 12)'
        WHEN 'PLANEJAMENTO' THEN '(esperado: 8)'
        WHEN 'FAZENDA' THEN '(esperado: 10)'
        WHEN 'AGRICULTURA' THEN '(esperado: 10)'
        WHEN 'TURISMO' THEN '(esperado: 8)'
        ELSE '(novo)'
    END as expectativa
FROM departments d
LEFT JOIN services s ON d.id = s.departmentId
GROUP BY d.id, d.name, d.code
ORDER BY total_servicos DESC, d.name;

-- 5. VALIDAÇÃO DE CÓDIGOS DE DEPARTAMENTO
SELECT
    '🔍 CÓDIGOS DE DEPARTAMENTO' as info,
    code as codigo,
    COUNT(*) as quantidade
FROM departments
GROUP BY code
ORDER BY code;

-- 6. SERVIÇOS SEM DEPARTAMENTO (não deve ter nenhum)
SELECT
    '⚠️  SERVIÇOS SEM DEPARTAMENTO' as info,
    COUNT(*) as total,
    '(esperado: 0)' as expectativa
FROM services
WHERE departmentId IS NULL;

-- 7. CATEGORIAS DE SERVIÇOS MAIS POPULARES
SELECT
    '🏆 TOP 10 CATEGORIAS' as info,
    category as categoria,
    COUNT(*) as total_servicos
FROM services
GROUP BY category
ORDER BY total_servicos DESC
LIMIT 10;

-- 8. RESUMO FINAL
SELECT
    '✅ RESUMO DA EXPANSÃO' as info,
    (SELECT COUNT(*) FROM departments) as total_departamentos,
    (SELECT COUNT(*) FROM services) as total_servicos,
    (SELECT COUNT(*) FROM services WHERE departmentId IS NULL) as servicos_sem_depto,
    CASE
        WHEN (SELECT COUNT(*) FROM departments) = 13
         AND (SELECT COUNT(*) FROM services) = 154
         AND (SELECT COUNT(*) FROM services WHERE departmentId IS NULL) = 0
        THEN '✅ SUCESSO - Todos os 154 serviços em 13 departamentos!'
        ELSE '⚠️  VERIFICAR - Há inconsistências'
    END as status_final;
