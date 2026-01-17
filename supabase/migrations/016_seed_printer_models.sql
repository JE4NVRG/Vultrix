-- =====================================================
-- SEED: MODELOS COMUNS DE IMPRESSORAS 3D
-- Execute este arquivo apos a migration 016
-- =====================================================

-- Bambu Lab
INSERT INTO printer_models (brand, model, category, avg_watts, peak_watts, notes) VALUES
('Bambu Lab', 'A1 Mini', 'fdm', 120, 180, 'Impressora compacta com cama aquecida 180W'),
('Bambu Lab', 'A1', 'fdm', 150, 250, 'Impressora FDM com cama aquecida e multi-color'),
('Bambu Lab', 'P1P', 'fdm', 200, 350, 'High-speed FDM sem enclosure'),
('Bambu Lab', 'P1S', 'fdm', 220, 380, 'High-speed FDM com enclosure'),
('Bambu Lab', 'X1C', 'fdm', 250, 400, 'Flagship com AMS e enclosure ativa');

-- Creality
INSERT INTO printer_models (brand, model, category, avg_watts, peak_watts, notes) VALUES
('Creality', 'Ender 3 V2', 'fdm', 150, 270, 'FDM popular com cama aquecida 220W'),
('Creality', 'Ender 3 S1', 'fdm', 160, 280, 'Ender 3 com nivelamento automatico'),
('Creality', 'CR-10 Smart Pro', 'fdm', 220, 380, 'Grande volume com cama 110C');

-- Prusa
INSERT INTO printer_models (brand, model, category, avg_watts, peak_watts, notes) VALUES
('Prusa', 'MK3S+', 'fdm', 120, 240, 'FDM confiavel com cama aquecida MK52'),
('Prusa', 'MK4', 'fdm', 150, 280, 'Nova geracao com input shaping'),
('Prusa', 'Mini+', 'fdm', 80, 180, 'Compacta com cama menor');

-- Anycubic
INSERT INTO printer_models (brand, model, category, avg_watts, peak_watts, notes) VALUES
('Anycubic', 'Kobra', 'fdm', 140, 250, 'FDM com nivelamento automatico'),
('Anycubic', 'Photon Mono', 'resin', 60, 100, 'Impressora de resina LED monocromatico'),
('Anycubic', 'Photon Mono X', 'resin', 80, 120, 'Resina com maior volume de impressao');

-- Outros modelos populares
INSERT INTO printer_models (brand, model, category, avg_watts, peak_watts, notes) VALUES
('Elegoo', 'Neptune 3', 'fdm', 150, 260, 'FDM economica com bom custo-beneficio'),
('Elegoo', 'Mars 3', 'resin', 60, 90, 'Resina LCD 4K'),
('Sovol', 'SV06', 'fdm', 140, 240, 'FDM tipo Prusa com direct drive'),
('Flashforge', 'Adventurer 3', 'fdm', 100, 200, 'FDM fechada para iniciantes'),
('Artillery', 'Sidewinder X2', 'fdm', 200, 350, 'Grande volume com cama 300x300');

-- Mensagem de confirmacao
DO $$
BEGIN
  RAISE NOTICE '✅ Seed concluido: % modelos inseridos', (SELECT COUNT(*) FROM printer_models);
END $$;
