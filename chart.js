/* =========================================================================
   CPR Actions France Climat | note de reference interne
   Moteur de graphique SVG maison (zero dependance, fonctionne hors-ligne)
   Pilote par window.CHART_CONFIG (defini dans chaque page avant ce script).
   Charte CPR : #009EE0 / #001C4B / #FFFFFF / #F5F5F5 / #D6EAF7
   ========================================================================= */

/* ---------- Configuration de page ---------- */
const CFG = Object.assign({
  present:   {cpram:true, sbf:true},     // series affichees sur cette page (+ etat initial)
  events:    true,                       // reperes numerotes + modale
  episodes:  true,                       // boutons d'episode (zoom)
  fundArea:  true,                       // aire + halo sous la courbe du fonds
  ranges:    ["hist","3a","1a","ytd"],   // periodes proposees
  defaultRange: "hist",
}, window.CHART_CONFIG || {});

/* ---------- Definition de toutes les series ---------- */
const SERIES = {
  cpram:      {name:"CPR Actions France Climat", short:"CPR Actions France Climat", color:"#009EE0", width:3.2, fund:true},
  sbf:        {name:"SBF 120 (indice prix)", short:"SBF 120 (prix)", color:"#5b6b85", width:2},
  amundiresp: {name:"Amundi Actions France Responsable (I)", short:"Amundi Act. France Resp.", color:"#C0496B", width:1.8},
  lbpam:      {name:"LBPAM Actions France (C)", short:"LBPAM Actions France", color:"#E8920C", width:1.8},
  tocqueville:{name:"Tocqueville France (I)", short:"Tocqueville France", color:"#7C5CD6", width:1.8},
  ofi:        {name:"Ofi Invest Selection Actions France (I)", short:"Ofi Invest Sel. Act. France", color:"#2F9D5A", width:1.8},
  amundietf:  {name:"Amundi CAC 40 ESG UCITS ETF", short:"Amundi CAC 40 ESG (ETF)", color:"#B58900", width:1.8},
  bnpcac:     {name:"BNP Paribas Easy CAC 40 ESG (ETF)", short:"BNPP Easy CAC 40 ESG (ETF)", color:"#8a5a44", width:1.8},
  bnplc:      {name:"BNP Paribas Easy Low Carbon 100 Europe PAB (ETF)", short:"BNPP Low Carbon 100 (ETF)", color:"#0F9D8E", width:1.8},
};
const SERIES_ORDER = Object.keys(SERIES).filter(k=>k in CFG.present);
for(const k of SERIES_ORDER){ SERIES[k].on = !!CFG.present[k]; }
function visibleSeries(){ return SERIES_ORDER.filter(k=>SERIES[k].on); }

/* ---------- Utilitaires dates / format ---------- */
const DAY = 86400000;
const MONTHS = ["janv.","fevr.","mars","avr.","mai","juin","juil.","aout","sept.","oct.","nov.","dec."];
function parseD(s){const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d).getTime();}
function fmtDate(t){const d=new Date(t);return d.getDate()+" "+MONTHS[d.getMonth()]+" "+d.getFullYear();}
function fmtMonthYr(t){const d=new Date(t);return MONTHS[d.getMonth()]+" "+String(d.getFullYear()).slice(2);}
function fmtYear(t){return String(new Date(t).getFullYear());}
function fmtNum(v,dec){return v.toFixed(dec==null?2:dec).replace(".",",");}

/* ---------- Donnees -> {t,v} ---------- */
const DATA = {};
for(const k of SERIES_ORDER){
  DATA[k] = (window.PRICE_DATA[k]||[]).map(p=>({t:parseD(p[0]), v:p[1]})).sort((a,b)=>a.t-b.t);
}
const GLOBAL_START = DATA.cpram && DATA.cpram.length ? DATA.cpram[0].t : parseD("2018-09-24");
let GLOBAL_END = GLOBAL_START;
for(const k of SERIES_ORDER){ const a=DATA[k]; if(a&&a.length&&a[a.length-1].t>GLOBAL_END) GLOBAL_END=a[a.length-1].t; }
const MIN_SPAN = 30*DAY;
const FULL_SPAN = GLOBAL_END-GLOBAL_START;
const ZOOM_IN = 0.88, ZOOM_OUT = 1/0.88;
const YEAR = 365*DAY;

/* ---------- Periodes & episodes ---------- */
const ALL_RANGES = {
  hist:{id:"hist", label:"Historique (2018)", start:GLOBAL_START,        end:GLOBAL_END},
  "3a":{id:"3a",   label:"3 ans",             start:GLOBAL_END-3*YEAR,    end:GLOBAL_END},
  "1a":{id:"1a",   label:"1 an",              start:GLOBAL_END-YEAR,      end:GLOBAL_END},
  ytd: {id:"ytd",  label:"2026 (YTD)",        start:parseD("2025-12-31"), end:GLOBAL_END},
  "6m":{id:"6m",   label:"6 mois",            start:GLOBAL_END-182*DAY,   end:GLOBAL_END},
};
const RANGES = CFG.ranges.map(id=>ALL_RANGES[id]).filter(Boolean);
const EPISODES = [
  {id:"covid",  label:"Krach Covid 2020",          start:parseD("2020-01-01"), end:parseD("2020-12-31")},
  {id:"choc22", label:"Choc de 2022",              start:parseD("2022-01-01"), end:parseD("2022-12-31")},
  {id:"bull",   label:"Cycle haussier 2023-2025",  start:parseD("2023-01-01"), end:parseD("2025-12-31")},
  {id:"clim",   label:"Nouvelle strategie 2026",   start:parseD("2026-01-15"), end:GLOBAL_END},
];

/* =========================================================================
   EVENEMENTS (documents CPRAM fournis + donnees publiques sourcees)
   Categories : macro | secteur | titre | fonds
   ========================================================================= */
const EVENTS = [
{ id:1, date:"2018-09-24", cat:"fonds", title:"Depart de l'historique de VL suivi",
  short:"Premiere VL quotidienne disponible pour la part I (24/09/2018). Le FCP existe depuis 2013, sous une strategie anterieure.",
  move:"VL part I : 101 167,89 € au 24/09/2018", moveSign:0,
  holdings:"Portefeuille d'actions francaises (min. 80 %), univers SBF 120.",
  body:`<p>Le FCP a ete cree le <b>26/03/2013</b>. La courbe demarre au <b>24/09/2018</b>, premiere valeur liquidative quotidienne disponible pour la part I (FR0011354638) dans l'export VL CPRAM fourni (verifie strictement identique aux donnees publiques).</p><p>Important pour la lecture&nbsp;: jusqu'au 30/01/2026, l'historique correspond aux <b>strategies anterieures du FCP</b> (successivement denomme «&nbsp;CPR Actions France Select&nbsp;» puis «&nbsp;CPR Actions France ESG&nbsp;»), deja investi en actions francaises avec integration ESG. Le fonds est devenu <b>CPR Actions France Climat</b> le 30/01/2026 (repere n&deg;9).</p>`,
  sources:[{l:"Export VL CPRAM, part I (FR0011354638), du 24/09/2018 au 11/02/2026"},{l:"Pitchbook CPR Actions France Climat (avril 2026), date de creation 26/03/2013"},{l:"Donnees publiques Boursorama, denominations successives du FCP", u:"https://www.boursorama.com/bourse/opcvm/cours/0P0001ENBB/"}] },

{ id:2, date:"2018-12-24", cat:"macro", title:"Correction du 4e trimestre 2018",
  short:"Resserrement de la Fed et guerre commerciale : le marche parisien recule fortement en fin d'annee 2018.",
  move:"SBF 120 : -17,0 % du 01/10 au 27/12/2018", moveSign:-1,
  holdings:"Repli generalise des actions francaises.",
  body:`<p>L'automne 2018 combine le resserrement monetaire de la Reserve federale americaine, la guerre commerciale entre les Etats-Unis et la Chine et les craintes sur la croissance mondiale. Le <b>SBF 120 abandonne environ 17,0 %</b> entre le 1er octobre et le point bas du 27 decembre 2018.</p><p>Sur l'annee civile 2018, le fonds recule de <b>-11,4 %</b> contre <b>-9,7 %</b> pour son indice de reference (ecart -1,7 point).</p>`,
  sources:[{l:"Calcul sur la serie SBF 120 (donnees publiques Boursorama)"},{l:"Pitchbook CPR Actions France Climat (avril 2026), performances calendaires 2018"}] },

{ id:3, date:"2020-03-12", cat:"macro", title:"Krach Covid : pire seance de l'histoire du marche parisien",
  short:"Pandemie et confinements : -12,3 % en une seule seance le 12 mars 2020, -39 % en un mois.",
  move:"SBF 120 : -12,3 % le 12/03/2020 ; -39,0 % du 20/02 au 18/03", moveSign:-1,
  holdings:"Repli general ; aucune valeur epargnee lors du choc initial.",
  body:`<p>La pandemie de Covid-19 et l'annonce des confinements provoquent le krach le plus violent de l'histoire du marche parisien : le <b>12 mars 2020</b>, le SBF 120 s'effondre de <b>-12,3 %</b> en une seule seance (record absolu de baisse quotidienne pour le CAC 40 egalement, -12,28 %). Du 20 fevrier au 18 mars, l'indice abandonne <b>-39,0 %</b> ; la VL du fonds recule de <b>-39,3 %</b> sur la meme fenetre.</p><p>Sur l'annee 2020, le fonds termine a <b>-9,8 %</b> contre <b>-5,1 %</b> pour l'indice : la strategie de l'epoque est penalisee par le rebond tres selectif qui suit le choc.</p>`,
  sources:[{l:"Calcul sur l'export VL CPRAM (part I) et la serie SBF 120 (donnees publiques Boursorama)"},{l:"Pitchbook CPR Actions France Climat (avril 2026), performances calendaires 2020"}] },

{ id:4, date:"2020-11-09", cat:"macro", title:"Annonce du vaccin Pfizer-BioNTech : rebond eclair",
  short:"L'efficacite du vaccin (90 %) declenche l'un des plus forts rebonds mensuels de l'histoire du marche parisien.",
  move:"SBF 120 : +10,8 % sur le mois de novembre 2020", moveSign:1,
  holdings:"Rotation vers les valeurs cycliques et decotees (banques, industrie, consommation).",
  body:`<p>Le <b>9 novembre 2020</b>, Pfizer et BioNTech annoncent un vaccin efficace a environ 90 % contre le Covid-19. Les marches actions s'envolent, avec une rotation massive vers les valeurs cycliques et decotees. Le <b>SBF 120 gagne environ +10,8 %</b> sur le mois de novembre 2020, l'un des plus forts rebonds mensuels de son histoire.</p><p>Ce rebond ouvre la voie a l'excellente annee 2021 : <b>+29,5 %</b> pour le fonds contre <b>+28,3 %</b> pour l'indice (ecart +1,1 point).</p>`,
  sources:[{l:"Calcul sur la serie SBF 120 (donnees publiques Boursorama)"},{l:"Pitchbook CPR Actions France Climat (avril 2026), performances calendaires 2021"}] },

{ id:5, date:"2022-02-24", cat:"macro", title:"Invasion de l'Ukraine : choc energie & inflation",
  short:"Guerre en Ukraine, flambee des energies fossiles et remontee brutale des taux : annee la plus difficile pour les strategies climat.",
  move:"SBF 120 : -22,9 % du 05/01 au 29/09/2022 ; fonds 2022 : -11,7 % (indice -8,2 %)", moveSign:-1,
  holdings:"Les fonds excluant l'energie fossile sous-performent quand le petrole s'envole (TotalEnergies en tete du SBF 120).",
  body:`<p>Le <b>24 fevrier 2022</b>, la Russie envahit l'Ukraine. La flambee des prix de l'energie nourrit une inflation record et un resserrement monetaire brutal : le SBF 120 recule de <b>-22,9 %</b> entre le 5 janvier et le point bas du 29 septembre 2022.</p><p>L'annee est particulierement difficile pour les strategies actions francaises a filtre climatique : prives de l'energie fossile (TotalEnergies, l'un des principaux contributeurs de l'indice en 2022), ces portefeuilles sous-performent mecaniquement. Le fonds termine 2022 a <b>-11,7 %</b> contre <b>-8,2 %</b> pour l'indice (ecart -3,4 points, le plus defavorable de la decennie).</p>`,
  sources:[{l:"Calcul sur la serie SBF 120 (donnees publiques Boursorama)"},{l:"Pitchbook CPR Actions France Climat (avril 2026), performances calendaires 2022"},{l:"Recherche concurrentielle fonds climat (2026) : sensibilite des fonds climat au facteur energie"}] },

{ id:6, date:"2023-10-27", cat:"macro", title:"Point bas d'octobre 2023, debut du cycle haussier",
  short:"Pic des taux longs puis anticipations de baisses de taux : le marche parisien bascule dans un puissant cycle haussier.",
  move:"SBF 120 au plus bas a 5 149 pts le 27/10/2023, puis rebond ; 2023 : fonds +20,6 % (indice +18,0 %)", moveSign:1,
  holdings:"Rebond mene par le luxe, l'industrie et les financieres.",
  body:`<p>Fin octobre 2023, le SBF 120 touche un point bas a <b>5 149 points (27/10/2023)</b>, au moment ou le rendement du 10 ans americain frole les 5 %, niveau tres penalisant pour les actions.</p><p>A partir de novembre, le reflux de l'inflation et les anticipations de baisses de taux des banques centrales declenchent un puissant rebond : c'est le point de depart du cycle haussier 2023-2025. Le fonds signe une annee 2023 a <b>+20,6 %</b>, nettement au-dessus de son indice (<b>+18,0 %</b>, ecart +2,6 points), puis confirme en 2024 (+1,6 % contre -0,1 %).</p>`,
  sources:[{l:"Calcul sur la serie SBF 120 (donnees publiques Boursorama)"},{l:"Pitchbook CPR Actions France Climat (avril 2026), performances calendaires 2023 et 2024"},{l:"Contexte de marche : pic des taux longs fin octobre 2023 et anticipations de pivot des banques centrales"}] },

{ id:7, date:"2024-06-10", cat:"macro", title:"Dissolution de l'Assemblee nationale",
  short:"Le 9 juin 2024, dissolution surprise : pire semaine du marche parisien depuis 2022, tension sur la dette francaise.",
  move:"CAC 40 : -6,2 % sur la semaine ; SBF 120 : -6,9 % du 07/06 au 14/06 ; fonds : -3,9 % (resilience)", moveSign:-1,
  holdings:"Banques en premiere ligne : Societe Generale -14,9 %, BNP Paribas -12,0 %, Credit Agricole -11,0 % sur la semaine.",
  body:`<p>Le dimanche <b>9 juin 2024</b>, apres les elections europeennes, le President de la Republique annonce la dissolution de l'Assemblee nationale. L'incertitude politique frappe brutalement les actifs francais : le <b>CAC 40 perd 6,23 % sur la semaine</b> (pire semaine depuis 2022) et l'ecart de rendement entre la dette francaise et allemande (spread OAT-Bund) bondit de 48,5 a plus de 53,5 points de base. Les banques sont en premiere ligne : Societe Generale -14,9 %, BNP Paribas -12,0 %, Credit Agricole -11,0 %.</p><p>Sur la meme fenetre (07/06 au 14/06), le SBF 120 recule de <b>-6,9 %</b> quand la VL du fonds ne cede que <b>-3,9 %</b> : le positionnement qualite du portefeuille amortit le choc politique domestique.</p>`,
  sources:[{l:"BFM Bourse / Tradingsat : la Bourse de Paris apres l'annonce de la dissolution (juin 2024)", u:"https://www.tradingsat.com/cac-40-FR0003500008/actualites/cac-40-la-bourse-de-paris-encaisse-mal-le-choc-de-la-dissolution-de-l-assemblee-nationale-1116755.html"},{l:"Calcul sur l'export VL CPRAM (part I) et la serie SBF 120 (donnees publiques Boursorama)"}] },

{ id:8, date:"2025-04-07", cat:"macro", title:"Flash crash des droits de douane (« Liberation Day »)",
  short:"Droits de douane « reciproques » americains annonces le 2 avril 2025 : chute brutale des marches du 3 au 9 avril.",
  move:"SBF 120 : -12,4 % du 02/04 au 09/04/2025 ; fonds : -12,5 % sur la meme fenetre", moveSign:-1,
  holdings:"Repli general ; valeurs cycliques, industrielles et exportatrices fortement touchees.",
  body:`<p>Le 2 avril 2025 («&nbsp;Liberation Day&nbsp;»), l'administration americaine annonce des droits de douane «&nbsp;reciproques&nbsp;» d'une ampleur inattendue. Les marches actions mondiaux plongent du <b>3 au 9 avril</b>, l'un des reculs les plus brutaux depuis 2020 : le SBF 120 abandonne <b>-12,4 %</b> en une semaine, la VL du fonds <b>-12,5 %</b>.</p><p>Le rebond est tout aussi rapide a partir du 10 avril, apres l'annonce d'une <b>pause de 90 jours</b> sur la plupart des droits de douane. L'annee 2025 se solde finalement par <b>+11,6 %</b> pour le fonds contre <b>+13,2 %</b> pour l'indice.</p>`,
  sources:[{l:"Contexte de marche : droits de douane reciproques du 02/04/2025 et pause de 90 jours du 09/04/2025"},{l:"Calcul sur l'export VL CPRAM (part I) et la serie SBF 120 (donnees publiques Boursorama)"},{l:"Pitchbook CPR Actions France Climat (avril 2026), performances calendaires 2025"}] },

{ id:9, date:"2026-01-30", cat:"fonds", title:"Le FCP devient CPR Actions France Climat",
  short:"Changement de strategie le 30/01/2026 : approche climat proprietaire, trajectoire de decarbonation et compensation carbone.",
  move:"nouvelle strategie effective au 30/01/2026", moveSign:1,
  holdings:"Univers SBF 120 filtre CDP / SBTi ; exclusion des energies fossiles (criteres PAB).",
  body:`<p>Le <b>30 janvier 2026</b>, le FCP change de strategie et devient <b>CPR Actions France Climat</b>. La nouvelle approche combine&nbsp;: une <b>intensite carbone inferieure d'au moins 20 %</b> a celle du SBF 120 a tout moment, une <b>trajectoire de decarbonation</b> de reference (intensite du SBF 120 fin 2019, decote initiale de 30 % puis -7 % par an), le maintien d'une exposition aux secteurs a fort impact climatique au moins egale a celle de l'indice, une note ESG superieure a celle de l'indice et l'exclusion des energies fossiles selon les criteres PAB.</p><p>S'y ajoute un mecanisme distinctif de <b>contribution volontaire</b> : 0,50 % des frais de gestion financiere finance l'achat de credits carbone de projets agricoles et forestiers francais labellises Bas Carbone (partenariat Carbioz). La gestion est assuree par <b>Alexandre Blein et Gael de La Morlais</b> (pole Planet, equipe Actions thematiques). Le processus autorise egalement jusqu'a 20 % d'actions de la zone euro hors France.</p>`,
  sources:[{l:"Pitchbook CPR Actions France Climat (avril 2026) et Brochure retail (donnees au 30/01/2026)"},{l:"Recherche concurrentielle fonds climat (2026) : pivot strategique effectif fin janvier 2026"},{l:"Donnees publiques Boursorama : denominations successives du FCP (Select, ESG, Climat)"}] },

{ id:10, date:"2026-02-28", cat:"macro", title:"Record historique puis choc petrolier d'Ormuz",
  short:"Record absolu du marche parisien le 26/02, puis conflit americano-iranien et fermeture du detroit d'Ormuz : brusque repli.",
  move:"SBF 120 : record a 6 521 pts le 26/02, puis -5,4 % du 25/02 au 05/03 ; fonds : -5,9 %", moveSign:-1,
  holdings:"Repli general ; pressions inflationnistes via l'energie ; le fonds n'a aucune exposition petroliere (exclusion fossile).",
  body:`<p>Le <b>26 fevrier 2026</b>, le marche parisien inscrit un record absolu (SBF 120 a <b>6 520,8 points</b> ; CAC 40 a 8 642 points), porte par la defense, les banques et la perspective de baisses de taux.</p><p>Fin fevrier, l'escalade au Moyen-Orient provoque un violent retournement : les Etats-Unis lancent des operations militaires contre l'Iran (autour du 28/02/2026), qui riposte en fermant le <b>detroit d'Ormuz</b> (environ 20 % du petrole mondial). Le brut s'envole (WTI d'environ 67 $ a plus de 110 $), ravivant les craintes de stagflation. Le SBF 120 recule de <b>-5,4 %</b> entre le 25/02 et le 05/03, la VL du fonds de <b>-5,9 %</b>. L'apaisement et la reouverture du detroit alimentent ensuite le rebond du printemps.</p>`,
  sources:[{l:"Club Patrimoine / BFM Bourse : records du CAC 40 en fevrier 2026", u:"https://www.clubpatrimoine.com/contenus/cac-40-plus-haut-historique"},{l:"Recherche de marche : conflit USA-Iran et fermeture du detroit d'Ormuz (fin fevrier 2026)", u:"https://en.wikipedia.org/wiki/Economic_impact_of_the_2026_Iran_war"},{l:"Calcul sur l'export VL CPRAM, l'extension part P (C) et la serie SBF 120 (donnees publiques Boursorama)"}] },

{ id:11, date:"2026-07-13", cat:"fonds", title:"2026 : le nouveau positionnement climat performe",
  short:"Depuis le debut de 2026, le fonds progresse de +5,6 %, le double du SBF 120 (prix) a +2,8 %.",
  move:"YTD 2026 au 13/07 : fonds +5,6 % ; SBF 120 (prix) +2,8 %", moveSign:1,
  holdings:"Contribution des industriels (Schneider Electric, Safran, Legrand) et des services aux collectivites.",
  body:`<p>Au <b>13 juillet 2026</b>, le fonds progresse de <b>+5,6 %</b> depuis le debut de l'annee, contre <b>+2,8 %</b> pour le SBF 120 (indice prix). Depuis l'entree en vigueur de la nouvelle strategie (30/01/2026), l'ecart est egalement favorable : <b>+5,4 %</b> contre <b>+3,0 %</b>.</p><p>Sur les neuf series comparees dans ce site (fonds, indice, quatre fonds actifs concurrents et trois ETF), le fonds se classe <b>2e en performance 2026</b>, derriere le seul ETF paneuropeen Low Carbon 100 : voir la page Concurrence pour le detail.</p>`,
  sources:[{l:"Calcul sur les series de VL au 13/07/2026 (exports fournis et donnees publiques Boursorama)"}] },
];
EVENTS.forEach(e=>e.t=parseD(e.date));
const CAT_LABEL={macro:"Macro / marche", secteur:"Theme / secteur", titre:"Valeur du portefeuille", fonds:"Gestion / fonds"};
const CAT_COLOR={macro:"#001C4B", secteur:"#0082b8", titre:"#0c7a55", fonds:"#9a6a00"};

/* =========================================================================
   GRAPHIQUE SVG
   ========================================================================= */
const svg = document.getElementById("chart");
const tip = document.getElementById("tip");
const evtTip = document.getElementById("evtTip");
const chartwrap = svg ? svg.parentElement : null;
let state = { start:RANGES[0].start, end:RANGES[0].end, rangeId:RANGES[0].id,
              lastPreset:{start:RANGES[0].start,end:RANGES[0].end,id:RANGES[0].id} };
let CUR = null, drag = null, hoverMarker = null;

function interpRawAt(arr,t){
  if(!arr||!arr.length) return null;
  if(t<=arr[0].t) return arr[0].v;
  if(t>=arr[arr.length-1].t) return arr[arr.length-1].v;
  for(let i=0;i<arr.length-1;i++){
    if(t>=arr[i].t && t<=arr[i+1].t){
      const r=(t-arr[i].t)/(arr[i+1].t-arr[i].t);
      return arr[i].v+(arr[i+1].v-arr[i].v)*r;
    }
  }
  return arr[arr.length-1].v;
}
/* date de depart commune = plus tardive des premieres dates des series visibles */
function commonStartOf(start){
  let cs=start;
  for(const k of visibleSeries()){
    const arr=DATA[k]; if(!arr||!arr.length) continue;
    const f=arr.find(p=>p.t>=start-1);
    if(f && f.t>cs) cs=f.t;
  }
  return cs;
}
function windowed(key,cs,end){
  const arr=DATA[key]; if(!arr||!arr.length) return null;
  const base=interpRawAt(arr,cs); if(!base) return null;
  const pts=arr.filter(p=>p.t>=cs-1 && p.t<=end+1);
  if(pts.length<2) return null;
  return pts.map(p=>({t:p.t, y:p.v/base*100, raw:p.v}));
}
function interpY(pts,t){
  if(!pts||!pts.length) return 100;
  if(t<=pts[0].t) return pts[0].y;
  if(t>=pts[pts.length-1].t) return pts[pts.length-1].y;
  for(let i=0;i<pts.length-1;i++){
    if(t>=pts[i].t && t<=pts[i+1].t){
      const r=(t-pts[i].t)/(pts[i+1].t-pts[i].t);
      return pts[i].y+(pts[i+1].y-pts[i].y)*r;
    }
  }
  return pts[pts.length-1].y;
}
function nearestPt(pts,t){ let best=pts[0],bd=Infinity; for(const p of pts){const d=Math.abs(p.t-t); if(d<bd){bd=d;best=p;}} return best; }
function clampWin(s,e){
  const span=Math.min(e-s, FULL_SPAN);
  if(s<GLOBAL_START){ s=GLOBAL_START; e=s+span; }
  if(e>GLOBAL_END){ e=GLOBAL_END; s=e-span; }
  if(s<GLOBAL_START) s=GLOBAL_START;
  return [s,e];
}
function xTickFormat(span){ return span>2.2*YEAR ? fmtYear : fmtMonthYr; }

function render(){
  if(!svg) return;
  const W=Math.max(320, svg.clientWidth||chartwrap.clientWidth);
  const H=svg.clientHeight||560;
  svg.setAttribute("width",W); svg.setAttribute("height",H);
  svg.setAttribute("viewBox","0 0 "+W+" "+H);
  const L=54,R=20,T=22,B=36;
  const pw=W-L-R, ph=H-T-B;
  const {start,end}=state;
  const cs=commonStartOf(start);

  const reb={}; let yMin=Infinity,yMax=-Infinity;
  for(const k of visibleSeries()){
    const wk=windowed(k,cs,end); if(!wk) continue;
    reb[k]=wk;
    for(const p of wk){ if(p.y<yMin)yMin=p.y; if(p.y>yMax)yMax=p.y; }
  }
  if(yMin===Infinity){yMin=90;yMax=110;}
  const pad=(yMax-yMin)*0.10||5; yMin-=pad; yMax+=pad;

  const sx=t=>L+(t-cs)/(end-cs)*pw;
  const sy=y=>T+(yMax-y)/(yMax-yMin)*ph;

  const AX="rgba(0,28,75,.5)", GRID="rgba(0,28,75,.07)", GRIDX="rgba(0,28,75,.045)";
  let s='';
  s+=`<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="#fff"/>`;
  if(100>=yMin&&100<=yMax){
    s+=`<line x1="${L}" y1="${sy(100)}" x2="${W-R}" y2="${sy(100)}" stroke="rgba(0,28,75,.28)" stroke-width="1" stroke-dasharray="2 3"/>`;
    s+=`<text x="${W-R}" y="${sy(100)-5}" text-anchor="end" fill="rgba(0,28,75,.45)" font-size="10">base 100</text>`;
  }
  const ticks=5;
  for(let i=0;i<=ticks;i++){
    const yv=yMin+(yMax-yMin)*i/ticks, py=sy(yv);
    s+=`<line x1="${L}" y1="${py}" x2="${W-R}" y2="${py}" stroke="${GRID}" stroke-width="1"/>`;
    s+=`<text x="${L-9}" y="${py+3.5}" text-anchor="end" fill="${AX}" font-size="10.5">${Math.round(yv)}</text>`;
  }
  const xt=6, xf=xTickFormat(end-cs);
  for(let i=0;i<=xt;i++){
    const tv=cs+(end-cs)*i/xt, px=sx(tv);
    s+=`<line x1="${px}" y1="${T}" x2="${px}" y2="${T+ph}" stroke="${GRIDX}" stroke-width="1"/>`;
    s+=`<text x="${px}" y="${T+ph+19}" text-anchor="middle" fill="${AX}" font-size="10.5">${xf(tv)}</text>`;
  }
  // courbes : autres series (trait plein, derriere) puis fonds (aire + halo, devant)
  const drawOrder=visibleSeries().filter(k=>!SERIES[k].fund).concat(visibleSeries().filter(k=>SERIES[k].fund));
  for(const k of drawOrder){
    const wk=reb[k]; if(!wk) continue; const cfg=SERIES[k];
    let line="M";
    wk.forEach((p,i)=>{ line+=(i?"L":"")+sx(p.t).toFixed(1)+" "+sy(p.y).toFixed(1)+" "; });
    if(cfg.fund && CFG.fundArea){
      let area="M"+sx(wk[0].t).toFixed(1)+" "+sy(yMin).toFixed(1)+" ";
      wk.forEach(p=>{ area+="L"+sx(p.t).toFixed(1)+" "+sy(p.y).toFixed(1)+" "; });
      area+="L"+sx(wk[wk.length-1].t).toFixed(1)+" "+sy(yMin).toFixed(1)+" Z";
      s+=`<path d="${area}" fill="url(#fillgrad)" opacity="0.9"/>`;
    }
    s+=`<path d="${line}" fill="none" stroke="${cfg.color}" stroke-width="${cfg.width}" `+
       `stroke-linejoin="round" stroke-linecap="round" `+
       `${cfg.fund&&CFG.fundArea?'filter="url(#glow)"':'opacity="0.92"'}/>`;
  }
  // marqueurs evenements (sur la courbe du fonds)
  let markers=''; const wf=reb.cpram;
  if(CFG.events && wf){
    for(const e of EVENTS){
      if(e.t<cs||e.t>end) continue;
      const cx=sx(e.t), cy=sy(interpY(wf,e.t)), col=CAT_COLOR[e.cat];
      markers+=`<g class="evt-marker" data-id="${e.id}" transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">`+
        `<circle class="mk-ring" r="12" fill="none" stroke="${col}" stroke-width="2" opacity="0"/>`+
        `<circle r="9" fill="#ffffff" stroke="${col}" stroke-width="2.5"/>`+
        `<text y="3.4" text-anchor="middle" fill="${col}" font-size="10.5" font-weight="800">${e.id}</text>`+
        `</g>`;
    }
  }
  const defs=`<defs>`+
    `<filter id="glow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#009EE0" flood-opacity="0.35"/></filter>`+
    `<linearGradient id="fillgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#009EE0" stop-opacity="0.16"/><stop offset="100%" stop-color="#009EE0" stop-opacity="0"/></linearGradient>`+
    `</defs>`;

  svg.innerHTML = defs + s + `<g id="hoverLayer"></g>` + markers;
  CUR={start:cs,end,L,R,T,B,pw,ph,W,H,reb,sx,sy,yMin,yMax};

  if(CFG.events){
    svg.querySelectorAll(".evt-marker").forEach(g=>{
      const id=+g.dataset.id;
      g.addEventListener("click",ev=>{ ev.stopPropagation(); openEvent(id); });
      g.addEventListener("mouseenter",()=>{ hoverMarker=id; hideHover(); showEvtTip(id); });
      g.addEventListener("mousemove",ev=>positionEvtTip(ev));
      g.addEventListener("mouseleave",()=>{ hoverMarker=null; hideEvtTip(); });
    });
  }

  const baseEl=document.getElementById("baseNote");
  if(baseEl){
    const note = (cs>state.start+DAY) ? ` <span style="color:var(--muted-2)">(depart commun aux courbes affichees)</span>` : "";
    baseEl.innerHTML=`Base 100 au <b>${fmtDate(cs)}</b>${note} &middot; performances indexees, nettes de frais`;
  }
  buildLiveLegend(reb);
}

function buildLiveLegend(reb){
  const box=document.getElementById("liveLegend"); if(!box) return; box.innerHTML="";
  const perfs={};
  for(const k of visibleSeries()){
    const wk=reb[k]; if(!wk) continue;
    const perf=wk[wk.length-1].y-100; perfs[k]=perf;
    const c=perf>=0?"var(--pos)":"var(--neg)";
    const el=document.createElement("span"); el.className="ll";
    el.style.cssText="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--navy);margin-right:18px";
    el.innerHTML=`<i style="width:16px;height:3px;border-radius:2px;display:inline-block;background:${SERIES[k].color}"></i>`+
      `<b>${SERIES[k].short}</b> <b style="color:${c}">${perf>=0?'+':''}${fmtNum(perf,1)}%</b>`;
    box.appendChild(el);
  }
  if(perfs.cpram!=null && perfs.sbf!=null){
    const ec=perfs.cpram-perfs.sbf;
    const c=ec>=0?"var(--pos)":"var(--neg)";
    const el=document.createElement("span"); el.className="ll";
    el.style.cssText="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)";
    el.innerHTML=`ecart fonds / SBF 120&nbsp;: <b style="color:${c}">${ec>=0?'+':''}${fmtNum(ec,1)} pts</b>`;
    box.appendChild(el);
  }
}

/* ---------- Tooltip evenement ---------- */
function showEvtTip(id){
  const e=EVENTS.find(x=>x.id===id); if(!e||!evtTip) return;
  const cls=e.moveSign>0?"pos":(e.moveSign<0?"neg":"");
  const arrow=e.moveSign>0?"▲":(e.moveSign<0?"▼":"■");
  evtTip.innerHTML=`<div class="ettitle"><span class="badge ${e.cat}">${CAT_LABEL[e.cat]}</span>${e.title}</div>`+
    `<div class="etshort">${e.short}</div>`+
    `<div class="etmove mv ${cls}">${arrow} ${e.move}</div>`+
    `<div class="ethint">Cliquer pour le detail complet et les sources</div>`;
  evtTip.style.opacity=1;
}
function positionEvtTip(ev){
  if(!evtTip||!chartwrap) return;
  const rect=chartwrap.getBoundingClientRect();
  const w=evtTip.offsetWidth, h=evtTip.offsetHeight;
  let left=ev.clientX-rect.left+16, top=ev.clientY-rect.top+16;
  if(left+w>rect.width-6) left=ev.clientX-rect.left-w-16;
  if(top+h>rect.height-6) top=ev.clientY-rect.top-h-16;
  evtTip.style.left=Math.max(4,left)+"px";
  evtTip.style.top=Math.max(4,top)+"px";
}
function hideEvtTip(){ if(evtTip) evtTip.style.opacity=0; }

/* ---------- Survol (crosshair + tooltip) ---------- */
function showHover(clientX){
  if(!CUR||hoverMarker!==null||!tip) return;
  const rect=svg.getBoundingClientRect();
  const scale=CUR.W/rect.width;
  const mx=(clientX-rect.left)*scale;
  const {start,end,L,T,pw,ph,reb,sx,sy}=CUR;
  const wf=reb.cpram;
  if(mx<L||mx>L+pw||!wf){ hideHover(); return; }
  const t=start+(mx-L)/pw*(end-start);
  const ref=nearestPt(wf,t);
  const xS=sx(ref.t);
  let g=`<line x1="${xS}" y1="${T}" x2="${xS}" y2="${T+ph}" stroke="rgba(0,28,75,.35)" stroke-width="1" stroke-dasharray="3 3"/>`;
  let html=`<div class="tdate">${fmtDate(ref.t)}</div>`;
  for(const k of visibleSeries()){
    const wk=reb[k]; if(!wk) continue;
    const yv=interpY(wk,ref.t), perf=yv-100, pc=perf>=0?"#1f9d57":"#d0432b";
    g+=`<circle cx="${xS}" cy="${sy(yv)}" r="${SERIES[k].fund?4.5:3.5}" fill="${SERIES[k].color}" stroke="#fff" stroke-width="2"/>`;
    html+=`<div class="trow"><span class="tn"><span class="sw" style="background:${SERIES[k].color}"></span>${SERIES[k].short}</span>`+
      `<span class="tv">${fmtNum(yv)} <span style="color:${pc};font-weight:600">(${perf>=0?'+':''}${fmtNum(perf,1)}%)</span></span></div>`;
  }
  const hl=document.getElementById("hoverLayer"); if(hl) hl.innerHTML=g;
  tip.innerHTML=html;
  tip.style.opacity=1;
  const tw=tip.offsetWidth, ch=chartwrap.clientWidth;
  let left=(xS/scale)+14;
  if(left+tw>ch-6) left=(xS/scale)-tw-14;
  tip.style.left=Math.max(4,left)+"px";
  tip.style.top=(T/scale+6)+"px";
}
function hideHover(){ if(tip)tip.style.opacity=0; const h=document.getElementById("hoverLayer"); if(h)h.innerHTML=""; }

/* ---------- Zoom / deplacement / reset ---------- */
function setView(s,e,presetId){
  [s,e]=clampWin(s,e);
  state.start=s; state.end=e; state.rangeId=presetId||null;
  syncActive(); render();
}
if(svg){
  svg.addEventListener("wheel",function(e){
    if(!CUR) return;
    e.preventDefault();
    const rect=svg.getBoundingClientRect(), scale=CUR.W/rect.width;
    const x=(e.clientX-rect.left)*scale;
    const {L,pw}=CUR; if(x<L||x>L+pw) return;
    const span=state.end-state.start;
    const tc=state.start+(x-L)/pw*span;
    const f=e.deltaY<0?ZOOM_IN:ZOOM_OUT;
    let ns=Math.max(MIN_SPAN, Math.min(FULL_SPAN, span*f));
    let s=tc-(tc-state.start)*(ns/span), en=s+ns;
    hideEvtTip();
    setView(s,en,null);
  },{passive:false});

  svg.addEventListener("pointerdown",function(e){
    if(!CUR) return;
    if(e.target.closest && e.target.closest(".evt-marker")) return; // laisser le clic ouvrir le repere (pas de pan)
    const rect=svg.getBoundingClientRect(), scale=CUR.W/rect.width;
    const x=(e.clientX-rect.left)*scale;
    if(x<CUR.L||x>CUR.L+CUR.pw) return;
    drag={x0:e.clientX, s0:state.start, e0:state.end};
    try{svg.setPointerCapture(e.pointerId);}catch(_){}
    svg.classList.add("grabbing"); hideHover();
  });
  svg.addEventListener("pointermove",function(e){
    if(drag){
      const rect=svg.getBoundingClientRect(), scale=CUR.W/rect.width;
      const dxpx=(e.clientX-drag.x0)*scale;
      const span=drag.e0-drag.s0;
      const dt=dxpx/CUR.pw*span;
      let s=drag.s0-dt, en=drag.e0-dt;
      [s,en]=clampWin(s,en);
      state.start=s; state.end=en; state.rangeId=null; syncActive(); render();
    } else {
      showHover(e.clientX);
    }
  });
  const endDrag=function(e){ if(drag){ try{svg.releasePointerCapture(e.pointerId);}catch(_){} drag=null; svg.classList.remove("grabbing"); } };
  svg.addEventListener("pointerup",endDrag);
  svg.addEventListener("pointercancel",endDrag);
  svg.addEventListener("pointerleave",function(){ if(!drag) hideHover(); });
  svg.addEventListener("dblclick",function(){ resetZoom(); });
}
function resetZoom(){ const p=state.lastPreset; setView(p.start,p.end,p.id); }

/* =========================================================================
   MODALE (uniquement si la page contient #modal)
   ========================================================================= */
const modal=document.getElementById("modal"), modalBg=document.getElementById("modalBg");
function openEvent(id){
  const e=EVENTS.find(x=>x.id===id); if(!e||!modal) return;
  document.getElementById("mDate").innerHTML=
    `<span class="badge ${e.cat}">${CAT_LABEL[e.cat]}</span><span>${fmtDate(e.t)}</span><span>Repere n&deg;${e.id}</span>`;
  document.getElementById("mTitle").textContent=e.title;
  document.getElementById("mBody").innerHTML=e.body;
  const cls=e.moveSign>0?"pos":(e.moveSign<0?"neg":"");
  const arrow=e.moveSign>0?"▲":(e.moveSign<0?"▼":"■");
  document.getElementById("mImpact").innerHTML=
    `<div class="il">Impact / mouvement</div>`+
    `<div class="ival mv ${cls}">${arrow} ${e.move}</div>`+
    `<div class="hold"><b>Valeurs concernees :</b> ${e.holdings}</div>`;
  let src=`<div class="sl">Sources</div>`;
  e.sources.forEach(o=>{
    if(o.u) src+=`<a class="src" href="${o.u}" target="_blank" rel="noopener">${o.l} ↗</a>`;
    else src+=`<span class="src">${o.l}</span>`;
  });
  document.getElementById("mSources").innerHTML=src;
  modalBg.classList.add("open"); modal.classList.add("open");
  document.body.style.overflow="hidden";
}
function closeModal(){ if(!modal)return; modalBg.classList.remove("open"); modal.classList.remove("open"); document.body.style.overflow=""; }
if(modalBg){ modalBg.addEventListener("click",closeModal); }
if(modal){ document.getElementById("modalClose").addEventListener("click",closeModal); }
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeModal(); });

/* =========================================================================
   CONTROLES
   ========================================================================= */
function buildControls(){
  const rb=document.getElementById("rangeBtns");
  if(rb){
    RANGES.forEach(r=>{
      const b=document.createElement("button");
      b.className="chip"+(r.id===state.rangeId?" active":"");
      b.textContent=r.label; b.dataset.rid=r.id;
      b.onclick=()=>{ state.lastPreset={start:r.start,end:r.end,id:r.id}; setView(r.start,r.end,r.id); };
      rb.appendChild(b);
    });
  }
  const eb=document.getElementById("epBtns");
  if(eb && CFG.episodes){
    EPISODES.forEach(ep=>{
      const b=document.createElement("button");
      b.className="chip ep"; b.textContent=ep.label; b.dataset.rid="ep-"+ep.id;
      b.onclick=()=>{ state.lastPreset={start:ep.start,end:ep.end,id:"ep-"+ep.id}; setView(ep.start,ep.end,"ep-"+ep.id); };
      eb.appendChild(b);
    });
  }
}
function buildSeriesControls(){
  const sb=document.getElementById("seriesBtns"); if(!sb) return;
  SERIES_ORDER.forEach(k=>{
    const cfg=SERIES[k];
    const b=document.createElement("button");
    b.className="chip series"+(cfg.on?" active":"")+(cfg.fund?" fund":"");
    b.innerHTML=`<span class="dot" style="background:${cfg.color};width:14px;height:4px;border-radius:2px"></span>${cfg.short}`;
    b.dataset.k=k;
    if(cfg.fund){ b.style.cursor="default"; b.title="Toujours affiche"; }
    else b.onclick=()=>{ cfg.on=!cfg.on; b.classList.toggle("active",cfg.on); render(); };
    sb.appendChild(b);
  });
}
function syncActive(){
  document.querySelectorAll("#rangeBtns .chip,#epBtns .chip").forEach(b=>{
    b.classList.toggle("active", b.dataset.rid===state.rangeId);
  });
}

/* ---------- INIT ---------- */
if(svg){
  buildControls();
  buildSeriesControls();
  render();
  let rT; window.addEventListener("resize",()=>{ clearTimeout(rT); rT=setTimeout(render,120); });
}
