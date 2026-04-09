INSERT INTO menus (id, name, description, price, image_url, stock)
VALUES
  ('americano-ice', '아메리카노(ICE)', '간단한 설명…', 4000, NULL, 10),
  ('americano-hot', '아메리카노(HOT)', '간단한 설명…', 4000, NULL, 10),
  ('cafe-latte', '카페라떼', '간단한 설명…', 5000, NULL, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_options (menu_id, option_key, name, extra_price)
VALUES
  ('americano-ice', 'shot', '샷 추가', 500),
  ('americano-ice', 'syrup', '시럽 추가', 0),
  ('americano-hot', 'shot', '샷 추가', 500),
  ('americano-hot', 'syrup', '시럽 추가', 0),
  ('cafe-latte', 'shot', '샷 추가', 500),
  ('cafe-latte', 'syrup', '시럽 추가', 0)
ON CONFLICT (menu_id, option_key) DO NOTHING;
