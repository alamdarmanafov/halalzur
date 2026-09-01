-- Run this in Supabase → SQL Editor. Adds haram/mushbooh keyword
-- entries in German, French, Spanish, Italian, Polish, Dutch,
-- Portuguese and Arabic — the languages Open Food Facts most often has
-- ingredient text in for products manufactured in those countries, so a
-- scanned German/French/Spanish/... product's ingredient list gets
-- flagged the same way an Azerbaijani/Russian/Turkish one already does.
--
-- Notes stay in Azerbaijani (for the admin reading them here); only the
-- `keyword` column itself is in the foreign language. `on conflict do
-- nothing` makes this safe to run more than once and safe even if a
-- couple of these already exist.
--
-- This is a first pass, not exhaustive — European languages that heavily
-- compound words (German especially: "Schweinefleisch", "Rotwein") only
-- match when that exact compound is the word actually printed on the
-- label; a compound this list doesn't anticipate won't be caught. Expand
-- with more compounds/languages (e.g. Ukrainian, more Arabic terms) as
-- real misses turn up.

insert into haram_keywords (keyword, status, note) values
  -- German (de)
  ('Schweinefleisch', 'haram', 'Donuz əti (alman dilində).'),
  ('Schweineschmalz', 'haram', 'Donuz mənşəli piy (alman dilində).'),
  ('Schweinespeck', 'haram', 'Donuz mənşəli bekon/piy (alman dilində).'),
  ('Speck', 'haram', 'Adətən donuz mənşəli bekon (alman dilində).'),
  ('Schinken', 'haram', 'Adətən donuz mənşəli hazır ət (alman dilində).'),
  ('Wein', 'haram', 'Şərab (alman dilində).'),
  ('Rotwein', 'haram', 'Qırmızı şərab (alman dilində).'),
  ('Weißwein', 'haram', 'Ağ şərab (alman dilində).'),
  ('Gelatine', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (alman/holland yazılışı).'),
  ('Cochenille', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (alman/fransız yazılışı).'),

  -- French (fr)
  ('porc', 'haram', 'Donuz əti (fransız dilində).'),
  ('viande de porc', 'haram', 'Donuz əti (fransız dilində).'),
  ('graisse de porc', 'haram', 'Donuz mənşəli piy (fransız dilində).'),
  ('vin', 'haram', 'Şərab (fransız dilində).'),
  ('gélatine', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (fransız dilində).'),
  ('présure', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (fransız dilində, pendir mayası).'),
  ('carmin', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (fransız yazılışı).'),

  -- Spanish (es)
  ('cerdo', 'haram', 'Donuz (ispan dilində).'),
  ('carne de cerdo', 'haram', 'Donuz əti (ispan dilində).'),
  ('manteca de cerdo', 'haram', 'Donuz mənşəli piy (ispan dilində).'),
  ('tocino', 'haram', 'Donuz mənşəli bekon (ispan dilində).'),
  ('jamón', 'haram', 'Adətən donuz mənşəli hazır ət (ispan dilində).'),
  ('vino', 'haram', 'Şərab (ispan/italyan dilində).'),
  ('gelatina', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (ispan/italyan/portuqal yazılışı).'),
  ('cuajo', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (ispan dilində, pendir mayası).'),
  ('cochinilla', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (ispan dilində).'),

  -- Italian (it)
  ('maiale', 'haram', 'Donuz (italyan dilində).'),
  ('carne di maiale', 'haram', 'Donuz əti (italyan dilində).'),
  ('lardo', 'haram', 'Donuz mənşəli piy (italyan dilində).'),
  ('pancetta', 'haram', 'Donuz mənşəli bekon (italyan dilində).'),
  ('caglio', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (italyan dilində, pendir mayası).'),
  ('cocciniglia', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (italyan dilində).'),

  -- Polish (pl)
  ('wieprzowina', 'haram', 'Donuz əti (polyak dilində).'),
  ('smalec', 'haram', 'Donuz mənşəli piy (polyak dilində).'),
  ('boczek', 'haram', 'Donuz mənşəli bekon (polyak dilində).'),
  ('szynka', 'haram', 'Adətən donuz mənşəli hazır ət (polyak dilində).'),
  ('wino', 'haram', 'Şərab (polyak dilində).'),
  ('żelatyna', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (polyak dilində).'),
  ('podpuszczka', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (polyak dilində, pendir mayası).'),
  ('koszenila', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (polyak dilində).'),

  -- Dutch (nl)
  ('varkensvlees', 'haram', 'Donuz əti (holland dilində).'),
  ('varkensvet', 'haram', 'Donuz mənşəli piy (holland dilində).'),
  ('spek', 'haram', 'Adətən donuz mənşəli bekon (holland dilində).'),
  ('ham', 'haram', 'Adətən donuz mənşəli hazır ət (holland/ingilis dilində).'),
  ('wijn', 'haram', 'Şərab (holland dilində).'),
  ('stremsel', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (holland dilində, pendir mayası).'),

  -- Portuguese (pt)
  ('porco', 'haram', 'Donuz (portuqal dilində).'),
  ('carne de porco', 'haram', 'Donuz əti (portuqal dilində).'),
  ('toucinho', 'haram', 'Donuz mənşəli piy/bekon (portuqal dilində).'),
  ('presunto', 'haram', 'Adətən donuz mənşəli hazır ət (portuqal dilində).'),
  ('vinho', 'haram', 'Şərab (portuqal dilində).'),
  ('coalho', 'mushbooh', 'Heyvan mənşəli maya ola bilər — mənbəyi etiketdən görünmür (portuqal dilində, pendir mayası).'),
  ('cochonilha', 'haram', 'Həşərat mənşəli qırmızı rəngləyici, bax: E120 (portuqal dilində).'),

  -- Arabic (ar) — deliberately kept to a small, unambiguous core set
  ('خنزير', 'haram', 'Donuz (ərəb dilində).'),
  ('لحم خنزير', 'haram', 'Donuz əti (ərəb dilində).'),
  ('دهن خنزير', 'haram', 'Donuz mənşəli piy (ərəb dilində).'),
  ('خمر', 'haram', 'Spirtli içki/şərab (ərəb dilində).'),
  ('جيلاتين', 'mushbooh', 'Mənbəyi (mal/balıq = halal, donuz = haram) etiketdən görünmür (ərəb dilində).')
on conflict (keyword) do nothing;
