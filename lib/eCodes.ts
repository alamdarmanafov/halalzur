import { ECodeEntry, ECodeStatus } from './types';

/**
 * E-code (food additive) classification sourced from Halalzur's own
 * curated database (Halalzur_E_Codes_Database_v1.xlsx — built on the
 * European Commission Food Additives Database / EFSA data, with a halal
 * status column added on top). Categories follow that spreadsheet's own
 * classification: "halal", "haram", "mushbooh" (doubtful — commonly
 * flagged, opinions vary between certifiers/madhabs), and "depends" (the
 * code itself is neutral; status hinges on the raw material's source,
 * which the label alone cannot tell you — this is the spreadsheet's
 * "ŞÜBHƏLİ" + Source_Dependent=true rows).
 *
 * This is a lookup table, not an AI verdict — Halalzur never infers status
 * from ingredient text; it only reports what's in this table. Treat it as
 * a starting reference, not a substitute for an official certificate: the
 * definitive source is always the certifier's own current publication.
 *
 * E160b(i)/E160b(ii) (Annatto bixin/norbixin) are merged into a single
 * E160b entry — ingredient labels never print the sub-index, so scanned
 * text can't distinguish them anyway.
 */
export const E_CODES: ECodeEntry[] = [
  { code: "E100", name: "Curcumin", category: "Rəngləndirici", status: "halal", note: "Zərdəçal mənşəli sarı rəng — Bitki mənşəli." },
  { code: "E101", name: "Riboflavins", category: "Rəngləndirici / vitamin", status: "halal", note: "Vitamin B2 — Mənbə/istehsal üsulu yoxlanıla bilər." },
  { code: "E102", name: "Tartrazine", category: "Rəngləndirici", status: "halal", note: "Sarı sintetik rəng." },
  { code: "E104", name: "Quinoline Yellow", category: "Rəngləndirici", status: "halal", note: "Sarı rəng." },
  { code: "E110", name: "Sunset Yellow FCF", category: "Rəngləndirici", status: "halal", note: "Narıncı-sarı sintetik rəng." },
  { code: "E120", name: "Carminic acid / Carmine", category: "Rəngləndirici", status: "haram", note: "Koşenil həşəratından alınan qırmızı rəng — Həşərat mənşəli." },
  { code: "E122", name: "Azorubine / Carmoisine", category: "Rəngləndirici", status: "halal", note: "Qırmızı sintetik rəng." },
  { code: "E123", name: "Amaranth", category: "Rəngləndirici", status: "halal", note: "Qırmızı rəng." },
  { code: "E124", name: "Ponceau 4R / Cochineal Red A", category: "Rəngləndirici", status: "halal", note: "Qırmızı sintetik rəng." },
  { code: "E127", name: "Erythrosine", category: "Rəngləndirici", status: "halal", note: "Çəhrayı-qırmızı rəng." },
  { code: "E129", name: "Allura Red AC", category: "Rəngləndirici", status: "halal", note: "Qırmızı sintetik rəng." },
  { code: "E131", name: "Patent Blue V", category: "Rəngləndirici", status: "halal", note: "Mavi rəng." },
  { code: "E132", name: "Indigotine / Indigo carmine", category: "Rəngləndirici", status: "halal", note: "Mavi rəng." },
  { code: "E133", name: "Brilliant Blue FCF", category: "Rəngləndirici", status: "halal", note: "Mavi rəng." },
  { code: "E140", name: "Chlorophylls and chlorophyllins", category: "Rəngləndirici", status: "halal", note: "Yaşıl bitki piqmenti." },
  { code: "E141", name: "Copper complexes of chlorophylls", category: "Rəngləndirici", status: "halal", note: "Xlorofilin mis kompleksləri." },
  { code: "E142", name: "Green S", category: "Rəngləndirici", status: "halal", note: "Yaşıl sintetik rəng." },
  { code: "E150a", name: "Plain caramel", category: "Rəngləndirici", status: "halal", note: "Sadə karamel rəngi." },
  { code: "E150b", name: "Caustic sulphite caramel", category: "Rəngləndirici", status: "halal", note: "Karamel rəngi." },
  { code: "E150c", name: "Ammonia caramel", category: "Rəngləndirici", status: "halal", note: "Karamel rəngi." },
  { code: "E150d", name: "Sulphite ammonia caramel", category: "Rəngləndirici", status: "halal", note: "Karamel rəngi." },
  { code: "E151", name: "Brilliant Black PN", category: "Rəngləndirici", status: "halal", note: "Qara rəng." },
  { code: "E153", name: "Vegetable carbon", category: "Rəngləndirici", status: "halal", note: "Bitki karbonu." },
  { code: "E155", name: "Brown HT", category: "Rəngləndirici", status: "halal", note: "Qəhvəyi sintetik rəng." },
  { code: "E160a", name: "Carotenes", category: "Rəngləndirici", status: "halal", note: "Karotinlər — Mənbə yoxlanıla bilər." },
  { code: "E160b", name: "Annatto (bixin/norbixin)", category: "Rəngləndirici", status: "halal", note: "Annatto piqmenti." },
  { code: "E160c", name: "Paprika extract", category: "Rəngləndirici", status: "halal", note: "Paprika ekstraktı." },
  { code: "E160d", name: "Lycopene", category: "Rəngləndirici", status: "halal", note: "Likopen." },
  { code: "E160e", name: "Beta-apo-8'-carotenal", category: "Rəngləndirici", status: "halal", note: "Karotinoid." },
  { code: "E161b", name: "Lutein", category: "Rəngləndirici", status: "halal", note: "Sarı karotinoid." },
  { code: "E161g", name: "Canthaxanthin", category: "Rəngləndirici", status: "halal", note: "Karotinoid." },
  { code: "E162", name: "Beetroot Red / Betanin", category: "Rəngləndirici", status: "halal", note: "Çuğundur rəngi." },
  { code: "E163", name: "Anthocyanins", category: "Rəngləndirici", status: "halal", note: "Bitki piqmentləri." },
  { code: "E170", name: "Calcium carbonate", category: "Rəngləndirici / tənzimləyici", status: "halal", note: "Kalsium karbonat — Mineral." },
  { code: "E171", name: "Titanium dioxide", category: "Rəngləndirici", status: "halal", note: "Ağ piqment." },
  { code: "E172", name: "Iron oxides and hydroxides", category: "Rəngləndirici", status: "halal", note: "Dəmir oksidləri." },
  { code: "E173", name: "Aluminium", category: "Rəngləndirici", status: "halal", note: "Alüminium." },
  { code: "E174", name: "Silver", category: "Rəngləndirici", status: "halal", note: "Gümüş." },
  { code: "E175", name: "Gold", category: "Rəngləndirici", status: "halal", note: "Qızıl." },
  { code: "E180", name: "Litholrubine BK", category: "Rəngləndirici", status: "halal", note: "Qırmızı rəng." },
  { code: "E200", name: "Sorbic acid", category: "Konservant", status: "halal", note: "Kif və maya artımını azaldır." },
  { code: "E202", name: "Potassium sorbate", category: "Konservant", status: "halal", note: "Konservant." },
  { code: "E210", name: "Benzoic acid", category: "Konservant", status: "halal", note: "Konservant." },
  { code: "E211", name: "Sodium benzoate", category: "Konservant", status: "halal", note: "Konservant." },
  { code: "E212", name: "Potassium benzoate", category: "Konservant", status: "halal", note: "Konservant." },
  { code: "E213", name: "Calcium benzoate", category: "Konservant", status: "halal", note: "Konservant." },
  { code: "E214", name: "Ethyl-p-hydroxybenzoate", category: "Konservant", status: "halal", note: "Paraben." },
  { code: "E215", name: "Sodium ethyl p-hydroxybenzoate", category: "Konservant", status: "halal", note: "Paraben." },
  { code: "E218", name: "Methyl p-hydroxybenzoate", category: "Konservant", status: "halal", note: "Paraben." },
  { code: "E219", name: "Sodium methyl p-hydroxybenzoate", category: "Konservant", status: "halal", note: "Paraben." },
  { code: "E220", name: "Sulphur dioxide", category: "Konservant", status: "halal", note: "Kükürd dioksid." },
  { code: "E221", name: "Sodium sulphite", category: "Konservant", status: "halal", note: "Sulfid duzu." },
  { code: "E222", name: "Sodium hydrogen sulphite", category: "Konservant", status: "halal", note: "Sulfid duzu." },
  { code: "E223", name: "Sodium metabisulphite", category: "Konservant", status: "halal", note: "Sulfid duzu." },
  { code: "E224", name: "Potassium metabisulphite", category: "Konservant", status: "halal", note: "Sulfid duzu." },
  { code: "E226", name: "Calcium sulphite", category: "Konservant", status: "halal", note: "Sulfid duzu." },
  { code: "E227", name: "Calcium hydrogen sulphite", category: "Konservant", status: "halal", note: "Sulfid duzu." },
  { code: "E228", name: "Potassium hydrogen sulphite", category: "Konservant", status: "halal", note: "Sulfid duzu." },
  { code: "E234", name: "Nisin", category: "Konservant", status: "halal", note: "Antimikrobial peptid — İstehsal mənbəyi yoxlanıla bilər." },
  { code: "E235", name: "Natamycin", category: "Konservant", status: "halal", note: "Antifungal maddə." },
  { code: "E239", name: "Hexamethylene tetramine", category: "Konservant", status: "halal", note: "Konservant." },
  { code: "E242", name: "Dimethyl dicarbonate", category: "Konservant", status: "halal", note: "İçkilərdə mikrob nəzarəti." },
  { code: "E243", name: "Ethyl lauroyl arginate", category: "Konservant", status: "halal", note: "Antimikrobial maddə." },
  { code: "E246", name: "Glycolipids", category: "Konservant", status: "depends", note: "Antimikrobial maddə — Mənbədən asılı." },
  { code: "E249", name: "Potassium nitrite", category: "Konservant", status: "halal", note: "Nitrit." },
  { code: "E250", name: "Sodium nitrite", category: "Konservant", status: "halal", note: "Nitrit." },
  { code: "E251", name: "Sodium nitrate", category: "Konservant", status: "halal", note: "Nitrat." },
  { code: "E252", name: "Potassium nitrate", category: "Konservant", status: "halal", note: "Nitrat." },
  { code: "E260", name: "Acetic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Sirkə turşusu." },
  { code: "E261", name: "Potassium acetates", category: "Turşuluq tənzimləyici", status: "halal", note: "Asetat duzu." },
  { code: "E262", name: "Sodium acetates", category: "Turşuluq tənzimləyici", status: "halal", note: "Asetat duzu." },
  { code: "E263", name: "Calcium acetate", category: "Turşuluq tənzimləyici", status: "halal", note: "Asetat duzu." },
  { code: "E267", name: "Buffered vinegar", category: "Turşuluq tənzimləyici", status: "halal", note: "Tamponlanmış sirkə." },
  { code: "E270", name: "Lactic acid", category: "Turşuluq tənzimləyici", status: "depends", note: "Süd turşusu — Fermentasiya mənbəyi yoxlanmalıdır." },
  { code: "E280", name: "Propionic acid", category: "Konservant", status: "halal", note: "Propion turşusu." },
  { code: "E281", name: "Sodium propionate", category: "Konservant", status: "halal", note: "Propionat duzu." },
  { code: "E282", name: "Calcium propionate", category: "Konservant", status: "halal", note: "Propionat duzu." },
  { code: "E283", name: "Potassium propionate", category: "Konservant", status: "halal", note: "Propionat duzu." },
  { code: "E284", name: "Boric acid", category: "Digər", status: "halal", note: "Bor turşusu." },
  { code: "E285", name: "Sodium tetraborate", category: "Digər", status: "halal", note: "Boraks." },
  { code: "E290", name: "Carbon dioxide", category: "Qablaşdırma qazı", status: "halal", note: "Karbon qazı." },
  { code: "E296", name: "Malic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Alma turşusu." },
  { code: "E297", name: "Fumaric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Fumar turşusu." },
  { code: "E300", name: "Ascorbic acid", category: "Antioksidant", status: "halal", note: "Vitamin C." },
  { code: "E301", name: "Sodium ascorbate", category: "Antioksidant", status: "halal", note: "C vitamininin natrium duzu." },
  { code: "E302", name: "Calcium ascorbate", category: "Antioksidant", status: "halal", note: "C vitamininin kalsium duzu." },
  { code: "E304", name: "Fatty acid esters of ascorbic acid", category: "Antioksidant", status: "depends", note: "Yağ turşusu efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E306", name: "Tocopherol-rich extract", category: "Antioksidant", status: "halal", note: "E vitamini ekstraktı." },
  { code: "E307", name: "Alpha-tocopherol", category: "Antioksidant", status: "halal", note: "Vitamin E." },
  { code: "E308", name: "Gamma-tocopherol", category: "Antioksidant", status: "halal", note: "Vitamin E." },
  { code: "E309", name: "Delta-tocopherol", category: "Antioksidant", status: "halal", note: "Vitamin E." },
  { code: "E310", name: "Propyl gallate", category: "Antioksidant", status: "halal", note: "Antioksidant." },
  { code: "E315", name: "Erythorbic acid", category: "Antioksidant", status: "halal", note: "Antioksidant." },
  { code: "E316", name: "Sodium erythorbate", category: "Antioksidant", status: "halal", note: "Antioksidant." },
  { code: "E319", name: "TBHQ", category: "Antioksidant", status: "halal", note: "Antioksidant." },
  { code: "E320", name: "BHA", category: "Antioksidant", status: "halal", note: "Antioksidant." },
  { code: "E321", name: "BHT", category: "Antioksidant", status: "halal", note: "Antioksidant." },
  { code: "E322", name: "Lecithins", category: "Emulqator", status: "depends", note: "Emulqator — Soya, günəbaxan və ya yumurta mənbəli ola bilər." },
  { code: "E325", name: "Sodium lactate", category: "Turşuluq tənzimləyici", status: "depends", note: "Laktat duzu — Laktik turşunun mənbəyi yoxlanmalıdır." },
  { code: "E326", name: "Potassium lactate", category: "Turşuluq tənzimləyici", status: "depends", note: "Laktat duzu — Mənbə yoxlanmalıdır." },
  { code: "E327", name: "Calcium lactate", category: "Turşuluq tənzimləyici", status: "depends", note: "Laktat duzu — Mənbə yoxlanmalıdır." },
  { code: "E330", name: "Citric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Limon turşusu." },
  { code: "E331", name: "Sodium citrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Sitrat duzları." },
  { code: "E332", name: "Potassium citrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Sitrat duzları." },
  { code: "E333", name: "Calcium citrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Sitrat duzları." },
  { code: "E334", name: "Tartaric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Tartar turşusu." },
  { code: "E335", name: "Sodium tartrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Tartrat duzu." },
  { code: "E336", name: "Potassium tartrates", category: "Turşuluq tənzimləyici", status: "halal", note: "Tartrat duzu." },
  { code: "E337", name: "Sodium potassium tartrate", category: "Turşuluq tənzimləyici", status: "halal", note: "Tartrat duzu." },
  { code: "E338", name: "Phosphoric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Fosfor turşusu." },
  { code: "E339", name: "Sodium phosphates", category: "Stabilizator", status: "halal", note: "Fosfat duzları." },
  { code: "E340", name: "Potassium phosphates", category: "Stabilizator", status: "halal", note: "Fosfat duzları." },
  { code: "E341", name: "Calcium phosphates", category: "Qabartma / stabilizator", status: "halal", note: "Kalsium fosfatları." },
  { code: "E343", name: "Magnesium phosphates", category: "Stabilizator", status: "halal", note: "Maqnezium fosfatları." },
  { code: "E350", name: "Sodium malates", category: "Turşuluq tənzimləyici", status: "halal", note: "Malat duzları." },
  { code: "E351", name: "Potassium malate", category: "Turşuluq tənzimləyici", status: "halal", note: "Malat duzu." },
  { code: "E352", name: "Calcium malates", category: "Turşuluq tənzimləyici", status: "halal", note: "Malat duzu." },
  { code: "E353", name: "Metatartaric acid", category: "Stabilizator", status: "halal", note: "Metatartar turşusu." },
  { code: "E354", name: "Calcium tartrate", category: "Stabilizator", status: "halal", note: "Kalsium tartrat." },
  { code: "E355", name: "Adipic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Adipin turşusu." },
  { code: "E356", name: "Sodium adipate", category: "Turşuluq tənzimləyici", status: "halal", note: "Adipat duzu." },
  { code: "E357", name: "Potassium adipate", category: "Turşuluq tənzimləyici", status: "halal", note: "Adipat duzu." },
  { code: "E363", name: "Succinic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Süksin turşusu." },
  { code: "E380", name: "Triammonium citrate", category: "Turşuluq tənzimləyici", status: "halal", note: "Ammonium sitrat." },
  { code: "E385", name: "Calcium disodium EDTA", category: "Stabilizator", status: "halal", note: "Xelatlaşdırıcı maddə." },
  { code: "E392", name: "Extracts of rosemary", category: "Antioksidant", status: "halal", note: "Rozmarin ekstraktı." },
  { code: "E400", name: "Alginic acid", category: "Qatılaşdırıcı", status: "halal", note: "Dəniz yosunu mənşəli." },
  { code: "E401", name: "Sodium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alginat." },
  { code: "E402", name: "Potassium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alginat." },
  { code: "E403", name: "Ammonium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alginat." },
  { code: "E404", name: "Calcium alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alginat." },
  { code: "E405", name: "Propane-1,2-diol alginate", category: "Qatılaşdırıcı", status: "halal", note: "Alginat törəməsi." },
  { code: "E406", name: "Agar", category: "Jelləşdirici", status: "halal", note: "Dəniz yosunu mənşəli." },
  { code: "E407", name: "Carrageenan", category: "Qatılaşdırıcı", status: "halal", note: "Dəniz yosunu mənşəli." },
  { code: "E407a", name: "Processed euchema seaweed", category: "Qatılaşdırıcı", status: "halal", note: "Emal edilmiş dəniz yosunu." },
  { code: "E410", name: "Locust bean gum", category: "Qatılaşdırıcı", status: "halal", note: "Keçiboynuzu saqqızı." },
  { code: "E412", name: "Guar gum", category: "Qatılaşdırıcı", status: "halal", note: "Quar saqqızı." },
  { code: "E413", name: "Tragacanth", category: "Qatılaşdırıcı", status: "halal", note: "Bitki saqqızı." },
  { code: "E414", name: "Gum arabic", category: "Qatılaşdırıcı", status: "halal", note: "Akasiya saqqızı." },
  { code: "E415", name: "Xanthan gum", category: "Qatılaşdırıcı", status: "halal", note: "Ksantan saqqızı." },
  { code: "E416", name: "Karaya gum", category: "Qatılaşdırıcı", status: "halal", note: "Bitki saqqızı." },
  { code: "E417", name: "Tara gum", category: "Qatılaşdırıcı", status: "halal", note: "Bitki saqqızı." },
  { code: "E418", name: "Gellan gum", category: "Qatılaşdırıcı", status: "halal", note: "Fermentasiya mənşəli polisaxarid — İstehsal mənbəyi yoxlanıla bilər." },
  { code: "E420", name: "Sorbitols", category: "Şirinləşdirici", status: "halal", note: "Sorbitol." },
  { code: "E421", name: "Mannitol", category: "Şirinləşdirici", status: "halal", note: "Mannitol." },
  { code: "E422", name: "Glycerol", category: "Nəmləndirici", status: "depends", note: "Qliserin — Bitki və ya heyvan mənşəli ola bilər." },
  { code: "E423", name: "Modified gum arabic", category: "Qatılaşdırıcı", status: "halal", note: "Modifikasiya edilmiş akasiya saqqızı." },
  { code: "E425", name: "Konjac", category: "Qatılaşdırıcı", status: "halal", note: "Konjak." },
  { code: "E426", name: "Soybean hemicellulose", category: "Qatılaşdırıcı", status: "halal", note: "Soya hemiselülozası." },
  { code: "E427", name: "Cassia gum", category: "Qatılaşdırıcı", status: "halal", note: "Bitki saqqızı." },
  { code: "E431", name: "Polyoxyethylene stearate", category: "Emulqator", status: "depends", note: "Stearat əsaslı emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E432", name: "Polysorbate 20", category: "Emulqator", status: "depends", note: "Emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E433", name: "Polysorbate 80", category: "Emulqator", status: "depends", note: "Emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E434", name: "Polysorbate 40", category: "Emulqator", status: "depends", note: "Emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E435", name: "Polysorbate 60", category: "Emulqator", status: "depends", note: "Emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E436", name: "Polysorbate 65", category: "Emulqator", status: "depends", note: "Emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E440", name: "Pectins", category: "Jelləşdirici", status: "halal", note: "Meyvə mənşəli pektin." },
  { code: "E441", name: "Gelatin", category: "Jelləşdirici", status: "depends", note: "Heyvan sümüyü/dərisindən alınır — halal kəsilmiş heyvan və ya balıqdan olarsa halal, donuzdan olarsa tövsiyə edilmir; etiketdə mənbə göstərilmir." },
  { code: "E442", name: "Ammonium phosphatides", category: "Emulqator", status: "halal", note: "Emulqator." },
  { code: "E444", name: "Sucrose acetate isobutyrate", category: "Stabilizator", status: "halal", note: "İçki stabilizatoru." },
  { code: "E445", name: "Glycerol esters of wood rosins", category: "Stabilizator", status: "depends", note: "Şam qatranı efirləri — İstehsal üsulu yoxlanıla bilər." },
  { code: "E450", name: "Diphosphates", category: "Qabartma / stabilizator", status: "halal", note: "Difosfatlar." },
  { code: "E451", name: "Triphosphates", category: "Stabilizator", status: "halal", note: "Trifosfatlar." },
  { code: "E452", name: "Polyphosphates", category: "Stabilizator", status: "halal", note: "Polifosfatlar." },
  { code: "E456", name: "Potassium polyaspartate", category: "Stabilizator", status: "halal", note: "Poliaspartat." },
  { code: "E459", name: "Beta-cyclodextrin", category: "Stabilizator", status: "halal", note: "Siklodextrin." },
  { code: "E460", name: "Cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellüloza." },
  { code: "E461", name: "Methyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Metil sellüloza." },
  { code: "E462", name: "Ethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Etil sellüloza." },
  { code: "E463", name: "Hydroxypropyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellüloza törəməsi." },
  { code: "E464", name: "Hydroxypropyl methyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellüloza törəməsi." },
  { code: "E465", name: "Ethyl methyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellüloza törəməsi." },
  { code: "E466", name: "Sodium carboxymethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellüloza törəməsi." },
  { code: "E468", name: "Cross-linked sodium carboxymethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellüloza törəməsi." },
  { code: "E469", name: "Hydrolysed carboxymethyl cellulose", category: "Qatılaşdırıcı", status: "halal", note: "Sellüloza törəməsi." },
  { code: "E470a", name: "Sodium, potassium and calcium salts of fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşusu duzları — Yağ turşusunun mənbəyi yoxlanmalıdır." },
  { code: "E470b", name: "Magnesium salts of fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşusu duzları — Yağ turşusunun mənbəyi yoxlanmalıdır." },
  { code: "E471", name: "Mono- and diglycerides of fatty acids", category: "Emulqator", status: "depends", note: "Mono/digliseridlər — Bitki və ya heyvan yağı mənşəli ola bilər." },
  { code: "E472a", name: "Acetic acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "Mono/digliserid efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E472b", name: "Lactic acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "Mono/digliserid efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E472c", name: "Citric acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "Mono/digliserid efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E472d", name: "Tartaric acid esters of mono- and diglycerides", category: "Emulqator", status: "depends", note: "Mono/digliserid efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E472e", name: "DATEM", category: "Emulqator", status: "depends", note: "Xəmir yaxşılaşdırıcı — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E472f", name: "Acetic and tartaric acid esters", category: "Emulqator", status: "depends", note: "Mono/digliserid efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E473", name: "Sucrose esters of fatty acids", category: "Emulqator", status: "depends", note: "Saxaroza efirləri — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E474", name: "Sucroglycerides", category: "Emulqator", status: "depends", note: "Sukroqliseridlər — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E475", name: "Polyglycerol esters of fatty acids", category: "Emulqator", status: "depends", note: "Poliqliserol efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E476", name: "Polyglycerol polyricinoleate", category: "Emulqator", status: "halal", note: "Poliqliserol polirisinoleat." },
  { code: "E477", name: "Propane-1,2-diol esters of fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşusu efirləri — Yağ mənbəyi yoxlanmalıdır." },
  { code: "E479b", name: "Thermally oxidized soybean oil + mono/diglycerides", category: "Emulqator", status: "halal", note: "Soya yağı əsaslı emulqator." },
  { code: "E481", name: "Sodium stearoyl-2-lactylate", category: "Emulqator", status: "depends", note: "Xəmir yaxşılaşdırıcı — Stearin turşusunun mənbəyi yoxlanmalıdır." },
  { code: "E482", name: "Calcium stearoyl-2-lactylate", category: "Emulqator", status: "depends", note: "Xəmir yaxşılaşdırıcı — Stearin turşusunun mənbəyi yoxlanmalıdır." },
  { code: "E483", name: "Stearyl tartrate", category: "Emulqator", status: "depends", note: "Stearil tartrat — Stearin mənbəyi yoxlanmalıdır." },
  { code: "E491", name: "Sorbitan monostearate", category: "Emulqator", status: "depends", note: "Emulqator — Stearin turşusu mənbəyi yoxlanmalıdır." },
  { code: "E492", name: "Sorbitan tristearate", category: "Emulqator", status: "depends", note: "Emulqator — Stearin turşusu mənbəyi yoxlanmalıdır." },
  { code: "E493", name: "Sorbitan monolaurate", category: "Emulqator", status: "depends", note: "Emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E494", name: "Sorbitan monooleate", category: "Emulqator", status: "depends", note: "Emulqator — Yağ turşusu mənbəyi yoxlanmalıdır." },
  { code: "E495", name: "Sorbitan monopalmitate", category: "Emulqator", status: "depends", note: "Emulqator — Palmitin turşusu mənbəyi yoxlanmalıdır." },
  { code: "E499", name: "Stigmasterol-rich plant sterols", category: "Stabilizator", status: "halal", note: "Bitki sterolları." },
  { code: "E500", name: "Sodium carbonates", category: "Turşuluq tənzimləyici", status: "halal", note: "Karbonat duzları." },
  { code: "E501", name: "Potassium carbonate", category: "Turşuluq tənzimləyici", status: "halal", note: "Kalium karbonat." },
  { code: "E503", name: "Ammonium carbonates", category: "Qabartma agenti", status: "halal", note: "Ammonium karbonat." },
  { code: "E504", name: "Magnesium carbonates", category: "Turşuluq tənzimləyici", status: "halal", note: "Maqnezium karbonat." },
  { code: "E507", name: "Hydrochloric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Xlorid turşusu." },
  { code: "E508", name: "Potassium chloride", category: "Mineral duz", status: "halal", note: "Kalium xlorid." },
  { code: "E509", name: "Calcium chloride", category: "Mineral duz", status: "halal", note: "Kalsium xlorid." },
  { code: "E511", name: "Magnesium chloride", category: "Mineral duz", status: "halal", note: "Maqnezium xlorid." },
  { code: "E512", name: "Stannous chloride", category: "Stabilizator", status: "halal", note: "Qalay xlorid." },
  { code: "E513", name: "Sulphuric acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Kükürd turşusu." },
  { code: "E514", name: "Sodium sulphates", category: "Stabilizator", status: "halal", note: "Sulfat duzları." },
  { code: "E515", name: "Potassium sulphates", category: "Stabilizator", status: "halal", note: "Sulfat duzları." },
  { code: "E516", name: "Calcium sulphate", category: "Stabilizator", status: "halal", note: "Kalsium sulfat." },
  { code: "E517", name: "Ammonium sulphate", category: "Stabilizator", status: "halal", note: "Ammonium sulfat." },
  { code: "E520", name: "Aluminium sulphate", category: "Stabilizator", status: "halal", note: "Alüminium sulfat." },
  { code: "E521", name: "Aluminium sodium sulphate", category: "Qabartma agenti", status: "halal", note: "Alüminium-natrium sulfat." },
  { code: "E522", name: "Aluminium potassium sulphate", category: "Qabartma agenti", status: "halal", note: "Alüminium-kalium sulfat." },
  { code: "E523", name: "Aluminium ammonium sulphate", category: "Qabartma agenti", status: "halal", note: "Alüminium-ammonium sulfat." },
  { code: "E524", name: "Sodium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Natrium hidroksid." },
  { code: "E525", name: "Potassium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Kalium hidroksid." },
  { code: "E526", name: "Calcium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Kalsium hidroksid." },
  { code: "E527", name: "Ammonium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Ammonium hidroksid." },
  { code: "E528", name: "Magnesium hydroxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Maqnezium hidroksid." },
  { code: "E529", name: "Calcium oxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Kalsium oksid." },
  { code: "E530", name: "Magnesium oxide", category: "Turşuluq tənzimləyici", status: "halal", note: "Maqnezium oksid." },
  { code: "E534", name: "Iron(III) meso-tartrate", category: "Mineral duz", status: "halal", note: "Dəmir tartrat." },
  { code: "E535", name: "Sodium ferrocyanide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Ferrotsianid." },
  { code: "E536", name: "Potassium ferrocyanide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Ferrotsianid." },
  { code: "E538", name: "Calcium ferrocyanide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Ferrotsianid." },
  { code: "E541", name: "Sodium aluminium phosphate acidic", category: "Qabartma agenti", status: "halal", note: "Fosfat." },
  { code: "E551", name: "Silicon dioxide", category: "Yapışmanın qarşısını alan", status: "halal", note: "Silisium dioksid." },
  { code: "E552", name: "Calcium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Kalsium silikat." },
  { code: "E553a", name: "Magnesium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Maqnezium silikat." },
  { code: "E553b", name: "Talc", category: "Yapışmanın qarşısını alan", status: "halal", note: "Talk." },
  { code: "E554", name: "Sodium aluminium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Silikat." },
  { code: "E555", name: "Potassium aluminium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Silikat." },
  { code: "E556", name: "Calcium aluminium silicate", category: "Yapışmanın qarşısını alan", status: "halal", note: "Silikat." },
  { code: "E558", name: "Bentonite", category: "Yapışmanın qarşısını alan", status: "halal", note: "Gil mineralı." },
  { code: "E559", name: "Aluminium silicate / Kaolin", category: "Yapışmanın qarşısını alan", status: "halal", note: "Gil mineralı." },
  { code: "E570", name: "Fatty acids", category: "Emulqator", status: "depends", note: "Yağ turşuları — Mənbə bitki və ya heyvan ola bilər." },
  { code: "E574", name: "Gluconic acid", category: "Turşuluq tənzimləyici", status: "halal", note: "Qlükon turşusu." },
  { code: "E575", name: "Glucono-delta-lactone", category: "Turşuluq tənzimləyici", status: "halal", note: "Qlükono-delta-lakton." },
  { code: "E576", name: "Sodium gluconate", category: "Turşuluq tənzimləyici", status: "halal", note: "Natrium qlükonat." },
  { code: "E577", name: "Potassium gluconate", category: "Turşuluq tənzimləyici", status: "halal", note: "Kalium qlükonat." },
  { code: "E578", name: "Calcium gluconate", category: "Mineral duz", status: "halal", note: "Kalsium qlükonat." },
  { code: "E579", name: "Ferrous gluconate", category: "Mineral duz", status: "halal", note: "Dəmir qlükonat." },
  { code: "E585", name: "Ferrous lactate", category: "Mineral duz", status: "depends", note: "Dəmir laktat — Laktat mənbəyi yoxlanmalıdır." },
  { code: "E586", name: "4-Hexylresorcinol", category: "Konservant", status: "halal", note: "Konservant." },
  { code: "E620", name: "Glutamic acid", category: "Dad artırıcı", status: "halal", note: "Qlutamin turşusu." },
  { code: "E621", name: "Monosodium glutamate", category: "Dad artırıcı", status: "halal", note: "MSG." },
  { code: "E622", name: "Monopotassium glutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat." },
  { code: "E623", name: "Calcium diglutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat." },
  { code: "E624", name: "Monoammonium glutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat." },
  { code: "E625", name: "Magnesium diglutamate", category: "Dad artırıcı", status: "halal", note: "Qlutamat." },
  { code: "E626", name: "Guanylic acid", category: "Dad artırıcı", status: "halal", note: "Quanylat." },
  { code: "E627", name: "Disodium guanylate", category: "Dad artırıcı", status: "depends", note: "Disodium quanylat — Mənbə/istehsal üsulu yoxlanmalıdır." },
  { code: "E628", name: "Dipotassium guanylate", category: "Dad artırıcı", status: "depends", note: "Dikalium quanylat — Mənbə/istehsal üsulu yoxlanmalıdır." },
  { code: "E629", name: "Calcium guanylate", category: "Dad artırıcı", status: "depends", note: "Kalsium quanylat — Mənbə/istehsal üsulu yoxlanmalıdır." },
  { code: "E630", name: "Inosinic acid", category: "Dad artırıcı", status: "depends", note: "İnozin turşusu — Mənbə/istehsal üsulu yoxlanmalıdır." },
  { code: "E631", name: "Disodium inosinate", category: "Dad artırıcı", status: "depends", note: "Disodium inozinat — Balıq/heyvan mənşəli ola bilər." },
  { code: "E632", name: "Dipotassium inosinate", category: "Dad artırıcı", status: "depends", note: "Dikalium inozinat — Balıq/heyvan mənşəli ola bilər." },
  { code: "E633", name: "Calcium inosinate", category: "Dad artırıcı", status: "depends", note: "Kalsium inozinat — Balıq/heyvan mənşəli ola bilər." },
  { code: "E634", name: "Calcium 5'-ribonucleotides", category: "Dad artırıcı", status: "depends", note: "Ribonukleotidlər — Mənbə yoxlanmalıdır." },
  { code: "E635", name: "Disodium 5'-ribonucleotides", category: "Dad artırıcı", status: "depends", note: "Ribonukleotidlər — Mənbə yoxlanmalıdır." },
  { code: "E640", name: "Glycine and its sodium salt", category: "Dad artırıcı", status: "depends", note: "Qlisin — Mənbə/istehsal üsulu yoxlanmalıdır." },
  { code: "E641", name: "L-leucine", category: "Dad artırıcı", status: "halal", note: "Amin turşusu." },
  { code: "E650", name: "Zinc acetate", category: "Dad artırıcı", status: "halal", note: "Sink asetat." },
  { code: "E900", name: "Dimethyl polysiloxane", category: "Köpükəleyhinə", status: "halal", note: "Köpük əmələ gəlməsini azaldır." },
  { code: "E901", name: "Beeswax", category: "Şüşələndirici", status: "halal", note: "Arı mumu." },
  { code: "E902", name: "Candelilla wax", category: "Şüşələndirici", status: "halal", note: "Bitki mumu." },
  { code: "E903", name: "Carnauba wax", category: "Şüşələndirici", status: "halal", note: "Bitki mumu." },
  { code: "E904", name: "Shellac", category: "Şüşələndirici", status: "depends", note: "Lak böcəyindən alınan qatran — Mənbə və halal standartı nəzərə alınmalıdır." },
  { code: "E905", name: "Microcrystalline wax", category: "Şüşələndirici", status: "halal", note: "Mineral mum." },
  { code: "E907", name: "Hydrogenated poly-1-decene", category: "Şüşələndirici", status: "halal", note: "Sintetik mum." },
  { code: "E912", name: "Montan acid esters", category: "Şüşələndirici", status: "halal", note: "Montan turşusu efirləri." },
  { code: "E914", name: "Oxidised polyethylene wax", category: "Şüşələndirici", status: "halal", note: "Polietilen mumu." },
  { code: "E920", name: "L-cysteine", category: "Xəmir yaxşılaşdırıcı", status: "depends", note: "Amin turşusu — İnsan/tük/heyvan və ya fermentasiya mənbəyi ola bilər." },
  { code: "E926", name: "Chlorine dioxide", category: "Digər", status: "halal", note: "Emal agenti." },
  { code: "E927b", name: "Carbamide", category: "Xəmir yaxşılaşdırıcı", status: "halal", note: "Karbamid." },
  { code: "E938", name: "Argon", category: "Qablaşdırma qazı", status: "halal", note: "İnert qaz." },
  { code: "E939", name: "Helium", category: "Qablaşdırma qazı", status: "halal", note: "İnert qaz." },
  { code: "E941", name: "Nitrogen", category: "Qablaşdırma qazı", status: "halal", note: "Azot." },
  { code: "E942", name: "Nitrous oxide", category: "Qablaşdırma qazı", status: "halal", note: "Azot oksidi." },
  { code: "E943a", name: "Butane", category: "Qablaşdırma qazı", status: "halal", note: "Butan." },
  { code: "E943b", name: "Isobutane", category: "Qablaşdırma qazı", status: "halal", note: "İzobutan." },
  { code: "E944", name: "Propane", category: "Qablaşdırma qazı", status: "halal", note: "Propan." },
  { code: "E948", name: "Oxygen", category: "Qablaşdırma qazı", status: "halal", note: "Oksigen." },
  { code: "E949", name: "Hydrogen", category: "Qablaşdırma qazı", status: "halal", note: "Hidrogen." },
  { code: "E950", name: "Acesulfame K", category: "Şirinləşdirici", status: "halal", note: "Acesulfam K." },
  { code: "E951", name: "Aspartame", category: "Şirinləşdirici", status: "halal", note: "Aspartam." },
  { code: "E952", name: "Cyclamic acid and salts", category: "Şirinləşdirici", status: "halal", note: "Siklamat." },
  { code: "E953", name: "Isomalt", category: "Şirinləşdirici", status: "halal", note: "İzomalt." },
  { code: "E954", name: "Saccharin and salts", category: "Şirinləşdirici", status: "halal", note: "Saxarin." },
  { code: "E955", name: "Sucralose", category: "Şirinləşdirici", status: "halal", note: "Sukraloza." },
  { code: "E957", name: "Thaumatin", category: "Şirinləşdirici", status: "depends", note: "Təumatin — Zülal mənşəli; mənbə yoxlanmalıdır." },
  { code: "E959", name: "Neohesperidine DC", category: "Şirinləşdirici", status: "halal", note: "Neohesperidin." },
  { code: "E960a", name: "Steviol glycosides from Stevia", category: "Şirinləşdirici", status: "halal", note: "Stevia qlikozidləri." },
  { code: "E960c", name: "Enzymatically produced steviol glycosides", category: "Şirinləşdirici", status: "depends", note: "Stevia qlikozidləri — Fermentasiya/enzim mənbəyi yoxlanmalıdır." },
  { code: "E960d", name: "Glucosylated steviol glycosides", category: "Şirinləşdirici", status: "depends", note: "Modifikasiya edilmiş stevia qlikozidləri — İstehsal üsulu yoxlanmalıdır." },
  { code: "E961", name: "Neotame", category: "Şirinləşdirici", status: "halal", note: "Güclü şirinləşdirici." },
  { code: "E962", name: "Aspartame-acesulfame salt", category: "Şirinləşdirici", status: "halal", note: "Aspartam-asesulfam duzu." },
  { code: "E964", name: "Polyglycitol syrup", category: "Şirinləşdirici", status: "halal", note: "Poliqlisitol." },
  { code: "E965", name: "Maltitols", category: "Şirinləşdirici", status: "halal", note: "Maltitol." },
  { code: "E966", name: "Lactitol", category: "Şirinləşdirici", status: "halal", note: "Laktitol." },
  { code: "E967", name: "Xylitol", category: "Şirinləşdirici", status: "halal", note: "Ksilitol." },
  { code: "E968", name: "Erythritol", category: "Şirinləşdirici", status: "halal", note: "Eritritol." },
  { code: "E969", name: "Advantame", category: "Şirinləşdirici", status: "halal", note: "Güclü şirinləşdirici." },
  { code: "E999", name: "Quillaia extract", category: "Köpükləndirici", status: "halal", note: "Kvillaya ekstraktı — Bitki mənşəli." },
];

export function findECode(query: string): ECodeEntry | undefined {
  const q = query.trim().toUpperCase().replace(/\s+/g, '');
  return E_CODES.find((e) => e.code.toUpperCase().replace(/\s+/g, '') === q);
}

export function searchECodes(query: string): ECodeEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return E_CODES;
  return E_CODES.filter(
    (e) =>
      e.code.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
  );
}

/**
 * Pulls every "E123" / "E123a" style token out of free-form ingredient
 * text. Tries an exact code match first (E472a must not resolve to
 * E472b just because they share a 4-character prefix), and only falls
 * back to the old prefix match for a 4-digit code missing its exact
 * variant in the table.
 */
export function extractECodesFromText(text: string): ECodeEntry[] {
  const found = new Map<string, ECodeEntry>();

  // "E123" / "E123a" style tokens — exact match first, then the old
  // 4-character-prefix fallback for a variant missing from the table.
  const codeMatches = text.match(/E\s?-?\s?\d{3,4}[a-h]?/gi) ?? [];
  for (const raw of codeMatches) {
    const normalized = raw.toUpperCase().replace(/[\s-]/g, '');
    const exact = E_CODES.find((e) => e.code.toUpperCase() === normalized);
    const entry = exact ?? E_CODES.find((e) => e.code.toUpperCase().startsWith(normalized.slice(0, 4)));
    if (entry) found.set(entry.code, entry);
  }

  // Ingredient names spelled out in full instead of as an E-code (e.g. a
  // label that says "Gelatin" or "Lecithin" with no "E441"/"E322" next to
  // it) — whole-word match, skipping short names too likely to false-hit
  // ("Talc" would; but < 5 chars is rare among these anyway).
  for (const entry of E_CODES) {
    for (const namePart of entry.name.split(/[/,]/).map((s) => s.trim())) {
      if (namePart.length < 5) continue;
      const escaped = namePart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
        found.set(entry.code, entry);
        break;
      }
    }
  }

  return Array.from(found.values());
}

export const eCodeStatusLabel: Record<ECodeStatus, string> = {
  halal: 'Halal',
  haram: 'Tövsiyə edilmir',
  mushbooh: 'Şübhəli',
  depends: 'Mənbədən asılıdır',
};
