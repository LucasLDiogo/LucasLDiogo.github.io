-- Console (D1 lldworks-hub) — 20/11/2026
-- 1) ServiceWorks Premium volta ao preço de venda (estava R$ 1,00 desde o teste do Mercado Pago de 19/11 e aparece assim no site)
UPDATE planos SET preco_centavos = 34900 WHERE id = 6 AND produto = 'serviceworks' AND preco_centavos = 100;
-- 2) Demonstrações mostram tudo: cliente 1 (barbearia) e 2 (pet shop) com ServiceWorks Premium cortesia
INSERT INTO assinaturas (cliente_id, produto, plano_id, status, inicio, vence_em, origem, criado_em)
SELECT c, 'serviceworks', 6, 'cortesia', datetime('now'), NULL, 'manual', datetime('now') FROM (SELECT 1 c UNION ALL SELECT 2)
WHERE NOT EXISTS (SELECT 1 FROM assinaturas a WHERE a.cliente_id = c AND a.produto = 'serviceworks');
