-- ============================================
-- DIAGNÓSTICO: Por que serviços não aparecem?
-- ============================================

-- 1. Listar TODOS os tenants e quantos serviços cada um tem
SELECT
  t.id as tenant_id,
  t.name as tenant_nome,
  t.codigoIbge,
  t.nomeMunicipio,
  t.ufMunicipio,
  COUNT(DISTINCT s.id) as total_servicos,
  COUNT(DISTINCT c.id) as total_cidadaos,
  COUNT(DISTINCT d.id) as total_departamentos
FROM tenants t
LEFT JOIN services s ON t.id = s.tenantId AND s.isActive = true
LEFT JOIN citizens c ON t.id = c.tenantId AND c.isActive = true
LEFT JOIN departments d ON t.id = d.tenantId AND d.isActive = true
GROUP BY t.id, t.name, t.codigoIbge, t.nomeMunicipio, t.ufMunicipio
ORDER BY t.createdAt DESC;

-- 2. Listar TODOS os cidadãos e seus tenants
SELECT
  c.id as cidadao_id,
  c.name as cidadao_nome,
  c.email,
  c.cpf,
  c.tenantId,
  t.name as tenant_nome,
  t.codigoIbge,
  c.verificationStatus,
  c.isActive
FROM citizens c
LEFT JOIN tenants t ON c.tenantId = t.id
ORDER BY c.createdAt DESC
LIMIT 10;

-- 3. Verificar serviços do tenant 'demo'
SELECT
  s.id,
  s.name,
  s.category,
  s.tenantId,
  s.isActive,
  d.name as departamento
FROM services s
LEFT JOIN departments d ON s.departmentId = d.id
WHERE s.tenantId = 'demo'
ORDER BY s.createdAt
LIMIT 10;

-- 4. Verificar departamentos por tenant
SELECT
  t.name as tenant_nome,
  d.name as departamento,
  d.code as codigo,
  d.isActive,
  COUNT(s.id) as total_servicos
FROM tenants t
LEFT JOIN departments d ON t.id = d.tenantId
LEFT JOIN services s ON d.id = s.departmentId AND s.isActive = true
GROUP BY t.name, d.name, d.code, d.isActive
ORDER BY t.name, d.name;
