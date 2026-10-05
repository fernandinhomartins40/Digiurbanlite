-- Motor facial passa a usar o AuraFace (Apache 2.0, uso comercial liberado) como
-- padrão. As biometrias já cadastradas são recalculadas sozinhas pelo servidor de
-- face a partir das fotos de cadastro (rotina de reprocessamento).
ALTER TABLE "face_engine_settings" ALTER COLUMN "recognitionModel" SET DEFAULT 'auraface';
UPDATE "face_engine_settings" SET "recognitionModel" = 'auraface' WHERE "recognitionModel" = 'arcface_mnet';
