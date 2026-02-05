-- Script para criar um relatório de exemplo no sistema

-- Primeiro, vamos pegar um usuário ADMIN existente para ser o criador
DO $$
DECLARE
    admin_user_id TEXT;
BEGIN
    -- Busca o primeiro usuário ADMIN ou SUPER_ADMIN
    SELECT id INTO admin_user_id
    FROM "User"
    WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    LIMIT 1;

    -- Se não encontrou, usa um ID genérico (você pode ajustar)
    IF admin_user_id IS NULL THEN
        admin_user_id := 'cm0000000000000000000000';
    END IF;

    -- Insere relatório de exemplo: Relatório Operacional de Protocolos
    INSERT INTO reports (
        id,
        name,
        description,
        type,
        category,
        config,
        "accessLevel",
        departments,
        "isActive",
        "isPublic",
        "createdBy",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'report_exemplo_001',
        'Relatório Operacional de Protocolos',
        'Relatório completo com análise de protocolos por status, departamento e serviço',
        'OPERATIONAL',
        'analytics',
        '{"defaultFilters":{"status":["PROGRESSO","PENDENCIA"]},"fields":["citizen","service","department"],"limit":1000}'::jsonb,
        0,
        ARRAY[]::text[],
        true,
        true,
        admin_user_id,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insere relatório gerencial
    INSERT INTO reports (
        id,
        name,
        description,
        type,
        category,
        config,
        "accessLevel",
        departments,
        "isActive",
        "isPublic",
        "createdBy",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'report_exemplo_002',
        'Relatório Gerencial - Desempenho',
        'Análise de desempenho dos departamentos e tempo médio de conclusão',
        'MANAGERIAL',
        'performance',
        '{"defaultFilters":{},"fields":["citizen","service","department","stages"],"limit":500}'::jsonb,
        1,
        ARRAY[]::text[],
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insere relatório executivo
    INSERT INTO reports (
        id,
        name,
        description,
        type,
        category,
        config,
        "accessLevel",
        departments,
        "isActive",
        "isPublic",
        "createdBy",
        "createdAt",
        "updatedAt"
    ) VALUES (
        'report_exemplo_003',
        'Dashboard Executivo',
        'Visão executiva com KPIs principais e indicadores estratégicos',
        'EXECUTIVE',
        'analytics',
        '{"defaultFilters":{"status":["CONCLUIDO"]},"fields":["service","department"],"limit":2000}'::jsonb,
        2,
        ARRAY[]::text[],
        true,
        false,
        admin_user_id,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Relatórios de exemplo criados com sucesso!';
    RAISE NOTICE 'Criador: %', admin_user_id;
END $$;
