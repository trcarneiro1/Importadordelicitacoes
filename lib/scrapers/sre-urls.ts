// SRE URLs for scraping
export const SRE_URLS = [
  'https://sremetropa.educacao.mg.gov.br/',
  'https://sremetropb.educacao.mg.gov.br/',
  'https://sremetropc.educacao.mg.gov.br/',
  'https://srealmenara.educacao.mg.gov.br/',
  'https://srearacuai.educacao.mg.gov.br/',
  'https://srebarbacena.educacao.mg.gov.br/',
  'https://srecbelo.educacao.mg.gov.br/',
  'https://srecarangola.educacao.mg.gov.br/',
  'https://srecaratinga.educacao.mg.gov.br/',
  'https://srecaxambu.educacao.mg.gov.br/',
  'https://sreclafaiete.educacao.mg.gov.br/',
  'https://srefabriciano.educacao.mg.gov.br/',
  'https://srecurvelo.educacao.mg.gov.br/',
  'https://srediamantina.educacao.mg.gov.br/',
  'https://sredivinop.educacao.mg.gov.br/',
  'https://sregvaladares.educacao.mg.gov.br/',
  'https://sreguanhaes.educacao.mg.gov.br/',
  'https://sreitajuba.educacao.mg.gov.br/',
  'https://sreituiutaba.educacao.mg.gov.br/',
  'https://srejanauba.educacao.mg.gov.br/',
  'https://srejanuaria.educacao.mg.gov.br/',
  'https://srejdefora.educacao.mg.gov.br/',
  'https://sreleopoldina.educacao.mg.gov.br/',
  'https://sremanhuacu.educacao.mg.gov.br/',
  'https://sremcarmelo.educacao.mg.gov.br/',
  'https://sremclaros.educacao.mg.gov.br/',
  'https://sremuriae.educacao.mg.gov.br/',
  'https://srenovaera.educacao.mg.gov.br/',
  'https://sreouropreto.educacao.mg.gov.br/',
  'https://sreparaminas.educacao.mg.gov.br/',
  'https://sreparacatu.educacao.mg.gov.br/',
  'https://srepassos.educacao.mg.gov.br/',
  'https://srepatos.educacao.mg.gov.br/',
  'https://srepatrocinio.educacao.mg.gov.br/', // Fixed: added trailing slash
  'https://srepirapora.educacao.mg.gov.br/',
  'https://srepcaldas.educacao.mg.gov.br/',
  'https://srepnova.educacao.mg.gov.br/',
  'https://srepalegre.educacao.mg.gov.br/',
  'https://sresjdelrei.educacao.mg.gov.br/',
  'https://sressparaiso.educacao.mg.gov.br/',
  'https://sreslagoas.educacao.mg.gov.br/',
  'https://sretotoni.educacao.mg.gov.br/',
  'https://sreuba.educacao.mg.gov.br/',
  'https://sreuberaba.educacao.mg.gov.br/',
  'https://sreuberlandia.educacao.mg.gov.br/',
  'https://sreunai.educacao.mg.gov.br/',
  'https://srevarginha.educacao.mg.gov.br/',
];

// Get SRE name from URL
export function getSREName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('.educacao.mg.gov.br', '').replace('sre', 'SRE ');
  } catch {
    return url;
  }
}
